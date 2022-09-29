#!/usr/bin/env bash

OLD=${1:-perf.data.old}
NEW=${2:-perf.data}

F_OLD=$(mktemp old.XXX)
F_NEW=$(mktemp new.XXX)

perf report -q -s comm -g none -c g4run -F period,sample -i ${OLD} >| ${F_OLD} &
perf report -q -s comm -g none -c g4run -F period,sample -i ${NEW} >| ${F_NEW} &

wait

C_OLD=$(awk '/^ /{ print $1 }' ${F_OLD})
C_NEW=$(awk '/^ /{ print $1 }' ${F_NEW})
S_OLD=$(awk '/^ /{ print $2 }' ${F_OLD})
S_NEW=$(awk '/^ /{ print $2 }' ${F_NEW})
T_OLD=$(perf report --header-only -i ${OLD} 2>/dev/null | awk '/duration/{ print $(NF-1)/1000.0 }')
T_NEW=$(perf report --header-only -i ${NEW} 2>/dev/null | awk '/duration/{ print $(NF-1)/1000.0 }')

C_SPEEDUP=$(bc -l <<< "100.0 * (${C_OLD} - ${C_NEW}) / ${C_OLD}")
S_SPEEDUP=$(bc -l <<< "100.0 * (${S_OLD} - ${S_NEW}) / ${S_OLD}")
T_SPEEDUP=$(bc -l <<< "100.0 * (${T_OLD} - ${T_NEW}) / ${T_OLD}")

rm -f ${F_OLD} ${F_NEW}

cat <<-EOF
document.getElementById("performance-difference").innerHTML = \`
<table class="w3-table-all" style="width:auto; margin-top: 8px;">
  <tr>
    <th>Metric</th>
    <th>Before</th>
    <th>After</th>
    <th>Speedup</th>
  </tr>
  <tr>
   <td><b>Cycles</b></td>
   <td>${C_OLD}</td>
   <td>${C_NEW}</td>
   <td>$(printf "%+.2f%%" ${C_SPEEDUP})</td>
  </tr>
  <tr>
   <td><b>Samples</b></td>
   <td>${S_OLD}</td>
   <td>${S_NEW}</td>
   <td>$(printf "%+.2f%%" ${S_SPEEDUP})</td>
  </tr>
  <tr>
   <td><b>Time [s]</b></td>
   <td>$(printf "%.1f" ${T_OLD})</td>
   <td>$(printf "%.1f" ${T_NEW})</td>
   <td>$(printf "%+.2f%%" ${T_SPEEDUP})</td>
  </tr>
</table>\`;
EOF
