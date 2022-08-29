import * as d3 from "https://cdn.skypack.dev/d3@7";

let csv_report = "branches";
let metric;
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
const sunburst_selection = () => {
    all_reports.forEach(file => {
        d3.select("#sunburst-selection").append("option").text(file);
    })
}
const selection_fields = numeric_columns => {
    const options = [];
    for (let i = 0; i < numeric_columns.length; i++) {
        d3.selectAll("#metric-selection").append("option").text(numeric_columns[i]).attr("class", "metric-field");
    }

    // Removing Duplicate Entries in Dropdown
    document.querySelectorAll(".metric-field").forEach((option) => {
        if (options.includes(option.value) || options.includes()) {
            option.remove();
        } else {
            options.push(option.value);
        }
    })
}
const width = d3.select("#sunburst-chart").node().getBoundingClientRect().width;
const height = d3.select("#sunburst-chart").node().getBoundingClientRect().height;

const stratify = d3.stratify().parentId(d => d.id.substring(0, d.id.lastIndexOf(";")));

const render = (vdata, numeric_columns, extent_array) => {
    const g = d3.select('#sunburst-chart').append("svg")
        .attr("width", width).attr("height", height)
        .append("g")
        .attr("transform", `translate(${width / 2},${height / 2})`);


    const layout = d3.partition().size([2 * Math.PI, Math.min(width, height) / 2]);
    const root = d3.hierarchy(vdata).sum(d => {
        // console.log(d.data.cycles)
        return d.data[metric];
    });

    layout(root);
    const arc = d3.arc().startAngle(d => d.x0)
        .endAngle(d => d.x1)
        .innerRadius(d => d.y0)
        .outerRadius(d => d.y1);

    const Node = g.selectAll('g').data(root.descendants()).enter().append('g');

    Node.append("path")
        .attr("d", arc)
        .style('stroke', '#fff')
        .style("fill", d => {
            const lim_col = extent_array[numeric_columns.indexOf(metric)]
                return d3.scaleLinear().domain([0, 50 * lim_col[1] / 100, 80 *lim_col[1] / 100]).range(["green", "white", "red"])(parseFloat(d.value));
        })

    Node.append("title")
        .text(d => {
            const a = d.data.id.split(';')
            return a[a.length - 1];
        });
}
const load_CSV = (csv_report) => {
    d3.csv(`Data/Treemaps/${csv_report}.csv`, d3.autoType).then(data => {
        const vdata = stratify(data);

        let numeric_columns = [];

        const all_columns = Object.getOwnPropertyNames(data[0]);
        all_columns.forEach(cols => {
            if (isNaN(data[10][cols]) == false) {
                numeric_columns.push(cols)
            }
        });
        if (metric == undefined) {
            metric = numeric_columns[0];
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
        selection_fields(numeric_columns);
        render(vdata, numeric_columns, extent_array);
    })
}

load_CSV(csv_report);
sunburst_selection();

document.getElementById("sunburst-selection").addEventListener("change", (e) => {
    csv_report = e.target.value;
    document.getElementById("metric-selection").options.length = 0;
    metric = document.getElementById("metric-selection").options[0];
    document.getElementById("sunburst-chart").innerHTML = "";
    load_CSV(csv_report);
})

document.getElementById("metric-selection").addEventListener("change", e => {
    metric = e.target.value;
    document.getElementById("sunburst-chart").innerHTML = "";
    load_CSV(csv_report);
})