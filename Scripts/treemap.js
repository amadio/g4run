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

const width = d3.select("#treemaps").node().getBoundingClientRect().width;
const height = d3.select("#treemaps").node().getBoundingClientRect().height;

// Creating the child parent realtions from the data available
const stratify = d3.stratify().parentId(d => d.id.substring(0, d.id.lastIndexOf(";")));

const treemap = d3.treemap().size([width, height]).padding(0.5);
const format = d3.format(".3");

const render = data => {
    const root = stratify(data)
        .sum(d => {
            if (data.columns.includes("cycles"))
                return d.cycles;
            if (data.columns.includes("L1_dcache_load_misses"))
                return d.L1_dcache_load_misses;
        })
        .sort((a, b) => b.height - a.height || b.value - a.value);

    treemap(root);

    // Append the treemap to its respective div
    d3.select("#treemaps").selectAll(".node")
        .data(root.leaves())
        .enter().append("div").attr("class", "node").attr("title", d => {
           if(data.columns.includes("cycles") && data.columns.includes("instructions"))
                return d.id.split(/;/g).join("\n") + "\nCPI = " + format(d.data.cycles / d.data.instructions);
           if(data.columns.includes("L1_dcache_loads") && data.columns.includes("L1_dcache_load_misses"))
                return d.id.split(/;/g).join("\n") + "\nMiss Rate = " + format(d.data.L1_dcache_load_misses*100 / d.data.L1_dcache_loads);
        })
        .style("left", d => d.x0 + "px")
        .style("top", d => d.y0 + "px")
        .style("width", d => d.x1 - d.x0 + "px")
        .style("height", d => d.y1 - d.y0 + "px")
        .style("background", d => {
            if(data.columns.includes("cycles") && data.columns.includes("instructions"))
                return d3.scaleLinear().domain([0, 1, 2.5]).range(["blue", "white", "red"])(parseFloat(d.data.cycles / d.data.instructions));
            if(data.columns.includes("L1_dcache_loads") && data.columns.includes("L1_dcache_load_misses"))
                return d3.scaleLinear().domain([0, 10, 20]).range(["blue", "white", "red"])(parseFloat(d.data.L1_dcache_load_misses*100 / d.data.L1_dcache_loads));
        })
        .append("div")
        .attr("class", "node-label")
        .text(d =>  d.id.substring(d.id.lastIndexOf(";") + 1).split(/::/g).join("\n"))
        .append("div")
        .attr("class", "node-value")
        .text(d => { 
            if(data.columns.includes("cycles") && data.columns.includes("instructions"))
                return format(d.data.cycles / d.data.instructions); 
            if(data.columns.includes("L1_dcache_loads") && data.columns.includes("L1_dcache_load_misses"))
                return format(d.data.L1_dcache_load_misses*100 / d.data.L1_dcache_loads)+"%";
        });
}

const load_CSV = file => {
    d3.csv(`Data/Treemaps/${file}`).then(data => {
        render(data);
    })
}

load_CSV(csv_report);
treemap_selection();

document.getElementById("treemap-selection").addEventListener("change", (e) => {
    csv_report = e.target.value;
    document.getElementById("treemaps").innerHTML = "";
    load_CSV(csv_report);
})
