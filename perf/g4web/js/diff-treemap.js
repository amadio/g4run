import {interpolateRdGn} from "./interpolateRdGn.js"

// TreeMap Data Selectors
let csv_report = "pythia";
// Store all the report files in this array
const all_reports = [ 'pythia' ];

// Dropdown for TreeMap Selection
const treemap_selection = () => {
    all_reports.forEach(file => {
        d3.select("#treemap-selection").append("option").text(file);
    })
}

const width = document.getElementById("commit").getBoundingClientRect().width - 32;
const height = window.innerHeight - 200;

// Creating the child parent realtions from the data available
const stratify = d3.stratify().parentId(d => d.id.substring(0, d.id.lastIndexOf(";")));

const treemap = d3.treemap().size([width, height]).padding(1).round(true);
const format = d3.format("+.2%");
const fmt = d3.format(",.3e");

function absolute_change(d) {
  return 50.0 * (d.data.overhead_new - d.data.overhead_old);
}

function relative_change(d) {
  var before = +d.data.cycles_old;
  var after = +d.data.cycles_new;
  return (after - before) / (after + before);
}

function node_value(d, relative) {
  let str = d3.format(".2%")(+d.data.overhead_old) + " → " + d3.format(".2%")(+d.data.overhead_new)
  if (relative)
    str += " (" + d3.format("+.2%")(relative_change(d)) + ")";
  else
    str += " (" + d3.format("+.2%")(d.data.overhead_new - d.data.overhead_old) + ")";

  return str;
}

function tooltip(d, relative) {
    return d.id.replace("all;", "").split(";").join(" / ") + ": " + node_value(d, relative);
}

const render = data => {

    const root = stratify(data)
        .sum(d => { return d.cycles_old + d.cycles_new; })
        .sort((a, b) => b.height - a.height || b.value - a.value);

    treemap(root);

	// Select coloring by absolute/relative change
	const relative = !document.getElementById("absolute").checked;
	const change = relative ? relative_change : absolute_change;

    // Append the treemap to its respective div
    d3.select("#treemap").selectAll(".node")
        .data(root.leaves())
	.enter()
	.append("div")
	.attr("class", "node")
	.attr("title", d => tooltip(d, relative))
    .style("left", d => d.x0 + "px")
    .style("top", d => d.y0 + "px")
    .style("width", d => d.x1 - d.x0 + "px")
    .style("height", d => d.y1 - d.y0 + "px")
    .style("background", d => interpolateRdGn(change(d)))
    .append("div")
    .attr("class", "node-label")
    .text(d => d.id.substring(d.id.lastIndexOf(";") + 1).split(/::/g).join("\n"))
  	.style("color", d => Math.abs(change(d)) < 0.5 ? "black" : "white")
    .append("div")
    .attr("class", "node-value")
    .text(d => node_value(d, relative))
	.style("color", d => Math.abs(change(d)) < 0.5 ? "black" : "white")
}

const load_CSV = file => {
    d3.csv(`data/treemap-diff-${file}.csv`,d3.autoType).then(data => {
        render(data);
    })
}

load_CSV(csv_report);
treemap_selection();

document.getElementsByName("change-type").forEach(e => e.addEventListener("click", () => { 
    document.getElementById("treemap").innerHTML = "";
	load_CSV(csv_report)
}));

document.getElementById("treemap-selection").addEventListener("change", (e) => {
    csv_report = e.target.value;
    document.getElementById("treemap").innerHTML = "";
    load_CSV(csv_report);
})
