#!/usr/bin/env bash

declare -A METRICS

METRICS=(
  [cpu]="{cycles,instructions,branches,branch-misses}"
  [cache]="{instructions,cache-references,cache-misses,L1-dcache-loads,L1-dcache-load-misses,L1-icache-load-misses}"
)

NAME=$1

shift

perf record -a -g -e cycles:pp -F100 -o "${NAME}.perf" -- $@

for M in ${!METRICS[@]}; do
	perf record -F100 -e "${METRICS[$M]}" -o "${NAME}-${M}.perf" -- $@
done
