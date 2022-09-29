find_program(PERF_EXECUTABLE NAMES perf)

if(NOT EXISTS ${PERF_EXECUTABLE})
  message(FATAL_ERROR "Could not find perf program")
endif()

find_program(GEANT4_CONFIG NAMES geant4-config HINTS ${Geant4_DIR})

if(NOT EXISTS ${GEANT4_CONFIG})
  message(FATAL_ERROR "Could not find geant4-config script")
endif()

if(NOT DEFINED NCORES)
  cmake_host_system_information(RESULT NCORES QUERY NUMBER_OF_LOGICAL_CORES)
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

execute_process(COMMAND sh -c "${GEANT4_CONFIG} --datasets | awk '{ printf \"%s=%s;\", \$2, \$3 }'"
  OUTPUT_VARIABLE GEANT4_DATASETS OUTPUT_STRIP_TRAILING_WHITESPACE)

file(COPY g4web/ DESTINATION ${CMAKE_CURRENT_BINARY_DIR}/html)
file(MAKE_DIRECTORY ${CMAKE_CURRENT_BINARY_DIR}/html/data)

foreach(PRIMARY ${PRIMARIES})
  string(REGEX REPLACE ":" "-" TEST ${PRIMARY})
  set(COMMAND "$<TARGET_FILE:g4run> --stats -g ${GDML} -f ${FIELD} -E ${ENERGY} -p ${PRIMARY} -e ${NEVENTS} -j ${NCORES}")

  add_test(NAME ${TEST}-record COMMAND
    sh -c "${CMAKE_CURRENT_SOURCE_DIR}/scripts/record.sh ${TEST} ${COMMAND}")

  set_tests_properties(${TEST}-record
    PROPERTIES
      LABELS "perf;record"
      ENVIRONMENT "${GEANT4_DATASETS}" PROCESSORS ${NCORES} RUN_SERIAL TRUE DEPENDS g4run TIMEOUT 3000)

  add_test(NAME ${TEST}-report COMMAND
    sh -c "${CMAKE_CURRENT_SOURCE_DIR}/scripts/report.sh ${TEST}")

  set_tests_properties(${TEST}-report
    PROPERTIES
      LABELS "perf;report"
      REQUIRED_FILES ${TEST}.perf DEPENDS ${TEST}-record)
endforeach()
