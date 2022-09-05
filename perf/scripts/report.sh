#!/usr/bin/env bash

set -ex

# add directory where this script is located to PATH, AWKPATH
export AWKPATH=$(realpath $(dirname "${BASH_SOURCE[0]}"))
export PATH=$AWKPATH:$PATH

for TEST in $@; do
	if [[ -f ${TEST}.perf ]]; then
		perf2csv ${TEST}.perf ${TEST}.csv
		perf2treemap ${TEST}.perf treemap-${TEST}.csv
		perf script report stackcollapse -i ${TEST}.perf >| ${TEST}.stacks

		if [[ ! -f ${TEST}.perf.old ]]; then
			flamegraph.pl < ${TEST}.stacks > ${TEST}.svg
		else
			perf2csv ${TEST}.perf.old ${TEST}.old.csv
			perf script report stackcollapse -i ${TEST}.perf.old >| ${TEST}.stacks.old
			diff.pl ${TEST}.stacks{.old,} | flamegraph.pl >| ${TEST}.svg
			diff.pl ${TEST}.stacks{,.old} | flamegraph.pl >| ${TEST}-inv.svg
			treemap-diff.sh ${TEST}.perf{.old,} treemap-diff-${TEST}.csv
		fi
	fi

	for M in cpu cache; do
		if [[ ${TEST}-${M}.perf -nt ${TEST}-${M}.csv ]]; then
			perf2csv ${TEST}-${M}.perf ${TEST}-${M}.csv
			perf2treemap ${TEST}-${M}.perf treemap-${TEST}-${M}.csv
		fi
		if [[ ${TEST}-${M}.perf.old -nt ${TEST}-${M}.old.csv ]]; then
			perf2csv ${TEST}-${M}.perf.old ${TEST}-${M}.old.csv
			csv-diff.sh ${TEST}-${M}.perf{.old,} ${TEST}-${M}-diff.csv
		fi
	done
done
