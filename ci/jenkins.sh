#!/bin/bash -l

set -ex

: ${WORKSPACE:=${PWD}}
: ${REPOSITORY:=${WORKSPACE}/git/geant4.git}

: ${CCACHE_DIR:=${WORKSPACE}/ccache}
: ${CCACHE_BASEDIR:=${WORKSPACE}/build}
: ${CCACHE_NOHASHDIR:=true}

[[ -d ${CCACHE_DIR} ]] || mkdir -p ${CCACHE_DIR}

export CCACHE_DIR CCACHE_BASEDIR CCACHE_HASHDIR

: ${CC:=/usr/bin/cc} ${CXX:=/usr/bin/c++} ${CXXSTD:=17}
: ${CXXFLAGS:=-O2 -DNDEBUG -march=native -fno-omit-frame-pointer -g -pipe}

if [[ ! -d ${REPOSITORY} ]]; then
	echo "Geant4 repository needs to be a bare clone at ${REPOSITORY}!"
	exit 1
fi

case ${gitlabActionType} in
	PUSH)
		GIT_COMMIT=${gitlabAfter}
		GIT_PREVIOUS_COMMIT=${gitlabBefore}
	;;

	NOTE|MERGE)
		GIT_COMMIT=${gitlabMergeRequestLastCommit}
		GIT_PREVIOUS_COMMIT=$(git -C ${REPOSITORY} merge-base ${gitlabTargetBranch} ${GIT_COMMIT})
	;;

	*)
		: ${GIT_COMMIT=?}
		: ${GIT_PREVIOUS_COMMIT=?}
	;;
esac

git -C ${REPOSITORY} fetch origin ${GIT_COMMIT}
git -C ${REPOSITORY} fetch origin ${GIT_PREVIOUS_COMMIT}

echo "Comparing ${GIT_PREVIOUS_COMMIT} (before) with ${GIT_COMMIT} (after)"

rm -rf ${WORKSPACE}/build

if [[ $(du -sm ${WORKSPACE}/install | cut -f1) -gt 50000 ]]; then
	find ${WORKSPACE}/install -maxdepth 1 -not -mtime -7 -exec rm -rf {} \;
fi

for VERSION in ${GIT_COMMIT} ${GIT_PREVIOUS_COMMIT}; do
	SHA=$(git -C ${REPOSITORY} rev-parse --short $VERSION)

	SOURCE_DIR=${WORKSPACE}/src/geant4-${SHA}
	BINARY_DIR=${WORKSPACE}/build/geant4-${SHA}
	INSTALL_DIR=${WORKSPACE}/install/geant4-${SHA}

	if [[ ! -d ${SOURCE_DIR} ]]; then
		git -C ${REPOSITORY} worktree add ${SOURCE_DIR} ${SHA}
	fi

	declare -a BUILD_OPTIONS

	BUILD_OPTIONS=(
		-DCMAKE_BUILD_TYPE=RelWithDebInfo
		-DCMAKE_SKIP_RPATH=OFF
		-DCMAKE_SKIP_INSTALL_RPATH=OFF
		-DCMAKE_INSTALL_RPATH='$ORIGIN'
		-DCMAKE_C_COMPILER=${CC}
		-DCMAKE_CXX_COMPILER=${CXX}
		-DCMAKE_CXX_STANDARD=${CXXSTD}
		-DCMAKE_C_COMPILER_LAUNCHER=ccache
		-DCMAKE_CXX_COMPILER_LAUNCHER=ccache
		"-DCMAKE_CXX_FLAGS_RELWITHDEBINFO=${CXXFLAGS} -fdebug-prefix-map=geant4-${SHA}=geant4"
		-DCMAKE_INSTALL_PREFIX=${INSTALL_DIR}
		-DGEANT4_INSTALL_DATA=OFF
		-DGEANT4_INSTALL_DATADIR=/cvmfs/geant4.cern.ch/share/data
		-DGEANT4_BUILD_MULTITHREADED=ON
		-DGEANT4_BUILD_STORE_TRAJECTORY=OFF
		-DGEANT4_BUILD_VERBOSE_CODE=OFF
		-DGEANT4_USE_FREETYPE=OFF
		-DGEANT4_USE_G3TOG4=OFF
		-DGEANT4_USE_GDML=ON
		-DGEANT4_USE_HDF5=OFF
		-DGEANT4_USE_INVENTOR=OFF
		-DGEANT4_USE_OPENGL_X11=OFF
		-DGEANT4_USE_PYTHON=OFF
		-DGEANT4_USE_RAYTRACER_X11=OFF
		-DGEANT4_USE_SMARTSTACK=OFF
		-DGEANT4_USE_SYSTEM_CLHEP=OFF
		-DGEANT4_USE_SYSTEM_EXPAT=ON
		-DGEANT4_USE_SYSTEM_ZLIB=ON
	)

	if [ ! -d ${INSTALL_DIR} ]; then
		cmake -S ${SOURCE_DIR} -B ${BINARY_DIR} "${BUILD_OPTIONS[@]}"
		cmake --build ${BINARY_DIR} --parallel $(($(nproc) - 2)) --target install
	fi
done

for VERSION in ${GIT_PREVIOUS_COMMIT} ${GIT_COMMIT}; do
	SHA=$(git -C ${REPOSITORY} rev-parse --short $VERSION)

	SOURCE_DIR=${WORKSPACE}
	BINARY_DIR=${WORKSPACE}/build/g4run
	INSTALL_DIR=${WORKSPACE}/install/geant4-${SHA}

	BUILD_OPTIONS=(
		-DCMAKE_BUILD_TYPE=RelWithDebInfo
		-DCMAKE_C_COMPILER=${CC}
		-DCMAKE_CXX_COMPILER=${CXX}
		-DCMAKE_CXX_STANDARD=${CXXSTD}
		"-DCMAKE_CXX_FLAGS_RELWITHDEBINFO=${CXXFLAGS}"
        	-DCMAKE_PREFIX_PATH=${INSTALL_DIR}
		-DCMAKE_SKIP_RPATH=OFF
		-DCMAKE_SKIP_INSTALL_RPATH=OFF
		-DCMAKE_INSTALL_RPATH='$ORIGIN/../$LIB'
		-DCMAKE_INSTALL_PREFIX=${INSTALL_DIR}
        	-DCMAKE_SKIP_INSTALL_RPATH=OFF
	)

	rm -f ${BINARY_DIR}/CMakeCache.txt
	cmake -S ${SOURCE_DIR} -B ${BINARY_DIR} "${BUILD_OPTIONS[@]}"
	cmake --build ${BINARY_DIR} --parallel $(($(nproc) - 2)) --target install

	(cd ${BINARY_DIR} && ctest -VV)
done

for VERSION in ${GIT_PREVIOUS_COMMIT} ${GIT_COMMIT}; do
	SHA=$(git -C ${REPOSITORY} rev-parse --short $VERSION)
	SOURCE_DIR=${WORKSPACE}/src/geant4-${SHA}
	git -C ${REPOSITORY} worktree remove ${SOURCE_DIR}
done

sed -i "1s@^@Comparing ${GIT_PREVIOUS_COMMIT} (before) with ${GIT_COMMIT} (after)\n\n@" \
	${WORKSPACE}/build/g4run/perf/pythia.txt
