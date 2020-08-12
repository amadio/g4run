find_program(PERF_EXECUTABLE NAMES perf)

if(NOT EXISTS ${PERF_EXECUTABLE})
  message(FATAL_ERROR "Could not find perf program")
endif()

if(NOT DEFINED METRICS)
  set(METRICS {cycles,instructions}:S)
endif()

if(NOT DEFINED NCORES)
  cmake_host_system_information(RESULT NCORES QUERY NUMBER_OF_PHYSICAL_CORES)
endif()

if(NOT DEFINED GDML)
  set(GDML ${PROJECT_SOURCE_DIR}/CMS.gdml)
endif()

if(NOT DEFINED NEVENTS)
  math(EXPR NEVENTS "100 * ${NCORES}")
endif()

if(NOT DEFINED PARTICLES)
  set(PARTICLES e+ e- pi+ pi- mu- gamma neutron proton)
endif()

if(NOT DEFINED ENERGIES)
  set(ENERGIES 50)
endif()

foreach(ENERGY ${ENERGIES})
  foreach(PARTICLE ${PARTICLES})
    set(TEST_NAME ${PARTICLE}-${ENERGY}GeV)

    add_test(NAME ${TEST_NAME}
      COMMAND ${PERF_EXECUTABLE} record -e ${METRICS} -o ${TEST_NAME}.data
      $<TARGET_FILE:g4run> --stats --cdash -g ${GDML} -e ${NEVENTS} -p ${PARTICLE} -E ${ENERGY} -j ${NCORES})
    set_tests_properties(${TEST_NAME} PROPERTIES PROCESSORS ${NCORES} PROCESSOR_AFFINITY TRUE LABELS "perf;record")

    add_test(NAME ${TEST_NAME}-report
      COMMAND ${PERF_EXECUTABLE} report -i ${TEST_NAME}.data --stdio -F overhead,dso,symbol -w 0,0,80 --percent-limit 1)
    set_tests_properties(${TEST_NAME}-report PROPERTIES REQUIRED_FILES "${TEST_NAME}.data"
      DEPENDS ${TEST_NAME} LABELS "perf;report")

    add_test(NAME ${TEST_NAME}-diff COMMAND ${CMAKE_CURRENT_SOURCE_DIR}/report.sh ${TEST_NAME}.data.old ${TEST_NAME}.data)
    set_tests_properties(${TEST_NAME}-diff PROPERTIES REQUIRED_FILES "${TEST_NAME}.data;${TEST_NAME}.data.old"
      DEPENDS ${TEST_NAME} FAIL_REGULAR_EXPRESSION "\\[F\\]" LABELS "perf;diff")
  endforeach()
endforeach()
