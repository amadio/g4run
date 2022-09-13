document.getElementById("performance-difference").innerHTML = `
<table class="w3-table-all" style="width:50%; margin-top: 8px;">
  <tr>
    <th>Metric</th>
    <th>Before</th>
    <th>After</th>
    <th>Speedup</th>
  </tr>
  <tr>
   <td><b>Cycles</b></td>
   <td>38634679093840</td>
   <td>38233276796582</td>
   <td>+1.04%</td>
  </tr>
  <tr>
   <td><b>Samples</b></td>
   <td>5790156</td>
   <td>5733354</td>
   <td>+0.98%</td>
  </tr>
  <tr>
   <td><b>Time [s]</b></td>
   <td>413.6</td>
   <td>413.6</td>
   <td>-0.01%</td>
  </tr>
</table>`;
