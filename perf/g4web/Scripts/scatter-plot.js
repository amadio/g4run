import * as d3 from "https://cdn.skypack.dev/d3@7";
// Scatter-Plot Data Selectors
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

// Dropdown for Scatter-Plot Selection
const scatter_selection = () => {
    all_reports.forEach(file => {
        d3.select("#scatter-plot-selection").append("option").text(file);
    })
}

let x_Axis;
let y_Axis;
let radius_value;
let color_value;
// Dropdown for Scatter-Plot Area
const selection_fields = numeric_columns => {
    d3.selectAll("#scatter-plot-x-axis").append("option").text(x_Axis).attr("class", "x-axis-value");
    d3.selectAll("#scatter-plot-y-axis").append("option").text(y_Axis).attr("class", "y-axis-value");
    d3.selectAll("#scatter-plot-color").append("option").text(color_value).attr("class", "color-value");
    d3.selectAll("#scatter-plot-radius-value").append("option").text(radius_value).attr("class", "radius_value");
    for (let i = 0; i < numeric_columns.length; i++) {
        d3.selectAll("#scatter-plot-x-axis").append("option").text(numeric_columns[i]).attr("class", "x-axis-value");
        d3.selectAll("#scatter-plot-y-axis").append("option").text(numeric_columns[i]).attr("class", "y-axis-value");
        d3.selectAll("#scatter-plot-circle-radius").append("option").text(numeric_columns[i]).attr("class", "radius-value");
        d3.selectAll("#scatter-plot-color").append("option").text(numeric_columns[i]).attr("class", "color-value");
    }

    // Removing Duplicate Entries in Dropdown
    let options = [];
    document.querySelectorAll(".x-axis-value").forEach((option) => {
        if (options.includes(option.value)) {
            option.remove();
        } else {
            options.push(option.value);
        }
    })
    options = [];
    document.querySelectorAll(".y-axis-value").forEach((option) => {
        if (options.includes(option.value)) {
            option.remove();
        } else {
            options.push(option.value);
        }
    })
    options = [];
    document.querySelectorAll(".radius-value").forEach((option) => {
        if (options.includes(option.value)) {
            option.remove();
        } else {
            options.push(option.value);
        }
    })
    options = [];
    document.querySelectorAll(".color-value").forEach((option) => {
        if (options.includes(option.value)) {
            option.remove();
        } else {
            options.push(option.value);
        }
    })
}

const margin = { top: 10, right: 10, bottom: 30, left: 80 }

const width = d3.select("#scatter-plot").node().getBoundingClientRect().width - margin.left - margin.right;
const height = d3.select("#scatter-plot").node().getBoundingClientRect().height - margin.top - margin.bottom;

let selection_mode = document.getElementById('selection-mode-toggle').checked;

const spiderPlot = (numeric_columns, d, extent_array) => {
    const percent_array_points = [];
    numeric_columns.forEach(i => {
        percent_array_points.push((d[i] / extent_array[numeric_columns.indexOf(i)][1]) * 100)
    })

    const spider_margin = {
        top: 10,
        right: 10,
        bottom: 10,
        left: 10
    }

    const spider_width = 600 - spider_margin.left - spider_margin.right;
    const spider_height = 300 - spider_margin.top - spider_margin.bottom;

    const spider_svg = d3.select("#spider-tooltip").append("svg").attr("class", "spider-plot-svg")
        .attr('width', spider_width)
        .attr('height', spider_height);

    const radialScale = d3.scaleLinear().domain([0, 100]).range([0, 100]);
    const ticks = [25, 50, 75, 100];
    ticks.forEach(t =>
        spider_svg.append('circle')
            .attr('cx', spider_width / 2)
            .attr('cy', spider_height / 2)
            .attr('fill', 'none')
            .attr('stroke', 'gray')
            .attr('r', radialScale(t))
            .attr('class', 'section-circle')
    );

    ticks.forEach(t => {
        spider_svg.append('line')
            .attr('x1', spider_width / 2)
            .attr('y1', spider_height / 2 - radialScale(t))
            .attr('x2', spider_width / 2 - 150)
            .attr('y2', spider_height / 2 - radialScale(t))
            .style("stroke", "grey")
            .style("stroke-width", 1)
            .style('opacity', 0.75)
        spider_svg.append("text")
            .attr('x', spider_width / 2 - 160)
            .attr('y', spider_height / 2 - radialScale(t))
            .text(t + "%");
    }
    )

    let line = d3.line().x(d => d.x).y(d => d.y);
    const angleToCoordinate = (angle, value) => {
        let x = Math.cos(angle) * radialScale(value);
        let y = Math.sin(angle) * radialScale(value);
        return { "x": spider_width / 2 + x, "y": spider_height / 2 - y };
    }

    numeric_columns.forEach((i, idx) => {
        let angle = (Math.PI / 2) + (2 * Math.PI * idx / numeric_columns.length);
        let line_coordinate = angleToCoordinate(angle, 100);
        let label_coordinate = angleToCoordinate(angle, 105);
        spider_svg.append("line")
            .attr("x1", spider_width / 2)
            .attr("y1", spider_height / 2)
            .attr("x2", line_coordinate.x)
            .attr("y2", line_coordinate.y)
            .attr("stroke", "black");

        // console.log(label_x);
        spider_svg.append('text')
            .attr("x", label_coordinate.x)
            .attr("y", label_coordinate.y)
            .attr("dx", "-1.35em")
            .text(`${i} : ${percent_array_points[idx].toFixed(2)}%`).style("fill", "green");

        spider_svg.append("text")
            .attr("x", 20)
            .attr("y", 20)
            .text(d.symbol);
    })

    const getPathCoordinates = (data_point) => {
        let coordinates = [];
        numeric_columns.forEach((i, idx) => {
            let ft_name = i;
            let angle = (Math.PI / 2) + (2 * Math.PI * idx / numeric_columns.length);

            coordinates.push(angleToCoordinate(angle, data_point[idx]));
        })
        return coordinates;
    }

    let dot_coordinates = getPathCoordinates(percent_array_points);
    spider_svg.append("path")
        .datum(dot_coordinates)
        .attr("d", line)
        .attr("stroke-width", 1)
        .attr("stroke", 'green')
        .attr("fill", 'red')
        .attr("stroke-opacity", 1)
        .attr("opacity", 0.5);

    dot_coordinates.forEach(d => {
        spider_svg.append('circle').attr('cx', d['x']).attr('cy', d['y']).attr('r', 2);
    });

}

const render = (data, extent_array, numeric_columns) => {
    document.getElementById("spider-tooltip").innerHTML = "";
    if (x_Axis == undefined || y_Axis == undefined || radius_value == undefined || color_value == undefined) {
        x_Axis = numeric_columns[0];
        if (numeric_columns[1] == undefined)
            y_Axis = numeric_columns[0];
        else
            y_Axis = numeric_columns[1];
        radius_value = numeric_columns[0];
        color_value = numeric_columns[0];
    }
    const plot_area = d3.select('#scatter-plot').append('svg')
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .attr("class", "chartArea")
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);
    // Remove the extra copy created while turning the brush off. 
    d3.select(d3.selectAll('.chartArea')._groups[0][1]).remove();
    //For X-Axis

    const x = d3.scaleLinear().domain(extent_array[numeric_columns.indexOf(x_Axis)]).range([0, width]);

    const xAxis = plot_area.append("g").attr('transform', `translate(0,${height})`).call(d3.axisBottom(x));

    const y = d3.scaleLinear().domain(extent_array[numeric_columns.indexOf(y_Axis)]).range([height, 0]);

    const yAxis = plot_area.append("g").attr('transform', `translate(0,0)`)
        .call(d3.axisLeft(y));


    const tooltip = d3.select("#spider-tooltip")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style('display', 'none')
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "1px")
        .style("border-radius", "5px")
        .style("padding", "10px");
    const mouseover = (event, d) => {
        d3.selectAll(".spider-plot-svg").remove();
        spiderPlot(numeric_columns, d, extent_array);
        tooltip.style("visibility", "visible").style('display', 'block')
    }

    const mousemove = (event, d) => {
        tooltip
            .style("left", (event.x) + 20 + "px")
            .style("top", (event.y) + 20 + "px")
    }

    // A function that change this tooltip when the leaves a point: just need to set opacity to 0 again
    const mouseleave = () => {
        tooltip
            .transition()
            .duration(200)
            .style("visibility", "hidden")
    }

    const clip = plot_area.append("defs").append("svg:clipPath")
        .attr("id", "clip")
        .append("svg:rect")
        .attr("width", width)
        .attr("height", height)
        .attr("x", 0)
        .attr("y", 0);

    let idleTimeout
    const idled = () => { idleTimeout = null };

    // A function that update the chart for given boundaries
    const updateChart = (event) => {
        const extent = event.selection;

        // If no selection, back to initial coordinate. Otherwise, update X axis domain
        if (!extent) {
            if (!idleTimeout) return idleTimeout = setTimeout(idled, 350); // This allows to wait a little bit
            x.domain([extent_array[0]])
            y.domain([extent_array[0]])
        } else {
            x.domain([extent[0][0], extent[1][0]].map(x.invert, x));
            y.domain([extent[1][1], extent[0][1]].map(y.invert, y));
            scatter.select(".brush").call(brush.move, null) // This remove the grey brush area as soon as the selection has been done
        }

        // Update axis and circle position
        xAxis.transition().duration(1000).call(d3.axisBottom(x))
        yAxis.transition().duration(1000).call(d3.axisLeft(y))
        scatter
            .selectAll("circle")
            .transition().duration(1000)
            .attr("cx", d => x(d[x_Axis]))
            .attr("cy", d => y(d[y_Axis]))

    }
    const brush = d3.brush()                 // Add the brush feature using the d3.brush function
        .extent([[0, 0], [width, height]]) // initialise the brush area: start at 0,0 and finishes at width,height
        .on("end", updateChart) // Each time the brush selection changes, trigger the 'updateChart' function

    const scatter = plot_area.append('g')
        .attr("clip-path", "url(#clip)")
    scatter
        .selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", d => x(d[x_Axis]))
        .attr("cy", d => y(d[y_Axis]))
        .attr("r", d => d3.scaleLinear().domain(extent_array[numeric_columns.indexOf(radius_value)]).range([5, 10])(d[radius_value]))
        .style("fill", d => {
            return d3.scaleLinear().domain(extent_array[numeric_columns.indexOf(color_value)]).range(["green", "red"])(parseFloat(d[color_value]));
        })
        .style("opacity", 0.5).on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave)

    if (selection_mode)
        scatter
            .append("g")
            .attr("class", "brush")
            .call(brush);
    else {
        d3.selectAll(".brush").remove();
    }

}
document.getElementById("spider-tooltip").style.display = 'none';
const load_CSV = file => {

    d3.csv(`Data/Table_Reports/raw-reports/${file}.csv`, d3.autoType).then(data => {

        let table_columns = data.columns;
        let numeric_columns = [];

        table_columns.forEach(cols => {
            if (isNaN(data[0][cols]) == false) {
                numeric_columns.push(cols)
            }
        });
        let extent_array = [];
        numeric_columns.forEach((i) => {
            let value_array = [];
            data.forEach(d => {
                value_array.push(d[i]);
            })
            extent_array.push(d3.extent(value_array));

        });
        render(data, extent_array, numeric_columns);
        selection_fields(numeric_columns);
    })
}

load_CSV(csv_report);
scatter_selection();

document.getElementById("selection-mode-toggle").addEventListener("change", () => {
    if (selection_mode == false) {
        selection_mode = true;
        document.getElementById("scatter-plot").innerHTML = "";
    } else {
        selection_mode = false;
    }
    load_CSV(csv_report);
});

document.getElementById("scatter-plot-selection").addEventListener("change", (e) => {
    csv_report = e.target.value;
    document.getElementById("scatter-plot").innerHTML = "";
    document.getElementById("scatter-plot-x-axis").options.length = 0;
    document.getElementById("scatter-plot-y-axis").options.length = 0;
    document.getElementById("scatter-plot-circle-radius").options.length = 0;
    document.getElementById("scatter-plot-color").options.length = 0;
    x_Axis = document.getElementById("scatter-plot-x-axis").options[0];
    y_Axis = document.getElementById("scatter-plot-y-axis").options[0];
    color_value = document.getElementById("scatter-plot-color").options[0];
    radius_value = document.getElementById("scatter-plot-circle-radius").options[0];
    load_CSV(csv_report);
});

document.getElementById("scatter-plot-x-axis").addEventListener("change", e => {
    x_Axis = e.target.value;
    document.getElementById("scatter-plot").innerHTML = "";
    load_CSV(csv_report);
})

document.getElementById("scatter-plot-y-axis").addEventListener("change", e => {
    y_Axis = e.target.value;
    document.getElementById("scatter-plot").innerHTML = "";
    load_CSV(csv_report);
})

document.getElementById("scatter-plot-circle-radius").addEventListener("change", e => {
    radius_value = e.target.value;
    document.getElementById("scatter-plot").innerHTML = "";
    load_CSV(csv_report);
})

document.getElementById("scatter-plot-color").addEventListener("change", e => {
    color_value = e.target.value;
    document.getElementById("scatter-plot").innerHTML = "";
    load_CSV(csv_report);
})
