find_program(PERF_EXECUTABLE NAMES perf)

if(NOT EXISTS ${PERF_EXECUTABLE})
  message(FATAL_ERROR "Could not find perf program")
endif()

find_program(GEANT4_CONFIG NAMES geant4-config HINTS ${Geant4_DIR})

if(NOT EXISTS ${GEANT4_CONFIG})
  message(FATAL_ERROR "Could not find geant4-config script")
endif()

if(NOT DEFINED NCORES)
  cmake_host_system_information(RESULT NCORES QUERY NUMBER_OF_PHYSICAL_CORES)
endif()

if(NOT DEFINED GDML)
  set(GDML ${PROJECT_SOURCE_DIR}/CMS.gdml)
endif()

if(NOT DEFINED NEVENTS)
  if(Pythia_FOUND)
    set(EVENTS_PER_CORE 4)
  else()
    set(EVENTS_PER_CORE 256)
  endif()

  math(EXPR NEVENTS "${EVENTS_PER_CORE} * ${NCORES}")
endif()

if(NOT DEFINED PRIMARIES)
  if(Pythia_FOUND)
    set(PRIMARIES pythia:ttbar)
  else()
    set(PRIMARIES e+ e- pi+ pi- mu- gamma neutron proton)
  endif()
endif()

if(NOT DEFINED ENERGY)
  set(ENERGY 50)
endif()

if(NOT DEFINED METRICS_CORE)
  set(METRICS_CORE {cycles,instructions,branches,branch-misses,stalled-cycles-backend,stalled-cycles-frontend})
endif()

if(NOT DEFINED METRICS_L1)
  set(METRICS_L1 {instructions,L1-dcache-load-misses,L1-dcache-loads,L1-icache-load-misses,L1-icache-loads})
endif()

execute_process(COMMAND sh -c "${GEANT4_CONFIG} --datasets | awk '{ printf \"%s=%s;\", \$2, \$3 }'"
  OUTPUT_VARIABLE GEANT4_DATASETS OUTPUT_STRIP_TRAILING_WHITESPACE)

foreach(PRIMARY ${PRIMARIES})
  string(REGEX REPLACE ":" "-" TEST ${PRIMARY})
  set(COMMAND $<TARGET_FILE:g4run> --stats --cdash -g ${GDML} -e ${NEVENTS} -p ${PRIMARY} -E ${ENERGY} -j ${NCORES})

  add_test(NAME ${TEST}-record-callgraph COMMAND
    ${PERF_EXECUTABLE} record -e cycles -g -F100 -o ${TEST}.perf ${COMMAND})

  add_test(NAME ${TEST}-record-core COMMAND
    ${PERF_EXECUTABLE} record -e ${METRICS_CORE} -o ${TEST}-core.perf ${COMMAND})

  add_test(NAME ${TEST}-record-L1 COMMAND
    ${PERF_EXECUTABLE} record -e ${METRICS_L1} -o ${TEST}-L1.perf ${COMMAND})

  foreach(METRIC callgraph core L1)
    set_tests_properties(${TEST}-record-${METRIC}
      PROPERTIES LABELS "perf;record" ENVIRONMENT "${GEANT4_DATASETS}" PROCESSORS ${NCORES} RUN_SERIAL TRUE)
  endforeach()

  file(COPY treemap/ DESTINATION ${TEST}-treemap)
  add_test(NAME ${TEST}-report COMMAND sh -c "${CMAKE_CURRENT_SOURCE_DIR}/scripts/report.sh ${TEST} | tee ${TEST}.txt")
  set_tests_properties(${TEST}-report PROPERTIES LABELS "perf;report"
    ATTACHED_FILES "${CMAKE_CURRENT_BINARY_DIR}/${TEST}.svg" REQUIRED_FILES "${TEST}.perf;${TEST}-core.perf;${TEST}-L1.perf"
    DEPENDS "${TEST}-record-callgraph;${TEST}-record-core;${TEST}-record-L1")
endforeach()
