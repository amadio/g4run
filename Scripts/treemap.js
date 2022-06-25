import * as d3 from "https://cdn.skypack.dev/d3@7";

let csv_report = "pythia-cpu.csv";
const all_reports = ["pythia-cpu.csv","pythia-cache.csv"];

const treemap_selection = () => {
    all_reports.forEach(file => {
        console.log(file);
        d3.select("#treemap-selection").append("option").text(file);
    })
}

const width = d3.select("#treemaps").node().getBoundingClientRect().width;
const height = d3.select("#treemaps").node().getBoundingClientRect().height;

const stratify = d3.stratify().parentId(d => d.id.substring(0, d.id.lastIndexOf(";")));
const treemap = d3.treemap().size([width, height]).padding(1).round(true);
const format = d3.format(".3");

const render = data => {
    const root = stratify(data)
        .sum(d =>   d.cycles)
        .sort((a, b) => b.height - a.height || b.value - a.value);

    treemap(root);

    d3.select("#treemaps").selectAll(".node")
        .data(root.leaves())
        .enter().append("div").attr("class", "node").attr("title", d => d.id.split(/;/g).join("\n") +
        "\nCPI = " + format(d.data.cycles/d.data.instructions))
        .style("left", d => d.x0 + "px")
        .style("top", d => d.y0 + "px")
        .style("width", d => d.x1 - d.x0 + "px")
        .style("height", d => d.y1 - d.y0 + "px")
        .style("background", d => {
            return d3.scaleLinear().domain([0, 1 ,2.5]).range(["blue","white" ,"red"])(parseFloat(d.data.cycles/d.data.instructions));
        })
        .append("div")
      .attr("class", "node-label")
      .text(function(d) { return d.id.substring(d.id.lastIndexOf(";") + 1).split(/::/g).join("\n"); })
    .append("div")
      .attr("class", "node-value")
      .text(function(d) { return format(d.data.cycles / d.data.instructions); });
}

const load_CSV = file => {
    d3.csv(`Data/Treemaps/${file}`).then(data => {
        render(data);
    })
}

document.getElementById("treemap-selection").addEventListener("change", (e) => {
    csv_report = e.target.value;
    document.getElementById("treemaps").innerHTML = "";
    load_CSV(csv_report);
})

load_CSV(csv_report);
treemap_selection();