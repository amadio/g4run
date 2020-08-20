#!/usr/bin/env awk -f
BEGIN {
	min_delta = 0.5
	max_delta = 2.0
	min_overhead = 0.5
}

! /%/ {
	print substr($0, 0, 80)
}

{
	overhead = strtonum($1)
	delta = strtonum($2)
	delta_abs = delta >= 0.0 ? delta : -delta
	if (overhead < min_overhead || delta_abs < min_delta) {
		next
	}
	if (delta >= max_delta && $3 ~ "G4") {
		sub("\\[\\.\\]", "[F]", $0)
	}
	print
}

