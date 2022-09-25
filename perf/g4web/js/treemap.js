import {metrics, is_applicable} from "./metrics.js"

// TreeMap Data Selectors
let csv_report = "pythia";
// Store all the report files in this array
const all_reports = [ 'pythia', 'pythia-cpu', 'pythia-cache' ];

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
const remove_duplicates = () => {
    const a_options = [];
    const c_options = [];
    const t_options = [];

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

const width = document.getElementById("commit").getBoundingClientRect().width - 32;
const height = window.innerHeight - 200;

// Creating the child parent realtions from the data available
const stratify = d3.stratify().parentId(d => d.id.substring(0, d.id.lastIndexOf(";")));

const treemap = d3.treemap().size([width, height]).padding(1).round(true);

function format(x, m) {
	return metrics[m] ? metrics[m].format(x) : d3.format(".2%")(x);
}

const render = (data, numeric_columns, derived_metrics) => {

    const root = stratify(data)
        .sum(d => { return d[area_metric] })
        .sort((a, b) => b.height - a.height || b.value - a.value);

    treemap(root);

    // Append the treemap to its respective div
    d3.select("#treemap").selectAll(".node")
        .data(root.leaves())
        .enter()
		.append("div")
		.attr("class", "node")
		.attr("title", d => d.id.split(/;/g).join("\n") + `\n${tooltip_metric} = ` + 
			format(d.data[tooltip_metric], tooltip_metric))
        .style("left", d => d.x0 + "px")
        .style("top", d => d.y0 + "px")
        .style("width", d => d.x1 - d.x0 + "px")
        .style("height", d => d.y1 - d.y0 + "px")
        .style("background", d => {
			    return metrics[color_metric] ? metrics[color_metric].color(d.data[color_metric])
				                            : d3.interpolateRdYlGn((1.0 - 50.0*d.data[color_metric]));
        })
        .append("div")
        .attr("class", "node-label")
        .text(d => d.id.substring(d.id.lastIndexOf(";") + 1).split(/::/g).join("\n"))
        .append("div")
        .attr("class", "node-value")
        .text(d => format(d.data[tooltip_metric], tooltip_metric))
}

const load_CSV = file => {
    d3.csv(`data/treemap-${file}.csv`, d3.autoType).then(data => {
		/* select which columns consist of numeric values */
		let numeric_columns = data.columns.filter(c => !c.match("(id|comm|dso|symbol)"))

		/* add derived metrics based on available recorded events */
		let derived_metrics = []
		for (let metric in metrics) {
			if (!is_applicable(metrics[metric], numeric_columns))
				continue;

			metrics[metric].apply(data)
			derived_metrics.push(metric)
		}

		/* normalize numeric columns */
        numeric_columns.forEach(c => {
			const total = d3.sum(data, d => d[c]);
            data.filter(d => d[c] = d[c] / total);
        });

		/* add proper options to header area */
        numeric_columns.forEach(c => {
			d3.select("#treemap-area")
			  .append("option").attr("class", "area-field").text(c)
			d3.select("#treemap-color")
			  .append("option").attr("class", "color-field").text(c)
			d3.select("#treemap-tooltip")
			  .append("option").attr("class", "tooltip-field").text(c)
        });

		derived_metrics.forEach( c => {
			d3.select("#treemap-color")
			  .append("option").attr("class", "color-field").text(c);
			d3.select("#treemap-tooltip")
			  .append("option").attr("class", "tooltip-field").text(c)
		})

		remove_duplicates()

		/* Allow derived metrics for coloring and tooltip */
		d3.select("#treemap-color")
		  .data(derived_metrics).enter().append("option").text(d => metrics[d].name).attr("class", "color-field");
        d3.select("#treemap-tooltip")
		  .data(derived_metrics).enter().append("option").text(d => metrics[d].name).attr("class", "color-field");

        if (color_metric == undefined || tooltip_metric == undefined || area_metric == undefined) {
            color_metric = numeric_columns[0];
            tooltip_metric = numeric_columns[0];
            area_metric = numeric_columns[0];
        }

        render(data, numeric_columns, derived_metrics);
    })
}

load_CSV(csv_report);
treemap_selection();

document.getElementById("treemap-selection").addEventListener("change", (e) => {
    csv_report = e.target.value;
    document.getElementById("treemap").innerHTML = "";
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
    document.getElementById("treemap").innerHTML = "";
    load_CSV(csv_report);
})

document.getElementById("treemap-color").addEventListener("change", e => {
    color_metric = e.target.value;
    document.getElementById("treemap").innerHTML = "";
    load_CSV(csv_report);
})

document.getElementById("treemap-tooltip").addEventListener("change", e => {
    tooltip_metric = e.target.value;
    document.getElementById("treemap").innerHTML = "";
    load_CSV(csv_report);
})
