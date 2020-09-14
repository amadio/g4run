BEGIN {
	n = 1

        if (! min_overhead)
		min_overhead = 0.5

	print "                                   Branch  Stalls    Stalls"
	print " Cycles   Instr.    IPC     IPB    Misses  Frontend  Backend  Symbol"
	print "........ ........ ....... ....... ........ ........ ......... ......"
}

/name = / {
	sub(",", "", $0)
	ev[$6] = n++
}

/Total / {
	if (! ev["cycles"] || ! ev["instructions"]) {
		print "Input file does not have necessary data"
		exit (1)
	}
}

/\[\.\]/ && $ev["cycles"] > 0 {
	cycles[$NF] = $ev["cycles"]
	total_cycles += $ev["cycles"]
	instructions[$NF] = $ev["instructions"]
	total_instructions += $ev["instructions"]
	branches = $ev["branches"] > 0 ? $ev["branches"] : 1e100
	ipb[$NF] = $ev["instructions"] / branches
	ipc[$NF] = $ev["instructions"] / $ev["cycles"]
	brmiss[$NF] = 100 * $ev["branch-misses"] / branches
	stalls_b[$NF] = 100 * $ev["stalled-cycles-backend"] / $ev["cycles"]
	stalls_f[$NF] = 100 * $ev["stalled-cycles-frontend"] / $ev["cycles"]
}

END {
	for (symbol in cycles) {
		overhead_c = 100.0 * cycles[symbol] / total_cycles
		overhead_i = 100.0 * instructions[symbol] / total_instructions

		if (overhead_c < min_overhead)
			continue

		printf("%6.3f%%  %6.3f%%  %6.3f  %6.3f  %6.3f%%  %6.3f%%   %6.3f%%  %s\n",
			overhead_c, overhead_i, ipc[symbol], ipb[symbol], brmiss[symbol],
			stalls_f[symbol], stalls_b[symbol], symbol) | "sort -nr | c++filt -p"
	}
}
