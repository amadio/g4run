#!/usr/bin/env awk -f
BEGIN {
	min_delta = 0.20
	max_delta = 0.50
	min_overhead = 0.5
}

! /%/ {
	print substr($0, 0, 80)
}

{
	overhead = strtonum($1)
	if (overhead < min_overhead) {
		next
	}
	if ($2 ~ /\.so/) {
		print
		next
	}
	delta = strtonum($2)
	delta_abs = delta >= 0.0 ? delta : -delta
	if (delta_abs / overhead < min_delta) {
		next
	}
	if (delta / overhead >= max_delta && $3 ~ "G4") {
		sub("\\[\\.\\]", "[F]", $0)
	}
	print
}

