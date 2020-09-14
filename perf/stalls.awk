BEGIN {
	n = 1

	if (! min_overhead)
		min_overhead = 0.5

	print "         Stalled  Stalled"
	print "Overhead Frontend Backend  Symbol"
	print "........ ........ ........ ............"
}

/name =/ {
	sub(",", "", $0)
	ev[$6] = n++
}

/Total/ {
	if (! ev["cycles"] || ! ev["stalled-cycles-backend"] || ! ev["stalled-cycles-frontend"]) {
		print "Input file does not have necessary data"
		exit (1)
	}
}

/\[\.\]/ && $ev["cycles"] > 0 {
	period[$NF] = $ev["cycles"]
	total_period += $ev["cycles"]
	stalls_b[$NF] = 100 * $ev["stalled-cycles-backend"] / $ev["cycles"]
	stalls_f[$NF] = 100 * $ev["stalled-cycles-frontend"] / $ev["cycles"]
}

END {
	for (symbol in period) {
		overhead = 100.0 * period[symbol] / total_period

		if (overhead < min_overhead)
			continue

		printf("%6.2f%%  %6.2f%%  %6.2f%%  %s\n",
			overhead, stalls_f[symbol], stalls_b[symbol], symbol) | "sort -rn | c++filt -p"
	}
}
