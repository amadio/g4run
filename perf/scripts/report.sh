#!/usr/bin/env bash

set -ex

# add directory where this script is located to PATH, AWKPATH
export AWKPATH=$(realpath $(dirname "${BASH_SOURCE[0]}"))
export PATH=$AWKPATH:$PATH

for TEST in $@; do
	if [[ -f ${TEST}.perf ]]; then
		perf2csv ${TEST}.perf ${TEST}.csv &
		perf2treemap ${TEST}.perf treemap-${TEST}.csv &
		perf script -i ${TEST}.perf | stackcollapse.pl --addrs >| ${TEST}.stacks &

	fi

	if [[ -f ${TEST}.perf.old ]]; then
		perf2csv ${TEST}.perf.old ${TEST}.old.csv &
		perf script -i ${TEST}.perf.old | stackcollapse.pl --addrs >| ${TEST}.stacks.old &
		csv-diff.sh ${TEST}.perf{.old,} ${TEST}-diff.csv &
		treemap-diff.sh ${TEST}.perf{.old,} treemap-diff-${TEST}.csv &
		[[ -d html ]] && summary.sh ${TEST}.perf{.old,} >| html/diff-config.js &
	fi

	for M in cpu cache; do
		if [[ ${TEST}-${M}.perf -nt ${TEST}-${M}.csv ]]; then
			perf2csv ${TEST}-${M}.perf ${TEST}-${M}.csv &
			perf2treemap ${TEST}-${M}.perf treemap-${TEST}-${M}.csv &
		fi
		if [[ ${TEST}-${M}.perf.old -nt ${TEST}-${M}.old.csv ]]; then
			perf2csv ${TEST}-${M}.perf.old ${TEST}-${M}.old.csv &
			csv-diff.sh ${TEST}-${M}.perf{.old,} ${TEST}-${M}-diff.csv &
		fi
	done

	wait

	if [[ -f ${TEST}.stacks.old ]]; then
		diff.pl ${TEST}.stacks{.old,} | flamegraph.pl >| ${TEST}.svg
		diff.pl ${TEST}.stacks{,.old} | flamegraph.pl >| ${TEST}-inv.svg
	else
		flamegraph.pl < ${TEST}.stacks >| ${TEST}.svg
	fi
done

[[ -d html ]] && cp *.csv *.svg html/data
