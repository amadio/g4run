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
        if (! event["L1-icache-loads"] || ! event["L1-icache-load-misses"]) {
                data_unavailable = 1
        }
        if (data_unavailable) {
                print "Input file does not have necessary data"
                exit (1)
        }
}

/\[\.\]/ && $event["instructions"] > 0 {
	symbol = gensub(".*\\[\\.\\] " , "", "g")
	symtab[symbol] = 1
	instructions[curr_file][symbol] = $event["instructions"]
	total_instructions[curr_file] += $event["instructions"]

	dloads = $event["L1-dcache-loads"] > 0 ? $event["L1-dcache-loads"] : 1e100
        iloads = $event["L1-icache-loads"] > 0 ? $event["L1-icache-loads"] : 1e100

	L1d_miss[curr_file][symbol] = 100 * $event["L1-dcache-load-misses"] / dloads
	L1i_miss[curr_file][symbol] = 100 * $event["L1-icache-load-misses"] / iloads
}

ENDFILE {
	delete event
}

END {
        if (! min_overhead)
		min_overhead = 0.5

	print ""
	print " Performance changes: L1 cache"
	print ""
	printf("  Overall speedups: %+.2f%% (time) %+.2f%% (instructions)\n",
		100 * (duration[1] - duration[2]) / duration[1],
		100 * (total_instructions[1] - total_instructions[2]) / total_instructions[1])

	print ""
	print "        L1 Data Cache Misses         L1 Instruction Cache Misses"
	print ""
	print "  Prev    Curr     Diff    Ratio    Prev    Curr     Diff    Ratio  Symbol"
	print " ......  ......  ........ .......  ......  ......  ........ ......  ......"

	for (symbol in symtab) {
		overhead = 100.0 * instructions[1][symbol] / total_instructions[1]

		if (overhead < min_overhead)
			continue

		L1d_miss_diff = L1d_miss[2][symbol] - L1d_miss[1][symbol]
		L1i_miss_diff = L1i_miss[2][symbol] - L1i_miss[1][symbol]

		L1d_miss1 = L1d_miss[1][symbol] > 0 ? L1d_miss[1][symbol] : 1e100
		L1i_miss1 = L1i_miss[1][symbol] > 0 ? L1i_miss[1][symbol] : 1e100

		L1d_miss_ratio = L1d_miss[2][symbol] / L1d_miss1
		L1i_miss_ratio = L1i_miss[2][symbol] / L1i_miss1

		if (L1d_miss_diff < 0.1 && L1i_miss_diff < 0.1)
			continue

		if (L1d_miss_ratio < 1.1 && L1d_miss_ratio > 0.9 && L1i_miss_ratio < 2)
			continue

		printf("%6.3f%% %6.3f%% %7.3f%% %7.2f  %6.3f%% %6.3f%% %7.3f%% %7.2f  %s\n",
			L1d_miss[1][symbol], L1d_miss[2][symbol], L1d_miss_diff, L1d_miss_ratio,
			L1i_miss[1][symbol], L1i_miss[2][symbol], L1i_miss_diff, L1i_miss_ratio,
			symbol) | "sort -nr"
	}
}
