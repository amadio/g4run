#!/usr/bin/env bash

perf report -i ${1:-perf.data} -q -g none -F period,comm,dso,symbol | treemap.pl > ${2:-treemap.json}

