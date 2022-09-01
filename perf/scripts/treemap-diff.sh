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

/\[.\]/ && $event["cycles"] > 0 {
	comm = $nevents
	dso = $(nevents + 1)
	symbol = gensub(".*\\] " , "", "g")
	data[comm][dso][symbol][curr_file] = $event["cycles"]
	total_cycles[curr_file] += $event["cycles"]
}

ENDFILE {
	delete event
}

END {
	print("id,cycles_old,cycles_new,overhead_old,overhead_new,ratio")
	print("\"all\",,,,,")

	for (comm in data) {
		printf("\"all;%s\",,,,,\n", comm);
		for (dso in data[comm]) {
			printf("\"all;%s;%s\",,,,,\n", comm, dso);
			for (symbol in data[comm][dso]) {
				cycles_old = data[comm][dso][symbol][1]
				cycles_new = data[comm][dso][symbol][2]
				overhead_old = cycles_old / total_cycles[1]
				overhead_new = cycles_new / total_cycles[2]
				ratio = cycles_old > 0 ? cycles_new / cycles_old : 0.0
				printf("\"all;%s;%s;%s\",%d,%d,%.4f,%.4f,%.3f\n",
				  comm, dso, symbol, cycles_old, cycles_new,
				  overhead_old, overhead_new, ratio)
			}
		}
	}
}
' <(${INPUT1}) <(${INPUT2}) >${OUTPUT}
