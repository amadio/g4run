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

if(NOT DEFINED FIELD)
  set(FIELD "file:${PROJECT_SOURCE_DIR}/CMS.fmap")
endif()

if(NOT DEFINED NEVENTS)
  if(Pythia_FOUND)
    set(EVENTS_PER_CORE 2)
  else()
    set(EVENTS_PER_CORE 256)
  endif()

  math(EXPR NEVENTS "${EVENTS_PER_CORE} * ${NCORES}")
endif()

if(NOT DEFINED ENERGY)
  set(ENERGY 50)
endif()

if(NOT DEFINED PRIMARIES)
  if(Pythia_FOUND)
    set(PRIMARIES pythia)
  else()
    set(PRIMARIES e+ e- pi+ pi- mu- gamma neutron proton)
  endif()
endif()

if(NOT DEFINED METRICS_CPU)
  set(METRICS_CPU {cycles,instructions,branches,branch-misses})
endif()

if(NOT DEFINED METRICS_CACHE)
  set(METRICS_CACHE {instructions,L1-dcache-loads,L1-dcache-load-misses,L1-icache-load-misses})
endif()

execute_process(COMMAND sh -c "${GEANT4_CONFIG} --datasets | awk '{ printf \"%s=%s;\", \$2, \$3 }'"
  OUTPUT_VARIABLE GEANT4_DATASETS OUTPUT_STRIP_TRAILING_WHITESPACE)

foreach(PRIMARY ${PRIMARIES})
  string(REGEX REPLACE ":" "-" TEST ${PRIMARY})
  set(COMMAND $<TARGET_FILE:g4run> --cdash --stats -g ${GDML} -f ${FIELD} -E ${ENERGY} -p ${PRIMARY} -e ${NEVENTS} -j ${NCORES})

  add_test(NAME ${TEST}-record-cpu
    COMMAND ${PERF_EXECUTABLE} record -e ${METRICS_CPU} -o ${TEST}-cpu.perf ${COMMAND})

  add_test(NAME ${TEST}-record-cache
    COMMAND ${PERF_EXECUTABLE} record -e ${METRICS_CACHE} -o ${TEST}-cache.perf ${COMMAND})

  add_test(NAME ${TEST}-record-callgraph
    COMMAND ${PERF_EXECUTABLE} record -e cycles -g -F100 -o ${TEST}.perf ${COMMAND})

  foreach(METRIC callgraph cpu cache)
    set_tests_properties(${TEST}-record-${METRIC}
      PROPERTIES
        LABELS "perf;record"
        ENVIRONMENT "${GEANT4_DATASETS}" PROCESSORS ${NCORES} RUN_SERIAL TRUE)
  endforeach()

  add_test(NAME ${TEST}-report COMMAND
    sh -c "${CMAKE_CURRENT_SOURCE_DIR}/scripts/report.sh ${TEST} | tee ${TEST}.txt")

  set_tests_properties(${TEST}-report
    PROPERTIES
      LABELS "perf;report"
      ATTACHED_FILES "${CMAKE_CURRENT_BINARY_DIR}/${TEST}.svg"
      REQUIRED_FILES "${TEST}.perf;${TEST}-cpu.perf;${TEST}-cache.perf"
      DEPENDS "${TEST}-record-callgraph;${TEST}-record-cpu;${TEST}-record-cache")
endforeach()
