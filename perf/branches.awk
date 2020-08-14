#!/usr/bin/env -S awk -f
BEGIN {
	n = 1
	print "Inst/Br  Miss%  Symbol"
	print ".......  .....  ............"
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
	instructions_per_branch = $ev["instructions"] / $ev["branches"]
	branch_miss_percent = 100 * $ev["branch-misses"] / $ev["branches"]
	printf("%7.2f %5.2f%%  %s\n", instructions_per_branch, branch_miss_percent, $NF) | "sort -rn +1 | c++filt"
}

