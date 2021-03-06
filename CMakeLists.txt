cmake_minimum_required(VERSION 3.12 FATAL_ERROR)
cmake_policy(VERSION 3.12...3.18)

project(g4run)

list(INSERT CMAKE_MODULE_PATH 0 ${PROJECT_SOURCE_DIR}/cmake)

find_package(Geant4 REQUIRED gdml)
find_package(Pythia)

add_executable(g4run
  actions.cc
  field.cc
  geometry.cc
  init.cc
  main.cc
  primary.cc
)

separate_arguments(Geant4_CXX_FLAGS)

target_compile_options(g4run PRIVATE ${Geant4_CXX_FLAGS})
target_compile_definitions(g4run PRIVATE ${Geant4_DEFINITIONS})
target_include_directories(g4run PRIVATE ${Geant4_INCLUDE_DIRS})
target_link_libraries(g4run PRIVATE ${Geant4_LIBRARIES})

if(Pythia_FOUND)
  target_compile_definitions(g4run PRIVATE USE_PYTHIA)
  target_link_libraries(g4run PRIVATE Pythia::Pythia)
endif()

include(GNUInstallDirs)

install(TARGETS g4run RUNTIME DESTINATION ${CMAKE_INSTALL_BINDIR})

include(CTest)

if(BUILD_TESTING)
  add_subdirectory(perf)
endif()
