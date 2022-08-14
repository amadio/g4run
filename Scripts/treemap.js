import * as d3 from "https://cdn.skypack.dev/d3@7";

// TreeMap Data Selectors
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

// Dropdown for TreeMap Selection
const treemap_selection = () => {
    all_reports.forEach(file => {
        d3.select("#treemap-selection").append("option").text(file);
    })
}

let area_metric;
let color_metric;
let tooltip_metric;
// Dropdown for TreeMap Area
const selection_fields = numeric_columns => {
    const a_options = [];
    const c_options = [];
    const t_options = [];

    d3.selectAll("#treemap-color").append("option").text(color_metric).attr("class", "color-field");
    d3.selectAll("#treemap-tooltip").append("option").text(tooltip_metric).attr("class", "tooltip-field");


    for (let i = 0; i < numeric_columns.length; i++) {
        d3.selectAll("#treemap-area").append("option").text(numeric_columns[i]).attr("class", "area-field");
        d3.selectAll("#treemap-color").append("option").text(numeric_columns[i]).attr("class", "color-field");
        d3.selectAll("#treemap-tooltip").append("option").text(numeric_columns[i]).attr("class", "tooltip-field");
    }

    // Removing Duplicate Entries in Dropdown
    document.querySelectorAll(".area-field").forEach((option) => {
        if (a_options.includes(option.value) || a_options.includes()) {
            option.remove();
        } else {
            a_options.push(option.value);
        }
    })
    document.querySelectorAll(".color-field").forEach((option) => {
        if (c_options.includes(option.value)) {
            option.remove();
        } else {
            c_options.push(option.value);
        }
    })
    document.querySelectorAll(".tooltip-field").forEach((option) => {
        if (t_options.includes(option.value)) {
            option.remove();
        } else {
            t_options.push(option.value);
        }
    })
}

const width = d3.select("#treemaps").node().getBoundingClientRect().width-10;
const height = d3.select("#treemaps").node().getBoundingClientRect().height-10;
// Creating the child parent realtions from the data available
const stratify = d3.stratify().parentId(d => d.id.substring(0, d.id.lastIndexOf(";")));

const treemap = d3.treemap().size([width, height]).padding(1).round(true);
const format = d3.format(".3");



const render = (data,extent_array,numeric_columns) => {

    const root = stratify(data)
        .sum(d => {
            return d[area_metric]
        })
        .sort((a, b) => b.height - a.height || b.value - a.value);

    treemap(root);

    // Append the treemap to its respective div
    d3.select("#treemaps").selectAll(".node")
        .data(root.leaves())
        .enter().append("div").attr("class", "node").attr("title", d => d.id.split(/;/g).join("\n") + `\n${tooltip_metric} = ` + format(d.data[tooltip_metric]))
        .style("left", d => d.x0 + "px")
        .style("top", d => d.y0 + "px")
        .style("width", d => d.x1 - d.x0 + "px")
        .style("height", d => d.y1 - d.y0 + "px")
        .style("background", d => {
                const lim_col = extent_array[numeric_columns.indexOf(color_metric)]
                return d3.scaleLinear().domain([0, 50 * lim_col[1] / 100, 80 *lim_col[1] / 100]).range(["green", "white", "red"])(parseFloat(d.data[color_metric]));
            }
        )
        .append("div")
        .attr("class", "node-label")
        .text(d => d.id.substring(d.id.lastIndexOf(";") + 1).split(/::/g).join("\n"))
        .append("div")
        .attr("class", "node-value")
        .text(d => {
            if (tooltip_metric == "CPI" || tooltip_metric == "IPC" || tooltip_metric == "IPB")
                return format(d.data[tooltip_metric])
            return format(d.data[tooltip_metric]) + "%";
        })

}

const load_CSV = file => {
    d3.csv(`Data/Treemaps/${file}.csv`,d3.autoType).then(data => {
        let numeric_columns = [];

        const all_columns = Object.getOwnPropertyNames(data[0]);
        all_columns.forEach(cols => {
            if (isNaN(data[10][cols]) == false) {
                numeric_columns.push(cols)
            }
        });

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

            if (color_metric == undefined || tooltip_metric == undefined || area_metric == undefined) {
                color_metric = "CPI";
                tooltip_metric = "CPI";
                area_metric = "cycles";
            }

            all_columns.splice(all_columns.indexOf("instructions") + 1, 0, ...derived_metrics);
            numeric_columns.splice(numeric_columns.indexOf("instructions") + 1, 0, ...derived_metrics);
        } else if (numeric_columns.includes("instructions")) {
            let instructions_sum = d3.sum(data, d => d.instructions);

            data.filter(d => {
                d.instructions = Math.round((d.instructions * 100 / instructions_sum) * 100) / 100;
            })
            if (color_metric == undefined || tooltip_metric == undefined || area_metric == undefined) {
                color_metric = "instructions";
                tooltip_metric = "instructions";
                area_metric = "instructions";
            }
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
        if (color_metric == undefined || tooltip_metric == undefined || area_metric == undefined) {
            color_metric = numeric_columns[0];
            tooltip_metric = numeric_columns[0];
            area_metric = numeric_columns[0];
        }
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
        selection_fields(numeric_columns)
        render(data,extent_array,numeric_columns);
    })
}

load_CSV(csv_report);
treemap_selection();

document.getElementById("treemap-selection").addEventListener("change", (e) => {
    csv_report = e.target.value;
    document.getElementById("treemaps").innerHTML = "";
    document.getElementById("treemap-area").options.length = 0;
    document.getElementById("treemap-color").options.length = 0;
    document.getElementById("treemap-tooltip").options.length = 0;
    area_metric = document.getElementById("treemap-area").options[0];
    color_metric = document.getElementById("treemap-color").options[0];
    tooltip_metric = document.getElementById("treemap-tooltip").options[0];
    load_CSV(csv_report);
})

document.getElementById("treemap-area").addEventListener("change", e => {
    area_metric = e.target.value;
    document.getElementById("treemaps").innerHTML = "";
    load_CSV(csv_report);
})

document.getElementById("treemap-color").addEventListener("change", e => {
    color_metric = e.target.value;
    document.getElementById("treemaps").innerHTML = "";
    load_CSV(csv_report);
})

document.getElementById("treemap-tooltip").addEventListener("change", e => {
    tooltip_metric = e.target.value;
    document.getElementById("treemaps").innerHTML = "";
    load_CSV(csv_report);
})