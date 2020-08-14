#!/usr/bin/env -S awk -f
BEGIN {
	n = 1
	print "  Miss%  Symbol"
	print " ......  ............"
}

/name =/ {
	sub(",", "", $0)
	ev[$6] = n++
}

/Total/ {
	if (! ev["L1-dcache-loads"] || ! ev["L1-dcache-load-misses"]) {
		print "Input file does not have necessary data"
		exit (1)
	}
}

/\[\.\]/ {
	cache_miss_percent = 100 * $ev["L1-dcache-load-misses"] / $ev["L1-dcache-loads"]
	printf("%6.2f%%  %s\n", cache_miss_percent, $NF) | "sort -nr +1 | c++filt"
}

