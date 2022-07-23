import * as d3 from "https://cdn.skypack.dev/d3@7";
let csv_report = "branches";
// Store all the report files in this array
const all_reports =
    [
        'branches', 'cpu-kernel-stacks',
        'cpu-kernel', 'cpu-stacks',
        'divisions', 'faults',
        'l2', 'ibs-fetch',
        'ibs-op', 'ic',
        'load-store', 'perf',
        'pythia-cache',
        'pythia-cpu', 'tlb',
        'uops-2', 'uops'
    ];

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
const tabulate = (data, table_columns, numeric_columns, extent_array) => {

    const table = d3.select("#html-table").append("table").attr("id", "report-table");
    const thead = table.append("thead")
    const tbody = table.append("tbody");
    thead.append("tr").selectAll("th").data(table_columns).enter().append("th").text(d => d);
    const selectField = document.getElementById("column_fields").value;

    // Threshold Logics
    let h_input, l_input, h_filter, l_filter;
    h_input = document.getElementById("h_threshold");
    l_input = document.getElementById("l_threshold");
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
        d3.select("#html-table").text("No valid data available for given range")
    }

    const cells = rows.selectAll('td')
        .data(row => (
            table_columns.map(column => {
                if (column == "cycles" || column == "instructions" || column == "Branch_Miss" || column == "cycles_ukP" || column == "L1_dcache" || column == "L1_icache_load_misses") {
                    return { column: column, value: row[column] + "%" }
                }
                return { column: column, value: row[column] };
            }
            )
        ))
        .enter()
        .append('td')
        .text(d => d.value).style("background-color", d => {
            if (numeric_columns.indexOf(d.column) != -1) {
                const max_col = extent_array[numeric_columns.indexOf(d.column)]
                return d3.scaleLinear().domain([max_col[0] / 100, 75 * max_col[1] / 100, 95 * max_col[1] / 100]).range(["green", "white", "red"])(parseFloat(d.value));
            }
        });
}

// Load the CSV data into HTML using d3
const load_CSV = file => {
    d3.csv(`Data/Table_Reports/raw-reports/${file}.csv`,d3.autoType).then(data => {
        let table_columns = data.columns;
        let numeric_columns = [];

        table_columns.forEach(cols => {
            if (isNaN(data[0][cols]) == false) {
                numeric_columns.push(cols)
            }
        });

        /* 
        If Cycles and Instructions are there then Add CPI, IPC, IPB and filter the data as follows
        Cycles, Instructions : Percent of Total
        IPB, IPC, CPI : Respective numeric ratios
        Branch_Misses : Percent of branches/branch_misses
        */
        if (numeric_columns.includes("cycles") && numeric_columns.includes("instructions")) {
            let cycles_sum = d3.sum(data, d => d.cycles);
            let instructions_sum = d3.sum(data, d => d.instructions);
            data.filter(d => {
                d.CPI = Math.round(d.cycles / d.instructions * 1000) / 1000;
                d.IPC = Math.round(d.instructions / d.cycles * 1000) / 1000;
                d.IPB = Math.round(d.instructions / d.branches * 1000) / 1000;
                d.cycles = Math.round((d.cycles * 100 / cycles_sum) * 100) / 100;
                d.instructions = Math.round((d.instructions * 100 / instructions_sum) * 100) / 100;
            });

            let derived_metrics = [];
            if (numeric_columns.includes("branches")) {
                derived_metrics = ["CPI", "IPC", "IPB"];
            } else {
                derived_metrics = ["CPI", "IPC"];
            }
            table_columns.splice(table_columns.indexOf("instructions") + 1, 0, ...derived_metrics);
            numeric_columns.splice(numeric_columns.indexOf("instructions") + 1, 0, ...derived_metrics);

        } else if (numeric_columns.includes("instructions")) {
            let instructions_sum = d3.sum(data, d => d.instructions);

            data.filter(d => {
                d.instructions = Math.round((d.instructions * 100 / instructions_sum) * 100) / 100;
            })
        } else if (numeric_columns.includes("cycles")) {
            let cycles_sum = d3.sum(data, d => d.cycles);

            data.filter(d => {
                d.cycles = Math.round((d.cycles * 100 / cycles_sum) * 100) / 100;
            })
        } else if (numeric_columns.includes("cycles_ukP")) {
            let cycles_sum = d3.sum(data, d => d.cycles_ukP);

            data.filter(d => {
                d.cycles_ukP = Math.round((d.cycles_ukP * 100 / cycles_sum) * 100) / 100;
            })
        }

        if (numeric_columns.includes("branches") && numeric_columns.includes("branch_misses")) {

            data.filter(d => {
                d.Branch_Miss = Math.round((d.branches / d.branch_misses)) / 100;
                delete d.branches;
                delete d.branch_misses;
            });
            numeric_columns.splice(numeric_columns.indexOf("IPB" + 1), 0, "Branch_Miss");
            numeric_columns = numeric_columns.filter(d => d !== "branch_misses" && d !== "branches");
            table_columns.splice(table_columns.indexOf("comm"), 0, "Branch_Miss");
            table_columns = table_columns.filter(d => d !== "branch_misses" && d !== "branches");

        }

        if (numeric_columns.includes("L1_dcache_loads") && numeric_columns.includes("L1_dcache_load_misses")) {
            let L1_icache_load_misses_sum = d3.sum(data, d => d.L1_icache_load_misses);
            data.filter(d => {
                d.L1_dcache = Math.round((d.L1_dcache_load_misses * 100 / d.L1_dcache_loads) * 100) / 100;
                d.L1_icache_load_misses = Math.round((d.L1_icache_load_misses * 100 / L1_icache_load_misses_sum) * 100) / 100;
            });

            table_columns.splice(table_columns.indexOf("instructions") + 1, 0, "L1_dcache");
            table_columns = table_columns.filter(d => d !== "L1_dcache_loads" && d !== "L1_dcache_load_misses");
            numeric_columns.splice(numeric_columns.indexOf("instructions") + 1, 0, "L1_dcache");
            numeric_columns = numeric_columns.filter(d => d !== "L1_dcache_loads" && d !== "L1_dcache_load_misses");
        }
        name_fields(numeric_columns);
        const extent_array = [];
        numeric_columns.forEach((i) => {
            const value_array = [];
            data.filter(d => {
                if (d['cycles'] == 0 || d['instructions'] == 0) {
                    return false;
                }
                if (!isNaN(d[i]) || isFinite(d[i])) {
                    value_array.push(d[i]);
                }
            })

            extent_array.push(d3.extent(value_array));
        });
        tabulate(data, table_columns, numeric_columns, extent_array);
    });
};

// Download the CSV file on clicking the Button
document.getElementById("csv-download").addEventListener("click", () => {
    window.open(`Data/Table_Reports/raw-reports/${csv_report}.csv`);
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

