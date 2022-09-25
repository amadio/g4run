import tabulate from "./tabulate.js"
import {metrics, is_applicable} from "./metrics.js"

let csv_report = "pythia";

// Store all the report files in this array
const all_reports = [ 'pythia', 'pythia-cpu', 'pythia-cache' ];

// Getting the Options for selecting the report i.e. CSV File
const report_selection = () => {
    all_reports.forEach(file => {
        d3.select("#report-selection").append("option").text(file);
    })
}

// Load the CSV data into HTML using d3
const load_CSV = file => {
  d3.csv(`data/${file}.csv`, d3.autoType).then(data => {

  /* select which columns consist of numeric values */
  let columns = data.columns
  let numeric_columns = columns.filter(c => !isNaN(data[0][c]))

  /* sort data based on the first numeric column by default */
  const e = numeric_columns[0]
  data.sort(function (a, b) { return a[e] > b[e] ? -1 : 1; })

  /* filter out symbols with very few samples (less than 0.1% of total) */
  const e_total = d3.sum(data, d => d[e])
  data = data.filter(d => d[e] > 0.001 * e_total);

  /* add derived metrics based on available recorded events */
  let derived_metrics = []
  for (let metric in metrics) {
    if (!is_applicable(metrics[metric], numeric_columns))
      continue;

    metrics[metric].apply(data)
    derived_metrics.push(metric)
  }

  /* add derived metric to data columns */
  columns.splice(numeric_columns.length, 0, ...derived_metrics);

  /* normalize numeric columns */
  numeric_columns.forEach(c => {
    const total = d3.sum(data, d => d[c]);
    data.filter(d => d[c] = d3.format(".2%")(d[c] / total));
  });

  tabulate("#html-table", data, columns);
  });
}

// Download the CSV file on clicking the Button
document.getElementById("csv-download").addEventListener("click", () => {
    window.open(`data/${csv_report}.csv`);
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

// Apply Button for Thresholds
document.getElementById("apply-btn").addEventListener("click", () => {
    d3.select("#report-table").remove();
    load_CSV(csv_report);
})

// Reset the reports without filters
document.getElementById("reset-filter").addEventListener("click", () => {
    const h_input = document.getElementById("h_threshold");
    const l_input = document.getElementById("l_threshold");
    h_input.value = "";
    l_input.value = "";
    d3.select("table").remove();
    d3.select("#html-table").text("");
    load_CSV(csv_report);
})
