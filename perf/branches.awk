BEGIN {
	n = 1
	if (! min_overhead)
		min_overhead = 0.5

	print " Instr.  Inst/Br Miss% Symbol"
	print "........ ....... ..... ......................"
}

/name =/ {
	sub(",", "", $0)
	ev[$6] = n++
}

/Total/ {
	if (! ev["branches"] || ! ev["branch-misses"] || ! ev["instructions"]) {
		print "Input file does not have necessary data"
		exit (1)
	}
}

/\[\.\]/ {
	period[$NF] = $ev["instructions"]
	total_period += $ev["instructions"]
	if ($ev["branches"] > 0) {
		IpB[$NF] = $ev["instructions"] / $ev["branches"]
		miss_rate[$NF] = 100 * $ev["branch-misses"] / $ev["branches"]
	} else {
		IpB[$NF] = 0
		miss_rate[$NF] = 0
	}
}

END {
	for (symbol in period) {
		overhead = 100.0 * period[symbol] / total_period

		if (overhead < min_overhead)
			continue

		printf("%6.2f%%  %6.2f %5.2f%%  %s\n",
			overhead, IpB[symbol], miss_rate[symbol], symbol) | "sort -rn | c++filt -p"
	}
}
