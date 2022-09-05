#!/usr/bin/env bash

declare -A METRICS

METRICS=(
  [cpu]="{cycles,instructions,branches,branch-misses}"
  [cache]="{cycles,instructions,cache-references,cache-misses,L1-dcache-loads,L1-dcache-load-misses}"
)

NAME=$1

shift

perf record -a -g -e cycles:pp -F500 -o "${NAME}.perf" -- $@

for M in ${!METRICS[@]}; do
	perf record -F1000 -e "${METRICS[$M]}" -o "${NAME}-${M}.perf" -- $@
done
