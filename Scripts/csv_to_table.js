import * as d3 from "https://cdn.skypack.dev/d3@7";

let csv_report = "pythia-cpu.csv";

// Store all the report files in this array
const all_reports = ["pythia-cpu.csv", "pythia.csv", "pythia-cache.csv"];

// Getting the Options for selecting the report i.e. CSV File
const report_selection = () => {
    all_reports.forEach(file => {
        d3.select("#report-selection").append("option").text(file);
    })
}

// Selection Fields for metrics
const name_fields = numeric_columns => {
    const options = [];
    for (let i = 0; i < numeric_columns.length; i++) {
        d3.selectAll("#column_fields").append("option").text(numeric_columns[i]).attr("class", "csv-columns");
    }

    // Removing Duplicate Entries in Dropdown
    document.querySelectorAll(".csv-columns").forEach((option) => {
        if (options.includes(option.value)) {
            option.remove();
        } else {
            options.push(option.value);
        }
    })
}

// Convert the CSV into Tables
const tabulate = (data, table_columns, numeric_columns) => {
    const table = d3.select("#html-table").append("table").attr("id", "report-table");
    const thead = table.append("thead")
    const tbody = table.append("tbody");
    thead.append("tr").selectAll("th").data(table_columns).enter().append("th").text(d => d);
    const selectField = document.getElementById("column_fields").value;

    // Total Array for storing object which will help in converting raw data into % percent values
    const total_array = [];
    for (let i = 0; i < numeric_columns.length; i++) {
        let sum = d3.sum(data, d => d[numeric_columns[i]])
        total_array.push({ column: numeric_columns[i], total_sum: sum })
    }

    // Threshold Logics
    let h_input, l_input, h_filter, l_filter;
    h_input = document.getElementById("h_threshold");
    l_input = document.getElementById("l_threshold");
    h_filter = parseFloat(h_input.value);
    l_filter = parseFloat(l_input.value);

    // Count to check if there are no available entries
    let count = 0;
    const rows = tbody.selectAll("tr").data(data.filter(d => {
        const field_index = total_array.map(a => a.column).indexOf(selectField);
        const compare_value = d[selectField] * 100 / total_array[field_index].total_sum;
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
        d3.select("#html-table").text("No valid data available for given range")
    }

    const cells = rows.selectAll('td')
        .data(row => (
            table_columns.map(column => {
                const index = total_array.map(a => a.column).indexOf(column);
                if (index != -1) {
                    return { column: column, value: Math.round((row[column] * 100 / total_array[index].total_sum) * 100) / 100 + "%" };
                } else {
                    return { column: column, value: row[column] };
                }
            }
            )
        ))
        .enter()
        .append('td')
        .text(d => d.value).style("background-color", d => {

            // Avoids Hexadecimal strings to get coloured and colour only numeric fields.  
            if (!d.value.includes("0x"))
                return d3.scaleLinear().domain([0, 2]).range(["#5225f5", "#f52540"])(parseFloat(d.value));
        }).style("color", d => {
            if (numeric_columns.includes(d.column))
                return "white";
        });
}

// Load the CSV data into HTML using d3
const load_CSV = myVar => {
    d3.csv(`Data/${myVar}`).then(data => {
        const table_columns = data.columns;
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
document.getElementById("csv-download").addEventListener("click", () => {
    window.open(`Data/${csv_report}`);
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
    d3.select("table").remove();
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
