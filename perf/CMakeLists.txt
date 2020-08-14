find_program(PERF_EXECUTABLE NAMES perf)

if(NOT EXISTS ${PERF_EXECUTABLE})
  message(FATAL_ERROR "Could not find perf program")
endif()

if(NOT DEFINED HW_METRICS)
  set(HW_METRICS {cycles,instructions,branches,branch-misses,cache-references,cache-misses}:S)
endif()

if(NOT DEFINED CACHE_METRICS)
  set(CACHE_METRICS {instructions,L1-dcache-load-misses,L1-dcache-loads,L1-icache-load-misses,L1-icache-loads}:S)
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
      COMMAND ${PERF_EXECUTABLE} record -e ${HW_METRICS} -o ${TEST_NAME}.data
      $<TARGET_FILE:g4run> --stats --cdash -g ${GDML} -e ${NEVENTS} -p ${PARTICLE} -E ${ENERGY} -j ${NCORES})
    set_tests_properties(${TEST_NAME} PROPERTIES PROCESSORS ${NCORES} PROCESSOR_AFFINITY TRUE LABELS "perf;record")

    add_test(NAME ${TEST_NAME}-report
      COMMAND sh -c "${PERF_EXECUTABLE} report -i ${TEST_NAME}.data --header --no-demangle -F period,dso,symbol --percent-limit 0.5 > ${TEST_NAME}.txt")
    set_tests_properties(${TEST_NAME}-report PROPERTIES REQUIRED_FILES "${TEST_NAME}.data"
      DEPENDS ${TEST_NAME} LABELS "perf;report")

    add_test(NAME ${TEST_NAME}-diff
      COMMAND sh -c "perf diff -c delta ${TEST_NAME}.data.old ${TEST_NAME}.data | awk -f ${CMAKE_CURRENT_SOURCE_DIR}/filter.awk")
    set_tests_properties(${TEST_NAME}-diff PROPERTIES REQUIRED_FILES "${TEST_NAME}.data;${TEST_NAME}.data.old"
      DEPENDS ${TEST_NAME} FAIL_REGULAR_EXPRESSION "\\[F\\]" LABELS "perf;diff")

    add_test(NAME ${TEST_NAME}-report-ipc COMMAND awk -f ${CMAKE_CURRENT_SOURCE_DIR}/ipc.awk ${TEST_NAME}.txt)
    set_tests_properties(${TEST_NAME}-report-ipc PROPERTIES REQUIRED_FILES "${TEST_NAME}.txt"
      DEPENDS ${TEST_NAME}-report LABELS "perf;report;ipc")

    add_test(NAME ${TEST_NAME}-report-cache COMMAND awk -f ${CMAKE_CURRENT_SOURCE_DIR}/cache.awk ${TEST_NAME}.txt)
    set_tests_properties(${TEST_NAME}-report-cache PROPERTIES REQUIRED_FILES "${TEST_NAME}.txt"
      DEPENDS ${TEST_NAME}-report LABELS "perf;report;cache")

    add_test(NAME ${TEST_NAME}-report-branches COMMAND awk -f ${CMAKE_CURRENT_SOURCE_DIR}/branches.awk ${TEST_NAME}.txt)
    set_tests_properties(${TEST_NAME}-report-branches PROPERTIES REQUIRED_FILES "${TEST_NAME}.txt"
      DEPENDS ${TEST_NAME}-report LABELS "perf;report;branches")


    add_test(NAME ${TEST_NAME}-cache
      COMMAND ${PERF_EXECUTABLE} record -e ${CACHE_METRICS} -o ${TEST_NAME}.cache.data
      $<TARGET_FILE:g4run> --stats --cdash -g ${GDML} -e ${NEVENTS} -p ${PARTICLE} -E ${ENERGY} -j ${NCORES})
    set_tests_properties(${TEST_NAME}-cache PROPERTIES PROCESSORS ${NCORES} PROCESSOR_AFFINITY TRUE LABELS "perf;record")

    add_test(NAME ${TEST_NAME}-cache-report COMMAND sh -c
      "${PERF_EXECUTABLE} report -i ${TEST_NAME}.cache.data --header --no-demangle -F period,dso,symbol --percent-limit 0.5 > ${TEST_NAME}.cache.txt")
    set_tests_properties(${TEST_NAME}-cache-report PROPERTIES REQUIRED_FILES "${TEST_NAME}.cache.data"
      DEPENDS ${TEST_NAME}-cache LABELS "perf;report")

    add_test(NAME ${TEST_NAME}-report-L1-dcache COMMAND awk -f ${CMAKE_CURRENT_SOURCE_DIR}/L1-dcache.awk ${TEST_NAME}.cache.txt)
    set_tests_properties(${TEST_NAME}-report-L1-dcache PROPERTIES REQUIRED_FILES "${TEST_NAME}.cache.txt"
      DEPENDS ${TEST_NAME}-cache-report LABELS "perf;report;L1-dcache")

    add_test(NAME ${TEST_NAME}-report-L1-icache COMMAND awk -f ${CMAKE_CURRENT_SOURCE_DIR}/L1-icache.awk ${TEST_NAME}.cache.txt)
    set_tests_properties(${TEST_NAME}-report-L1-icache PROPERTIES REQUIRED_FILES "${TEST_NAME}.cache.txt"
      DEPENDS ${TEST_NAME}-cache-report LABELS "perf;report;L1-icache")

    add_test(NAME ${TEST_NAME}-cache-diff
      COMMAND sh -c "perf diff -c delta ${TEST_NAME}.cache.data.old ${TEST_NAME}.cache.data | awk -f ${CMAKE_CURRENT_SOURCE_DIR}/filter.awk")
    set_tests_properties(${TEST_NAME}-cache-diff PROPERTIES REQUIRED_FILES "${TEST_NAME}.cache.data;${TEST_NAME}.cache.data.old"
      DEPENDS ${TEST_NAME}-cache FAIL_REGULAR_EXPRESSION "\\[F\\]" LABELS "perf;diff")
  endforeach()
endforeach()