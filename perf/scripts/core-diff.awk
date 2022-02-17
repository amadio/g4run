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
	if (! event["cycles"] || ! event["instructions"]) {
		print "Input file does not have necessary data"
		exit (1)
	}
}

/\[\.\]/ && $event["cycles"] > 0 {
	symbol = gensub(".*\\[\\.\\] " , "", "g")
	symtab[symbol] = 1
	cycles[curr_file][symbol] = $event["cycles"]
	total_cycles[curr_file] += $event["cycles"]
	instructions[curr_file][symbol] = $event["instructions"]
	total_instructions[curr_file] += $event["instructions"]
}

ENDFILE {
	delete event
}

END {
        if (! min_overhead)
		min_overhead = 0.5
	
	if (! min_change)
		min_change = 0.05

	print ""
	print " Performance changes: hot spots"
	print ""
	printf("  Overall speedups: %+.2f% (time), %+.2f% (cycles), %+.2f% (instructions)\n",
		100 * (duration[1] - duration[2]) / duration[1],
		100 * (total_cycles[1] - total_cycles[2]) / total_cycles[1],
		100 * (total_instructions[1] - total_instructions[2]) / total_instructions[1])

	print ""
	print "           CPU Cycles                       Instructions"
	print ""
	print "  Prev    Curr     Diff    Ratio    Prev    Curr     Diff    Ratio  Symbol"
	print " ......  ......  ........ .......  ......  ......  ........ ......  ......"

	for (symbol in symtab) {
		overhead_c_old = 100.0 * cycles[1][symbol] / total_cycles[1]
		overhead_c_new = 100.0 * cycles[2][symbol] / total_cycles[2]

		if (overhead_c_old < min_overhead && overhead_c_new < min_overhead)
			continue

		overhead_i_old = 100.0 * instructions[1][symbol] / total_instructions[1]
		overhead_i_new = 100.0 * instructions[2][symbol] / total_instructions[2]

		overhead_c = overhead_c_new - overhead_c_old
		overhead_i = overhead_i_new - overhead_i_old

		c = cycles[1][symbol] > 0 ? cycles[1][symbol] : 1e100
		i = instructions[1][symbol] > 0 ? instructions[1][symbol] : 1e100

		ratio_c = cycles[2][symbol] / c
		ratio_i = instructions[2][symbol] / i

		if (ratio_c > 1 - min_change && ratio_c < 1 + min_change)
			continue

		printf("%6.3f%% %6.3f%% %7.3f%% %7.2f  %6.3f%% %6.3f%% %7.3f%% %7.2f  %s\n",
			overhead_c_old, overhead_c_new, overhead_c, ratio_c,
			overhead_i_old, overhead_i_new, overhead_i, ratio_i, symbol) | "sort -n -r -k4"
	}

}
