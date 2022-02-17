#!/usr/bin/env bash

# add directory where this script is located to PATH, AWKPATH
export AWKPATH=$(realpath $(dirname "${BASH_SOURCE[0]}"))
export PATH=$AWKPATH:$PATH

for TEST in $@; do
	for M in cpu cache; do
		if [[ ${TEST}-${M}.perf -nt ${TEST}-${M}.txt ]]; then
			[[ -f ${TEST}-${M}.txt ]] && mv ${TEST}-${M}.txt{,.old}
			perf report --stdio --header --percent-limit 0 \
				-F period,dso,symbol -i ${TEST}-${M}.perf >| ${TEST}-${M}.txt
		fi

		if [[ -f ${TEST}-${M}.txt.old ]]; then
			awk -f ${M}-diff.awk ${TEST}-${M}.txt.old ${TEST}-${M}.txt
		fi
	done

	for M in cpu cache; do
		awk -f ${M}.awk ${TEST}-${M}.txt
	done

	[[ -f ${TEST}.perf ]] && flamegraph.sh ${TEST}.perf
	[[ -d ${TEST}-treemap ]] && treemap.sh ${TEST}.perf ${TEST}-treemap/treemap.json
done
