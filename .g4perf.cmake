set(CTEST_BUILD_NAME "Geant4 Performance Monitor")

set(ENV{LANG} "C")
set(ENV{LC_ALL} "C")

set(CTEST_DROP_METHOD "http")
set(CTEST_DROP_SITE "cdash.cern.ch")
set(CTEST_DROP_LOCATION "/submit.php?project=Geant4")
set(CTEST_DROP_SITE_CDASH TRUE)

set(CTEST_SOURCE_DIRECTORY ${CMAKE_CURRENT_LIST_DIR})
set(CTEST_BINARY_DIRECTORY ${CMAKE_CURRENT_LIST_DIR}/build)

set(CTEST_USE_LAUNCHERS 1)
set(CTEST_TEST_TIMEOUT 1200)
set(CTEST_CUSTOM_MAXIMUM_PASSED_TEST_OUTPUT_SIZE "100000")
set(CTEST_CUSTOM_MAXIMUM_FAILED_TEST_OUTPUT_SIZE "100000")

if(NOT DEFINED CTEST_SITE)
  site_name(CTEST_SITE)
endif()

if(NOT DEFINED CTEST_CONFIGURATION_TYPE)
  set(CTEST_CONFIGURATION_TYPE RelWithDebInfo)
endif()

if(NOT DEFINED ENV{CTEST_PARALLEL_LEVEL})
  cmake_host_system_information(RESULT CTEST_PARALLEL_LEVEL
    QUERY NUMBER_OF_PHYSICAL_CORES)
endif()

if(DEFINED ENV{CMAKE_GENERATOR})
  set(CTEST_CMAKE_GENERATOR $ENV{CMAKE_GENERATOR})
else()
  execute_process(COMMAND ${CMAKE_COMMAND} --system-information
    OUTPUT_VARIABLE CMAKE_SYSTEM_INFORMATION ERROR_VARIABLE ERROR)
  if(ERROR)
    message(FATAL_ERROR "Could not detect default CMake generator")
  endif()
  string(REGEX REPLACE ".+CMAKE_GENERATOR \"([-0-9A-Za-z ]+)\".*$" "\\1"
    CTEST_CMAKE_GENERATOR "${CMAKE_SYSTEM_INFORMATION}")
endif()

set(CTEST_USE_LAUNCHERS 1)
set(CTEST_BUILD_OPTIONS -DBUILD_TESTING=ON $ENV{CTEST_BUILD_OPTIONS})

if(EXISTS ${CTEST_BINARY_DIRECTORY}/CMakeCache.txt)
  execute_process(COMMAND ${CMAKE_COMMAND} --build ${CTEST_BINARY_DIRECTORY} --target clean)
  file(REMOVE ${CTEST_BINARY_DIRECTORY}/CMakeCache.txt)
endif()

list(APPEND CTEST_NOTES_FILES ${CTEST_BINARY_DIRECTORY}/CMakeCache.txt)

ctest_start(Experimental)
ctest_configure(OPTIONS "${CTEST_BUILD_OPTIONS}")
ctest_read_custom_files(${CTEST_BINARY_DIRECTORY})
ctest_build()
ctest_test()
ctest_submit()