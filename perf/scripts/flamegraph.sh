#!/usr/bin/env bash

INPUT=$1
SVG=${1%.*}.svg
PNG=${1%.*}.png

# add directory where this script is located to PATH
PATH=$(realpath $(dirname "${BASH_SOURCE[0]}")):$PATH

if [[ -f ${INPUT}.old ]]; then
	TIME_OLD=$(perf report --header-only -i ${INPUT}.old 2>/dev/null | awk '/duration/{ print $(NF-1) }')
	TIME_NEW=$(perf report --header-only -i ${INPUT}     2>/dev/null | awk '/duration/{ print $(NF-1) }')
	SPEEDUP=$(printf "%+.2f%%" $(bc -l <<< "100 * (${TIME_OLD} - ${TIME_NEW}) / ${TIME_OLD}"))
	echo
	echo " Performance changes: callgraph (cycles)"
	echo
	echo "  Overall speedup: $SPEEDUP (time)"
	echo

	if [[ ${INPUT} -nt ${INPUT}.stacks ]]; then
		perf script -i ${INPUT} 2>/dev/null | stackcollapse.pl >| ${INPUT}.stacks
	fi

	if [[ ${INPUT}.old -nt ${INPUT}.stacks.old ]]; then
		perf script -i ${INPUT}.old 2>/dev/null | stackcollapse.pl >| ${INPUT}.stacks.old
	fi

	perf diff ${INPUT}.old ${INPUT} 2>/dev/null |
	awk '/%/{ if ($1 > 0.5 && (strtonum($2) < -0.1 || strtonum($2) > 0.1)) print }'
	diff.pl ${INPUT}.stacks.old ${INPUT}.stacks | flamegraph.pl > ${SVG}
	echo
	echo
	echo "<DartMeasurement name=\"Speedup\" type=\"numeric/float\">$SPEEDUP</DartMeasurement>"
else
	echo
	echo " Performance report: callgraph"
	echo
	perf report -i ${INPUT} -F overhead,comm --percent-limit 2
	perf script -i ${INPUT} | stackcollapse.pl | flamegraph.pl > ${SVG}
fi

if command -v convert >/dev/null; then
	# make plot show in CDash as a PNG if ImageMagick is available
	convert -size 1920 ${SVG} ${PNG}
	echo "<DartMeasurementFile name=\"Flame Graph\" type=\"image/png\">${PWD}/${PNG}</DartMeasurementFile>"
fi
