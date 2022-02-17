BEGIN {
	curr_file = 0
}

BEGINFILE {
	curr_file++
	nevents = 1
}

/name = / {
	sub(",", "", $0)
	event[$6] = nevents++
}

/duration/ {
	duration[curr_file] = $(NF-1)
}

/Total / {
	if (! event["instructions"]) {
		data_unavailable = 1
        }
        if (! event["L1-dcache-loads"] || ! event["L1-dcache-load-misses"]) {
                data_unavailable = 1
        }
        if (! event["L1-icache-load-misses"]) {
                data_unavailable = 1
        }
}

/\[\.\]/ && $event["instructions"] > 0 {
	symbol = gensub(".*\\[\\.\\] " , "", "g")
	symtab[symbol] = 1

	total_instructions[curr_file] += $event["instructions"]
	total_L1d_miss[curr_file] += $event["L1-dcache-load-misses"]
	total_L1i_miss[curr_file] += $event["L1-icache-load-misses"]

	instructions[curr_file][symbol] = $event["instructions"]
	L1d_miss[curr_file][symbol] = $event["L1-dcache-load-misses"]
	L1i_miss[curr_file][symbol] = $event["L1-icache-load-misses"]

	dloads = $event["L1-dcache-loads"] > 0 ? $event["L1-dcache-loads"] : 1e100
	L1d_miss_rate[curr_file][symbol] = 100 * $event["L1-dcache-load-misses"] / dloads
}

ENDFILE {
	delete event
}

END {
        if (data_unavailable) {
                print "Input file does not have necessary data"
                exit (1)
        }

        if (! min_overhead)
		min_overhead = 0.5

	if (! dmin_diff)
		dmin_diff = 0.05

	dmin_ratio = 1.0 + dmin_diff
	dmax_ratio = 1.0 - dmin_diff

	if (! imin_diff)
		imin_diff = 0.10

	imin_ratio = 1.0 + imin_diff
	imax_ratio = 1.0 - imin_diff

	print ""
	print " L1 Cache Statistics: Differences per Function"
	print ""
	print "        L1 Data Cache Misses         L1 Instruction Cache Misses"
	print ""
	print "  Prev    Curr     Diff    Ratio    Prev    Curr     Diff    Ratio   Symbol"
	print " ......  ......  ........ .......  ......  ......  ........ .......  ......"

	for (symbol in symtab) {
		overhead = 100.0 * instructions[1][symbol] / total_instructions[1]

		if (overhead < min_overhead)
			continue

		if (use_miss_rate) {
			L1d_miss1 = L1d_miss_rate[1][symbol]
			L1d_miss2 = L1d_miss_rate[2][symbol]
		} else {
			L1d_miss1 = 100 * L1d_miss[1][symbol] / total_L1d_miss[1]
			L1d_miss2 = 100 * L1d_miss[2][symbol] / total_L1d_miss[2]
		}

		L1i_miss1 = 100 * L1i_miss[1][symbol] / total_L1i_miss[1]
		L1i_miss2 = 100 * L1i_miss[2][symbol] / total_L1i_miss[2]

		L1d_miss_diff = L1d_miss2 - L1d_miss1
		L1i_miss_diff = L1i_miss2 - L1i_miss1

		L1d_miss1 = L1d_miss1 > 0 ? L1d_miss1 : 1e100
		L1i_miss1 = L1i_miss1 > 0 ? L1i_miss1 : 1e100

		L1d_miss_ratio = L1d_miss2 / L1d_miss1
		L1i_miss_ratio = L1i_miss2 / L1i_miss1

		if (L1d_miss_ratio > dmax_ratio && L1d_miss_ratio < dmin_ratio \
		 && L1i_miss_ratio > imax_ratio && L1i_miss_ratio < imin_ratio)
			continue

		printf("%6.3f%% %6.3f%% %7.3f%% %7.2f  %6.3f%% %6.3f%% %7.3f%% %7.2f   %s\n",
			L1d_miss1, L1d_miss2, L1d_miss_diff, L1d_miss_ratio,
			L1i_miss1, L1i_miss2, L1i_miss_diff, L1i_miss_ratio,
			symbol) | "sort -n -r -k4"
	}
}
