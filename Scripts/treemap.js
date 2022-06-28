import * as d3 from "https://cdn.skypack.dev/d3@7";

// TreeMap Data Selectors
let csv_report = "pythia-cpu.csv";
const all_reports = ["pythia-cpu.csv", "pythia-cache.csv"];

// Dropdown for TreeMap Selection
const treemap_selection = () => {
    all_reports.forEach(file => {
        d3.select("#treemap-selection").append("option").text(file);
    })
}

let area_metric;
let color_metric;
// Dropdown for TreeMap Area
const selection_fields = numeric_columns => {
    if (area_metric == undefined) {
        area_metric = numeric_columns[0];
    }
    if (color_metric == undefined) {
        color_metric = numeric_columns[numeric_columns.length - 1];
    }
    const a_options = [];
    const c_options = [];
    if (numeric_columns.includes("cycles") && numeric_columns.includes("instructions"))
        d3.selectAll("#treemap-color").append("option").text("CPI").attr("class", "color-field");
    if (numeric_columns.includes("L1_dcache_loads") && numeric_columns.includes("L1_dcache_load_misses"))
        d3.selectAll("#treemap-color").append("option").text("Miss_Rate").attr("class", "color-field");
    for (let i = 0; i < numeric_columns.length; i++) {
        d3.selectAll("#treemap-area").append("option").text(numeric_columns[i]).attr("class", "area-field");
        d3.selectAll("#treemap-color").append("option").text(numeric_columns[i]).attr("class", "color-field");
    }

    // Removing Duplicate Entries in Dropdown
    document.querySelectorAll(".area-field").forEach((option) => {
        if (a_options.includes(option.value)) {
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
}

const width = d3.select("#treemaps").node().getBoundingClientRect().width;
const height = d3.select("#treemaps").node().getBoundingClientRect().height;

// Creating the child parent realtions from the data available
const stratify = d3.stratify().parentId(d => d.id.substring(0, d.id.lastIndexOf(";")));

const treemap = d3.treemap().size([width, height]).padding(0.5);
const format = d3.format(".3");



const render = data => {
    const root = stratify(data)
        .sum(d => {
            return d[area_metric]
        })
        .sort((a, b) => b.height - a.height || b.value - a.value);

    treemap(root);

    // Append the treemap to its respective div
    d3.select("#treemaps").selectAll(".node")
        .data(root.leaves())
        .enter().append("div").attr("class", "node").attr("title", d => {
            if (data.columns.includes("cycles") && data.columns.includes("instructions"))
                return d.id.split(/;/g).join("\n") + "\nCPI = " + format(d.data.cycles / d.data.instructions);
            if (data.columns.includes("L1_dcache_loads") && data.columns.includes("L1_dcache_load_misses"))
                return d.id.split(/;/g).join("\n") + "\nMiss Rate = " + format(d.data.L1_dcache_load_misses * 100 / d.data.L1_dcache_loads);
        })
        .style("left", d => d.x0 + "px")
        .style("top", d => d.y0 + "px")
        .style("width", d => d.x1 - d.x0 + "px")
        .style("height", d => d.y1 - d.y0 + "px")
        .style("background", d => {
            if (data.columns.includes("cycles") && data.columns.includes("instructions"))
                return d3.scaleLinear().domain([0, 1, 2.5]).range(["green", "white", "red"])(parseFloat(d.data[color_metric]));
            if (data.columns.includes("L1_dcache_loads") && data.columns.includes("L1_dcache_load_misses"))
                return d3.scaleLinear().domain([0, 10, 20]).range(["green", "white", "red"])(parseFloat(d.data[color_metric]));
        })
        .append("div")
        .attr("class", "node-label")
        .text(d => d.id.substring(d.id.lastIndexOf(";") + 1).split(/::/g).join("\n"))
        .append("div")
        .attr("class", "node-value")
        .text(d => {
            if (data.columns.includes("cycles") && data.columns.includes("instructions"))
                return format(d.data.cycles / d.data.instructions);
            if (data.columns.includes("L1_dcache_loads") && data.columns.includes("L1_dcache_load_misses"))
                return format(d.data.L1_dcache_load_misses * 100 / d.data.L1_dcache_loads) + "%";
        });
}

const load_CSV = file => {
    d3.csv(`Data/Treemaps/${file}`).then(data => {
        let numeric_columns = [];
        data.filter(d => {
            if (d.hasOwnProperty("cycles") && d.hasOwnProperty("instructions")) {
                d.CPI = +d.cycles / d.instructions;
            }
            if (d.hasOwnProperty("L1_dcache_loads") && d.hasOwnProperty("L1_dcache_load_misses")) {
                d.Miss_Rate = +d.L1_dcache_load_misses * 100 / d.L1_dcache_loads;
            }
        })
        const all_columns = Object.getOwnPropertyNames(data[0]);
        all_columns.forEach(cols => {
            if (isNaN(data[10][cols]) == false) {
                numeric_columns.push(cols)
            }
        });
        selection_fields(numeric_columns)
        render(data);
    })
}

load_CSV(csv_report);
treemap_selection();

document.getElementById("treemap-selection").addEventListener("change", (e) => {
    csv_report = e.target.value;
    document.getElementById("treemaps").innerHTML = "";
    document.getElementById("treemap-area").options.length = 0;
    document.getElementById("treemap-color").options.length = 0;
    area_metric = document.getElementById("treemap-area").options[0];
    color_metric = document.getElementById("treemap-color").options[0];
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