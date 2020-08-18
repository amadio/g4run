#!/usr/bin/env -S awk -f
BEGIN {
	n = 1
	print " Stalled Cycles  Not"
	print "Frontend Backend Stalled Symbol"
	print "........ ....... ....... ............"
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

/\[\.\]/ {
	stalls_b = 100 * $ev["stalled-cycles-backend"] / $ev["cycles"]
	stalls_f = 100 * $ev["stalled-cycles-frontend"] / $ev["cycles"]
	unstalled = 100 - stalls_b - stalls_f
	printf("%7.2f%% %6.2f%% %6.2f%% %s\n", stalls_f, stalls_b, unstalled, $NF) | "sort -n +2 | c++filt"
}

