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
	if (! ev["L1-icache-load-misses"]) {
		data_unavailable = 1
	}
	if (data_unavailable) {
		print "Input file does not have necessary data"
		exit (1)
	}
}

/\[\.\]/ {
	symbol = gensub(".*\\[\\.\\] " , "", "g")

	instructions_total += $ev["instructions"]
	L1d_miss_total += $ev["L1-dcache-load-misses"]
	L1i_miss_total += $ev["L1-icache-load-misses"]

	instructions[symbol] = $ev["instructions"]

	dloads = $ev["L1-dcache-loads"] > 0 ? $ev["L1-dcache-loads"] : 1e100
	dmiss = $ev["L1-dcache-load-misses"] > 0 ? $ev["L1-dcache-load-misses"] : 1e100
	dIpL[symbol] = $ev["instructions"] / dloads
	dIpM[symbol] = $ev["instructions"] / dmiss
	L1d_miss[symbol] = $ev["L1-dcache-load-misses"]
	L1i_miss[symbol] = $ev["L1-icache-load-misses"]
	L1d_miss_rate[symbol] = 100 * $ev["L1-dcache-load-misses"] / dloads
}

END {
	if (! min_overhead)
		min_overhead = 0.5

	print ""
	print " L1 Cache Statistics for Top Functions"
	print ""
	print "           L1i      L1d      L1d   Instr/ Instr/"
	print " Instr.   Misses   Misses   Miss%   Load   Miss   Symbol"
	print "........ ........ ........ ....... ...... ....... ........................."

	for (symbol in instructions) {
		overhead = 100.0 * instructions[symbol] / instructions_total

		if (overhead < min_overhead)
			continue

		L1i_miss_pcnt = 100.0 * L1i_miss[symbol] / L1i_miss_total
		L1d_miss_pcnt = 100.0 * L1d_miss[symbol] / L1d_miss_total

		printf("%6.2f%% %7.2f%% %7.2f%% %6.2f%% %6.2f %7.2f  %s\n",
			overhead, L1i_miss_pcnt, L1d_miss_pcnt, L1d_miss_rate[symbol],
			dIpL[symbol], dIpM[symbol], symbol) | "sort -nr"
	}
}
