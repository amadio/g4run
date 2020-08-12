#!/bin/bash

perf diff -c delta $@ | awk '!/%/{ print substr($0,0,80); } { overhead = strtonum($1); delta = strtonum($2); lib = $3;
          if (overhead < 0.5 || delta < 0.2) next; if (delta >= 1.0 && lib ~ "G4") gsub("\\[\\.\\]", "[F]"); print; }'
