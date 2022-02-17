#!/usr/bin/env -S awk -f
BEGIN {
	n = 1
}

/name =/ {
	sub(",", "", $0)
	ev[$6] = n++
}

/Total/ {
	if (! ev["instructions"]) {
		data_unavailable = 1
	}
	if (! ev["L1-dcache-loads"] || ! ev["L1-dcache-load-misses"]) {
		data_unavailable = 1
	}
	if (! ev["L1-icache-loads"] || ! ev["L1-icache-load-misses"]) {
		data_unavailable = 1
	}
	if (data_unavailable) {
		print "Input file does not have necessary data"
		exit (1)
	}
}

/\[\.\]/ {
	symbol = gensub(".*\\[\\.\\] " , "", "g")
	total_period += $ev["instructions"]
	period[symbol] = $ev["instructions"]
	dloads = $ev["L1-dcache-loads"] > 0 ? $ev["L1-dcache-loads"] : 1e100
	iloads = $ev["L1-icache-loads"] > 0 ? $ev["L1-icache-loads"] : 1e100
	dIpL[symbol] = $ev["instructions"] / dloads
	iIpL[symbol] = $ev["instructions"] / iloads
	L1d_miss[symbol] = 100 * $ev["L1-dcache-load-misses"] / dloads
	L1i_miss[symbol] = 100 * $ev["L1-icache-load-misses"] / iloads
}

END {
	if (! min_overhead)
		min_overhead = 0.5

	print ""
	print " Performance report: L1 cache"
	print ""
	print "       Instructions/Load Cache Misses"
	print " Instr    L1d     L1i     L1d     L1i   Symbol"
	print "....... ....... ....... ....... ....... ........................."

	for (symbol in period) {
		overhead = 100.0 * period[symbol] / total_period
		if (overhead < min_overhead)
			continue
		
		printf("%5.2f%% %7.2f %7.2f %6.2f%% %6.2f%%  %s\n", 
			overhead, dIpL[symbol], iIpL[symbol],
			L1d_miss[symbol], L1i_miss[symbol], symbol) | "sort -nr"
	}
}
