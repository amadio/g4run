import * as d3 from "https://cdn.skypack.dev/d3@7";
let csv_report = "pythia-cpu-diff";
// Store all the report files in this array
const all_reports =
    [
        'pythia-cpu-diff',
        'pythia-cache-diff'
    ];

// Getting the Options for selecting the report i.e. CSV File
const report_selection = () => {
    all_reports.forEach(file => {
        d3.select("#diff-report-selection").append("option").text(file);
    })
}
let toggle_sort = true;
// Selection Fields for metrics
const name_fields = numeric_columns => {

    const options = [];
    for (let i = 0; i < numeric_columns.length; i++) {
        d3.selectAll("#diff-column_fields").append("option").text(numeric_columns[i]).attr("class", "diff-csv-columns");
    }

    // Removing Duplicate Entries in Dropdown
    document.querySelectorAll(".diff-csv-columns").forEach((option) => {
        if (options.includes(option.value)) {
            option.remove();
        } else {
            options.push(option.value);
        }
    })
}

// Convert the CSV into Tables
const tabulate = (data, table_columns) => {
    const table = d3.select("#diff-html-table").append("table").attr("id", "diff-report-table");
    table.append("thead").append("tr");
    const header = table.select("tr").selectAll("th").data(table_columns).enter().append("th").text(d => d);
    const tbody = table.append("tbody");
    const selectField = document.getElementById("diff-column_fields").value;

    // Threshold Logics
    let h_input, l_input, h_filter, l_filter;
    h_input = document.getElementById("diff-h_threshold");
    l_input = document.getElementById("diff-l_threshold");
    h_filter = parseFloat(h_input.value);
    l_filter = parseFloat(l_input.value);

    // Count to check if there are no available entries
    let count = 0;
    const rows = tbody.selectAll("tr").data(data.filter(d => {
        if (d.cycles == 0 || d.instructions == 0) {
            return false;
        }

        let compare_value = d[selectField];

        if (h_filter >= 0 && l_filter >= 0) {
            if (compare_value >= l_filter && compare_value <= h_filter) {
                count++;
                return d;
            } else {
                return null;
            }
        }
        return d;
    })).enter().append("tr");

    // If there are no entries then report for the same
    if (h_filter >= 0 && l_filter >= 0 && count == 0) {
        d3.select("table").remove();
        d3.select("#diff-html-table").text("No valid data available for given range")
    }

    const cells = rows.selectAll('td')
        .data(row => (
            table_columns.map(column => {
                return { column: column, value: row[column] };
            }
            )
        ))
        .enter()
        .append('td')
        .text(d => d.value).style("background-color", d => {
            if (d.column.includes("Cycles") && !d.column.includes("Diff") && !d.column.includes("Ratio"))
                return d3.scaleLinear().domain([0, 1, 2]).range(["green", "white", "red"])(parseFloat(d.value));
            if (d.column.includes("Diff"))
                return d3.scaleLinear().domain([-0.5, 0, 0.5]).range(["green", "white", "red"])(parseFloat(d.value));
            if (d.column.includes("Ratio"))
                return d3.scaleLinear().domain([0, 1, 2]).range(["green", "white", "red"])(parseFloat(d.value));
            if (d.column.includes("Instructions"))
                return d3.scaleLinear().domain([0, 1, 2]).range(["green", "white", "red"])(parseFloat(d.value));
            return d3.scaleLinear().domain([0, 1, 2.5]).range(["green", "white", "red"])(parseFloat(d.value));
        });
        header.on("click", (event, d) => {
            if (toggle_sort) {
                rows.sort(function (a, b) {
                    if (a[d] < b[d]) {
                        return -1;
                    } else if (a[d] > b[d]) {
                        return 1;
                    } else {
                        return 0;
                    }
                })
                toggle_sort = false;
            }else{
                rows.sort(function (a, b) {
                    if (a[d] < b[d]) {
                        return 1;
                    } else if (a[d] > b[d]) {
                        return -1;
                    } else {
                        return 0;
                    }
                })
                toggle_sort = true;
            }
        }
        )
}

// Load the CSV data into HTML using d3
const load_CSV = file => {
    d3.csv(`Data/Table_Reports/diff-reports/${file}.csv`, d3.autoType).then(data => {

        let table_columns = data.columns;
        let numeric_columns = [];

        table_columns.forEach(cols => {
            if (isNaN(data[0][cols]) == false) {
                numeric_columns.push(cols)
            }
        });
        name_fields(numeric_columns);
        tabulate(data, table_columns, numeric_columns);
    });
};

// Download the CSV file on clicking the Button
document.getElementById("diff-csv-download").addEventListener("click", () => {
    window.open(`Data/Table_Reports/diff-reports/${csv_report}.csv`);
})

// Update the page on selecting the other Data File (CSV) for generating reports
document.getElementById("diff-report-selection").addEventListener("change", (e) => {
    csv_report = e.target.value;
    document.getElementById("diff-html-table").innerHTML = "";
    d3.selectAll(".diff-csv-columns").remove();
    load_CSV(csv_report);
})

// Initialize the page to be viewed by default reports
load_CSV(csv_report);
report_selection();

// Apply Button for Thresholds
document.getElementById("diff-apply-btn").addEventListener("click", () => {
    console.log("Hi")
    d3.select("#diff-report-table").remove();
    load_CSV(csv_report);
})

// Reset the reports without filters
document.getElementById("diff-reset-filter").addEventListener("click", () => {
    const h_input = document.getElementById("diff-h_threshold");
    const l_input = document.getElementById("diff-l_threshold");
    h_input.value = "";
    l_input.value = "";
    d3.selectAll("diff-report-table").remove();
    d3.select("#diff-html-table").text("");
    load_CSV(csv_report);
})
