#!/usr/bin/env bash

INPUT=$1
SVG=${1%.*}.svg
PNG=${1%.*}.png

# add directory where this script is located to PATH
PATH=$(realpath $(dirname "${BASH_SOURCE[0]}")):$PATH

echo
echo " Call Graph Report"
echo

if [[ -f ${INPUT}.old ]]; then
	TIME_OLD=$(perf report --header-only -i ${INPUT}.old 2>/dev/null | awk '/duration/{ print $(NF-1)/1000.0 }')
	TIME_NEW=$(perf report --header-only -i ${INPUT}     2>/dev/null | awk '/duration/{ print $(NF-1)/1000.0 }')
	SPEEDUP=$(bc -l <<< "100.0 * (${TIME_OLD} - ${TIME_NEW}) / ${TIME_OLD}")

	printf "   Before: %.2fs   After: %.2fs   Speedup: %.2f%%\n" ${TIME_OLD} ${TIME_NEW} ${SPEEDUP}

	echo
	echo " Runtime: Differences per Function (cycles, negative means faster)"
	echo

	if [[ ${INPUT} -nt ${INPUT}.stacks ]]; then
		perf script -i ${INPUT} 2>/dev/null | stackcollapse.pl >| ${INPUT}.stacks
	fi

	if [[ ${INPUT}.old -nt ${INPUT}.stacks.old ]]; then
		perf script -i ${INPUT}.old 2>/dev/null | stackcollapse.pl >| ${INPUT}.stacks.old
	fi

	if [[ ${INPUT} -nt ${SVG} ]]; then
		perf diff --stdio ${INPUT}.old ${INPUT} 2>/dev/null |
		awk '/^# (B|\.)/{ printf " "; print substr($0,2,80) } \
		     /%/{ if ($1 > 0.5 && (strtonum($2) < -0.1 || strtonum($2) > 0.1)) print }'
		diff.pl ${INPUT}.stacks.old ${INPUT}.stacks | flamegraph.pl > ${SVG}
	fi

	# inverted flamegraph
	perf diff ${INPUT} ${INPUT}.old 2>/dev/null |
	awk '/^# (B|\.)/{ printf " "; print substr($0,2,80) } \
		/%/{ if ($1 > 0.25 && (strtonum($2) < -0.05 || strtonum($2) > 0.05)) print }'
	diff.pl ${INPUT}.stacks ${INPUT}.stacks.old | flamegraph.pl > ${1%.*}-inv.svg
else
	TIME=$(perf report --header-only -i ${INPUT} 2>/dev/null | awk '/duration/{ print $(NF-1)/1000.0 }')

	echo
        echo " Runtime: ${TIME}s"
        echo

	if [[ ${INPUT} -nt ${SVG} ]]; then
		perf script -i ${INPUT} | stackcollapse.pl | flamegraph.pl > ${SVG}
	fi
fi

echo
echo " Hierarchical Profile"
echo
perf report -i ${INPUT} -q --stdio -g none --hierarchy --percent-limit 0.5

echo " Geant4 Stepping Call Graph"
echo
perf report -i ${INPUT} -q --stdio -F overhead -x -p 'G4SteppingManager::Stepping' --percent-limit 3
