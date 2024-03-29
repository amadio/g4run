BEGIN {
	nevents = 1
}

/name = / {
	sub(",", "", $0)
	ev[$6] = nevents++
}

/Total / {
	if (! ev["cycles"] || ! ev["instructions"]) {
		print "Input file does not have necessary data"
		exit (1)
	}
}

/\[\.\]/ && $ev["cycles"] > 0 {
	symbol = gensub(".*\\[\\.\\] " , "", "g")
	cycles[symbol] = $ev["cycles"]
	total_cycles += $ev["cycles"]
	instructions[symbol] = $ev["instructions"]
	total_instructions += $ev["instructions"]
	branches = $ev["branches"] > 0 ? $ev["branches"] : 1e100
	ipb[symbol] = $ev["instructions"] / branches
	ipc[symbol] = $ev["instructions"] / $ev["cycles"]
	brmiss[symbol] = 100 * $ev["branch-misses"] / branches
	stalls_b[symbol] = 100 * $ev["stalled-cycles-backend"] / $ev["cycles"]
	stalls_f[symbol] = 100 * $ev["stalled-cycles-frontend"] / $ev["cycles"]
}

END {
        if (! min_overhead)
		min_overhead = 0.5

	print ""
	print " Performance report: hot spots"
	print ""
	print "                                   Branch  Stalls    Stalls"
	print " Cycles   Instr.    IPC     IPB    Misses  Frontend  Backend  Symbol"
	print "........ ........ ....... ....... ........ ........ ......... ......"

	for (symbol in cycles) {
		overhead_c = 100.0 * cycles[symbol] / total_cycles
		overhead_i = 100.0 * instructions[symbol] / total_instructions

		if (overhead_c < min_overhead)
			continue

		printf("%6.3f%%  %6.3f%%  %6.3f  %6.3f  %6.3f%%  %6.3f%%   %6.3f%%  %s\n",
			overhead_c, overhead_i, ipc[symbol], ipb[symbol], brmiss[symbol],
			stalls_f[symbol], stalls_b[symbol], symbol) | "sort -nr"
	}
}
