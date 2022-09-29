#!/usr/bin/env bash

INPUT1="perf report -i ${1:-perf.data.old} --header --percent-limit 0 -g none -F period,comm,dso,symbol"
INPUT2="perf report -i ${2:-perf.data} --header --percent-limit 0 -g none -F period,comm,dso,symbol"
OUTPUT=${3:-${1%%.*}-diff.csv}

awk '
BEGIN {
	curr_file = 0
}

BEGINFILE {
	curr_file++
	nevents = 1
}

/name = / {
	sub(",", "", $0)
	sub(":.*", "", $6)
	if ($6 != "dummy") {
		evname[nevents] = gensub("[^a-zA-Z0-9]", "_", "g", $6)
		event[$6] = nevents++
	}
}

/\[.\]/ && $1 > 0 {
	comm = $nevents
	dso = $(nevents + 1)
	symbol = gensub(".*\\] " , "", "g")
	for (e in evname) {
		data[comm][dso][symbol][curr_file][e] = $e
		total[curr_file][e] += $e
	}
}

ENDFILE {
	delete event
}

END {
	for(i in evname)
		printf("%s_old,%s_new,", evname[i], evname[i]);
	printf("comm,dso,symbol");
	printf("\n");

	for (comm in data) {
		for (dso in data[comm]) {
			for (symbol in data[comm][dso]) {
				for (e in evname) {
					e_old = data[comm][dso][symbol][1][e]
					e_new = data[comm][dso][symbol][2][e]
					printf("%d,%d,", e_old, e_new)
				}
				printf("\"%s\",\"%s\",\"%s\"\n", comm, dso, symbol);
			}
		}
	}
}
' <(${INPUT1}) <(${INPUT2}) >${OUTPUT}
