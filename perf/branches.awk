#!/usr/bin/env -S awk -f
BEGIN {
	n = 1
	print "Branch%   Miss%  Symbol"
	print ".......   .....  ............"
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
	branch_percent = 100 * $ev["branches"] / $ev["instructions"]
	branch_miss_percent = 100 * $ev["branch-misses"] / $ev["branches"]
	printf("%6.2f%% %6.2f%%  %s\n", branch_percent, branch_miss_percent, $NF) | "sort -rn +1 | c++filt"
}

