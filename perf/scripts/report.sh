#!/usr/bin/env bash

# add directory where this script is located to AWKPATH, PATH
export AWKPATH=$(realpath $(dirname "${BASH_SOURCE[0]}"))
export PATH=$(realpath $(dirname "${BASH_SOURCE[0]}")):$PATH

for TEST in $@; do
	[[ -f ${TEST}.perf ]] && flamegraph.sh ${TEST}.perf

	for M in core L1; do
		if [[ ${TEST}-${M}.perf -nt ${TEST}-${M}.txt ]]; then
			[[ -f ${TEST}-${M}.txt ]] && mv ${TEST}-${M}.txt{,.old}
			perf report --header --percent-limit 0 \
				-F period,dso,symbol -i ${TEST}-${M}.perf >| ${TEST}-${M}.txt
		fi

		if [[ -f ${TEST}-${M}.txt.old ]]; then
			awk -f ${M}-diff.awk ${TEST}-${M}.txt.old ${TEST}-${M}.txt
		fi
	done

	for M in core L1; do
		awk -f ${M}.awk ${TEST}-${M}.txt
	done
done
