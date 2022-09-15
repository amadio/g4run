import * as d3 from "https://cdn.skypack.dev/d3@7";
let csv_report = "pythia";
// Store all the report files in this array
const all_reports = [ 'pythia', 'pythia-cpu', 'pythia-cache' ];

// Getting the Options for selecting the report i.e. CSV File
const report_selection = () => {
    all_reports.forEach(file => {
        d3.select("#report-selection").append("option").text(file);
    })
}
let toggle_sort = true;
// Selection Fields for metrics
const name_fields = numeric_columns => {

    const options = [];
    for (let i = 0; i < numeric_columns.length; i++) {
	if (numeric_columns[i].match(".*_new")) {
		name = numeric_columns[i].replace("_new", "");
                d3.selectAll("#column_fields")
		  .append("option").text(name).attr("class", "csv-columns");
	}
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

    table.append("thead").append("tr");
    table.select("tr").selectAll("th")
                      .data(data.columns.filter(d => d.match(".*_new"))).enter()
                      .append("th").text(d => d.replace("_new", "").replace("_", " ")).attr("colspan", 4);

    table.append("tr").selectAll("th")
         .data(data.columns.filter(d => !d.match(".*_old"))).enter()
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

    const header = table.selectAll("th");
    const tbody = table.append("tbody");
    const selectField = document.getElementById("column_fields").value;

    let totals = {};
    for (let c in numeric_columns)
            totals[numeric_columns[c]] = d3.sum(data, d => d[numeric_columns[c]]);

    // Threshold Logics
    let h_input, l_input, h_filter = 1.0, l_filter = 0.005;
    h_input = document.getElementById("h_threshold");
    l_input = document.getElementById("l_threshold");

    if (h_input.value)
	    h_filter = parseFloat(h_input.value);

    if (l_input.value)
	    l_filter = parseFloat(l_input.value);

    // Count to check if there are no available entries
    let count = 0;
    const rows = tbody.selectAll("tr").data(data.filter(d => {
        if (d.cycles_new == 0) {
            return false;
        }

        let compare_value = d[selectField + "_new"];

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

    const bgcolor = d3.scaleLinear()
                      .domain([-1.0, -0.99, -0.25, 0.0, 0.25, 0.99, 1.0])
                      .range(["seagreen", "darkgreen", "green", "white", "firebrick", "darkred", "lightcoral"]);

    const cells = rows
	.each(function(d) {
		for (let c in table_columns) {
			let column = table_columns[c];
			if (column.match(".*_new")) {
				let name = column.replace("_new", "")
				let val = (+d[name + "_new"] - d[name + "_old"]) / (+d[name + "_new"] + d[name + "_old"])

				d3.select(this).append("td")
				  .text(d3.format(".2%")(d[name + "_old"]))
				d3.select(this).append("td")
				  .text(d3.format(".2%")(d[name + "_new"]))
				d3.select(this).append("td")
				  .text(d3.format("+.2%")(d[name + "_diff"]))
				  .style("background-color", bgcolor(val))
				d3.select(this).append("td")
				  .text(d3.format(".3f")(d[name + "_ratio"]))
				  .style("background-color", bgcolor(val))

			} else {
				if (!column.match(".*_(old|diff|ratio)")) {
					d3.select(this).append("td").text(d[column])
				}
			}
		}
	});
        header.on("click", (event, d) => {
	    if (event.target.innerText.match("(old|new|diff|ratio)"))
		d = d.replace("new", event.target.innerText)

            if (toggle_sort) {
                rows.sort(function (a, b) { return a[d] < b[d] ? -1 : 1; })
            } else {
                rows.sort(function (a, b) { return a[d] > b[d] ? -1 : 1; })
            }
	    toggle_sort = !toggle_sort;
        }
        )
}

// Load the CSV data into HTML using d3
const load_CSV = file => {
	d3.csv(`data/${file}-diff.csv`, d3.autoType).then(data => {

	let table_columns = data.columns;
	let numeric_columns = [];

	if (data.columns.includes("cycles_new")) {
	  data.sort(function (a, b) { return +a["cycles_new"] > +b["cycles_new"] ? -1 : 1; })
	} else if (data.columns.includes("instructions_new")) {
	  data.sort(function (a, b) { return +a["instructions_new"] > +b["instructions_new"] ? -1 : 1; })
	}

	table_columns.forEach(cols => {
		if (isNaN(data[0][cols]) == false) {
			numeric_columns.push(cols)
		}
	});
	name_fields(numeric_columns);

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
				// compute difference and ratio
				d[c_diff] = (d[c_new] - d[c_old]) / t_old
				d[c_ratio] = d[c_new] / d[c_old]
				// convert to percentages
				d[c_old] = d[c_old] / t_old
				d[c_new] = d[c_new] / t_new
			});
			data.columns.push(c_diff);
			data.columns.push(c_ratio);
		}
	});
	tabulate(data, table_columns, numeric_columns);
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
    d3.selectAll("report-table").remove();
    d3.select("#html-table").text("");
    load_CSV(csv_report);
})
