#.rst:
# FindPythia
# -------
#
# Find the Pythia library header and define variables.
#
# Imported Targets
# ^^^^^^^^^^^^^^^^
#
# This module defines :prop_tgt:`IMPORTED` target ``Pythia::Pythia``,
# if Pythia 8.x has been found
#
# Result Variables
# ^^^^^^^^^^^^^^^^
#
# This module defines the following variables:
#
# ::
#
#   Pythia_FOUND          - True if Pythia is found.
#   Pythia_INCLUDE_DIRS   - Where to find Pythia8/Pythia.h
#
# ::
#
#   Pythia_VERSION        - The version of Pythia found (x.y.z)
#   Pythia_VERSION_MAJOR  - The major version of Pythia
#   Pythia_VERSION_MINOR  - The minor version of Pythia
#   Pythia_VERSION_PATCH  - The patch version of Pythia

find_path(Pythia_INCLUDE_DIR NAME Pythia8/Pythia.h PATH_SUFFIXES include)

if(NOT Pythia_LIBRARY)
  find_library(Pythia_LIBRARY NAMES pythia8 Pythia8)
endif()

mark_as_advanced(Pythia_INCLUDE_DIR Pythia_LIBRARY)

if(Pythia_INCLUDE_DIR AND EXISTS "${Pythia_INCLUDE_DIR}/Pythia8/Pythia.h")
  file(STRINGS "${Pythia_INCLUDE_DIR}/Pythia8/Pythia.h" Pythia_H REGEX "^#define PYTHIA_VERSION+[ ]+[0-9\.]+$")
  string(REGEX REPLACE ".+PYTHIA_VERSION[ ]+([0-9\.]+)$" "\\1" Pythia_VERSION "${Pythia_H}")
endif()

include(FindPackageHandleStandardArgs)
find_package_handle_standard_args(Pythia
  REQUIRED_VARS Pythia_LIBRARY Pythia_INCLUDE_DIR VERSION_VAR Pythia_VERSION)

if(Pythia_FOUND)
  set(Pythia_INCLUDE_DIRS "${Pythia_INCLUDE_DIR}")

  if(NOT Pythia_LIBRARIES)
    set(Pythia_LIBRARIES ${Pythia_LIBRARY})
  endif()

  if(NOT TARGET Pythia::Pythia)
    add_library(Pythia::Pythia UNKNOWN IMPORTED)
    set_target_properties(Pythia::Pythia PROPERTIES
      IMPORTED_LOCATION "${Pythia_LIBRARY}"
      INTERFACE_INCLUDE_DIRECTORIES "${Pythia_INCLUDE_DIRS}")
  endif()
endif()
