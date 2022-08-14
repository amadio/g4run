import * as d3 from "https://cdn.skypack.dev/d3@7";

// TreeMap Data Selectors
let csv_report = "baseline-vs-run3opt";
// Store all the report files in this array
const all_reports =
    [
        'baseline-vs-run3opt',
        'baseline-vs-vecgeom',
        'run3opt-vs-vecgeom',
        'vecgeom-slices-vs-wheel'
    ];

// Dropdown for TreeMap Selection
const treemap_selection = () => {
    all_reports.forEach(file => {
        d3.select("#diff-treemap-selection").append("option").text(file);
    })
}

const width = d3.select("#diff-treemaps").node().getBoundingClientRect().width-10;
const height = d3.select("#diff-treemaps").node().getBoundingClientRect().height-10;

// Creating the child parent realtions from the data available
const stratify = d3.stratify().parentId(d => d.id.substring(0, d.id.lastIndexOf(";")));

const treemap = d3.treemap().size([width, height]).padding(1).round(true);
const format = d3.format("+.2%");
const fmt = d3.format(",.3e");


const render = data => {

    const root = stratify(data)
        .sum(d => {
            return d.value
        })
        .sort((a, b) => b.height - a.height || b.value - a.value);

    treemap(root);

    // Append the treemap to its respective div
    d3.select("#diff-treemaps").selectAll(".diff-node")
        .data(root.leaves())
        .enter().append("div").attr("class", "diff-node").attr("title", d => d.id.split(/;/g).join("\n") + "\nCycles: slices: " + fmt(d.data.prev) + 
        " wheel: " + fmt(d.data.curr) + "\nchange: " + format((d.data.curr - d.data.prev) / d.value))
        .style("left", d => d.x0 + "px")
        .style("top", d => d.y0 + "px")
        .style("width", d => d.x1 - d.x0 + "px")
        .style("height", d => d.y1 - d.y0 + "px")
        .style("background", d => d3.interpolateRdBu(0.5 * (1.0 - ((d.data.curr - d.data.prev) / d.value))))
        .style("color", d => d3.scaleLinear()
                   .domain([-0.4001, -0.4, 0.4, 0.4001])
                   .range(["white", "black", "black", "white"])
                   .interpolate(d3.interpolateRgb.gamma(2.2))(((d.data.curr - d.data.prev) / d.value)))
        .append("div")
        .attr("class", "diff-node-label")
        .text(d => d.id.substring(d.id.lastIndexOf(";") + 1).split(/::/g).join("\n"))
        .append("div")
        .attr("class", "diff-node-value")
        .text(d => format((d.data.curr - d.data.prev) / d.value))

}

const load_CSV = file => {
    d3.csv(`Data/Treemaps/Diff-TreeMaps/${file}.csv`,d3.autoType).then(data => {
        render(data);
    })
}

load_CSV(csv_report);
treemap_selection();

document.getElementById("diff-treemap-selection").addEventListener("change", (e) => {
    csv_report = e.target.value;
    document.getElementById("diff-treemaps").innerHTML = "";
    load_CSV(csv_report);
})