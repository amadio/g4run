import * as d3 from "https://cdn.skypack.dev/d3@7";
let csv_report = "pythia-cpu";
// Store all the report files in this array
const all_reports = [ 'pythia-cpu', 'pythia-cache' ];

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
	if (numeric_columns[i].match(".*_new")) {
		name = numeric_columns[i].replace("_new", "");
                d3.selectAll("#diff-column_fields")
		  .append("option").text(name).attr("class", "diff-csv-columns");
	}
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
const tabulate = (data, table_columns, numeric_columns) => {

    const table = d3.select("#diff-html-table").append("table").attr("id", "diff-report-table");
    table.append("thead").append("tr");
    const header = table.select("tr")
                        .selectAll("th")
			.data(data.columns.filter(d => d.match(".*_old"))).enter()
			  .append("th").text(d => d.replace("_old", "").replace("_", " "))
			  .attr("colspan", 4);

    table.append("tr").selectAll("tr")
	    .data(data.columns.filter(d => !d.match(".*_old")))
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

    console.log(table_columns)

    const tbody = table.append("tbody");
    const selectField = document.getElementById("diff-column_fields").value;

    let totals = {};
    for (let c in numeric_columns)
	    totals[numeric_columns[c]] = d3.sum(data, d => d[numeric_columns[c]]);

    // Threshold Logics
    let h_input, l_input, h_filter = 1.0, l_filter = 0.005;
    h_input = document.getElementById("diff-h_threshold");
    l_input = document.getElementById("diff-l_threshold");

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
        d3.select("#diff-html-table").text("No valid data available for given range")
    }

    const cells = rows
	.each(function(d) {
		for (let c in table_columns) {
			let column = table_columns[c];
			if (column.match(".*_new")) {
				let name = column.replace("_new", "")
				let val = (+d[name + "_new"] - d[name + "_old"]) / (+d[name + "_new"] + d[name + "_old"])

				d3.select(this).append("td").text(d3.format(".2%")(d[name + "_old"]))
				//.style("background-color", 
				//d3.scaleLinear().domain([0, 0.1]).range(["white", "red"])(d[name + "_old"]))

				d3.select(this).append("td").text(d3.format(".2%")(d[name + "_new"]))
				//.style("background-color", 
				//d3.scaleLinear().domain([0, 0.1]).range(["white", "red"])(d[name + "_new"]))

				d3.select(this).append("td").text(d3.format("+.2%")(d[name + "_diff"]))
				.style("background-color", 
				d3.scaleLinear().domain([-1.0, 0.0, +1.0]).range(["green", "white", "red"])(val))

				d3.select(this).append("td").text(d3.format(".3f")(d[name + "_ratio"]))
				.style("background-color", 
				d3.scaleLinear().domain([-1.0, 0.0, +1.0]).range(["green", "white", "red"])(val))

			} else {
				if (!column.match(".*_(old|diff|ratio)")) {
					d3.select(this).append("td").text(d[column])
				}
			}
		}
	});
        header.on("click", (event, d) => {
            if (toggle_sort) {
                rows.sort(function (a, b) {
                    if (a[d] < b[d]) {
                        return 1;
                    } else if (a[d] > b[d]) {
                        return -1;
                    } else {
                        return 0;
                    }
                })
                toggle_sort = false;
            }else{
                rows.sort(function (a, b) {
                    if (a[d] < b[d]) {
                        return -1;
                    } else if (a[d] > b[d]) {
                        return 1;
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
	d3.csv(`data/${file}-diff.csv`, d3.autoType).then(data => {

	let table_columns = data.columns;
	let numeric_columns = [];

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

	console.log(data[0]);
	console.log(data.columns);

	tabulate(data, table_columns, numeric_columns);
	});
};

// Download the CSV file on clicking the Button
document.getElementById("diff-csv-download").addEventListener("click", () => {
    window.open(`data/${csv_report}-diff.csv`);
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
