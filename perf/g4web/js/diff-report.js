import {interpolateRdGn} from "./interpolateRdGn.js"

let ascending = false;
let last_column = "";

let csv_report = "pythia";
// Store all the report files in this array
const all_reports = [ 'pythia', 'pythia-cpu', 'pythia-cache' ];

// Getting the Options for selecting the report i.e. CSV File
const report_selection = () => {
  all_reports.forEach(file => {
    d3.select("#report-selection").append("option").text(file);
  })
}

// Convert the CSV into Tables
const tabulate = (target, data, columns) => {
  var table = d3.select(target).append("table").attr("id", "report-table");
  var thead = table.append("thead");
  var tbody = table.append("tbody");

  var heads = thead.append("tr")
    .selectAll("th")
    .data(columns.filter(d => d.match(".*_new")))
    .enter()
      .append("th")
      .text(d => d.replace("_new", "").replaceAll("_", " "))
      .attr("colspan", 4)

  var subheads = thead.append("tr")
    .selectAll("th")
    .data(columns.filter(d => !d.match(".*_old")))
      .enter()
        .each(function(d, i) {
          if (d.match(".*_new")) {
            d3.select(this).append("th").text("old")
            d3.select(this).append("th").text("new")
            d3.select(this).append("th").text("diff")
            d3.select(this).append("th").text("ratio")
          } else {
            if (!d.match(".*_(diff|ratio)"))
              d3.select(this).append("th").text(d)
          }
        })

  const rows = tbody.selectAll("tr").data(data).enter().append("tr");

  const cells = rows.each(function(d) {
    for (let c in columns) {
      let column = columns[c];

      if (column.match(".*_new")) {
        let name = column.replace("_new", "")
        let val = (+d[name + "_new"] - d[name + "_old"]) / (+d[name + "_new"] + d[name + "_old"])

        d3.select(this).append("td")
          .text(d3.format(".2%")(d[name + "_old"]))

        d3.select(this).append("td")
          .text(d3.format(".2%")(d[name + "_new"]))

        d3.select(this).append("td")
          .text(d3.format("+.2%")(d[name + "_diff"]))
          .style("background-color", interpolateRdGn(50.0 * d[name + "_diff"]))
          .style("color", d => Math.abs(50.0 * d[name + "_diff"]) < 0.5 ? "black" : "white")

        d3.select(this).append("td")
          .text(d3.format(".3f")(d[name + "_ratio"]))
          .style("background-color", interpolateRdGn(val))
          .style("color", d => Math.abs(val) < 0.5 ? "black" : "white")

      } else {
        if (!column.match(".*_(old|diff|ratio)"))
          d3.select(this).append("td").text(d[column])
      }
    }
  });

  table.selectAll("th").on("click", (event, column) => {
    /* adjust sort column name based on sub-header */
    if (event.target.innerHTML.match("(old|new|diff|ratio)"))
      column = column.replace("new", event.target.innerHTML)

    if (column != last_column)
      ascending = false;

    if (ascending)
      rows.sort(function (a, b) { return a[column] < b[column] ? -1 : 1; });
    else
      rows.sort(function (a, b) { return a[column] > b[column] ? -1 : 1; });

    last_column = column;
    ascending = !ascending;
  });
}

// Load the CSV data into HTML using d3
const load_CSV = file => {
  d3.csv(`data/${file}-diff.csv`, d3.autoType).then(data => {
    /* select which columns consist of numeric values */
    let columns = data.columns
    let numeric_columns = columns.filter(c => !isNaN(data[0][c]));

    /* sort data based on the first numeric column by default */
    const e = numeric_columns[0]
    data.sort(function (a, b) { return a[e] > b[e] ? -1 : 1; })

    /* set filter to false by default */
    data.filter(d => d.filter = false);

    /* compute differences and ratios */
    numeric_columns.forEach(column => {
      if (column.match(".*_old")) {
        let prefix = column.replace("_old", "");
        let c_old = column;
        let c_new = prefix + "_new";
        let c_diff = prefix + "_diff";
        let c_ratio = prefix + "_ratio";
        let t_old = d3.sum(data, d => d[c_old]);
        let t_new = d3.sum(data, d => d[c_new]);

        data.filter(d => {
          /* compute difference and ratio */
          d[c_diff] = (d[c_new] - d[c_old]) / t_old
          d[c_ratio] = d[c_new] / d[c_old]
          /* convert to percentages */
          d[c_old] = d[c_old] / t_old
          d[c_new] = d[c_new] / t_new
          /* filter in data with large enough difference */
          let filter_in = Math.abs(d[c_ratio] - 1.0) >= 0.1 && Math.abs(100.0 * d[c_diff]) >= 0.25
          d.filter = d.filter || filter_in
        });

        columns.push(c_diff);
        columns.push(c_ratio);
      }
    });

    /* apply filter */
    data = data.filter(d => d.filter);

    tabulate("#html-table", data, columns);
  });
};

// Download the CSV file on clicking the Button
document.getElementById("csv-download").addEventListener("click", () => {
  window.open(`data/${csv_report}-diff.csv`);
})

// Update the page on selecting the other Data File (CSV) for generating reports
document.getElementById("report-selection").addEventListener("change", (e) => {
  csv_report = e.target.value;
  document.getElementById("html-table").innerHTML = "";
  d3.selectAll(".csv-columns").remove();
  load_CSV(csv_report);
})

// Initialize the page to be viewed by default reports
load_CSV(csv_report);
report_selection();
