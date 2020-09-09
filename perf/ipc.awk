#!/usr/bin/env -S awk -f
BEGIN {
	n = 1
	print "   IPC Symbol"
	print "...... ............"
}

/name =/ {
	sub(",", "", $0)
	ev[$6] = n++
}

/Total/ {
	if (! ev["cycles"] || ! ev["instructions"]) {
		print "Input file does not have necessary data"
		exit (1)
	}
}

/\[\.\]/ {
	ipc = $ev["instructions"] / $ev["cycles"]
	printf("%6.3f %s\n", ipc, $NF) | "sort -n | c++filt -p"
}

