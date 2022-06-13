import * as d3 from "https://cdn.skypack.dev/d3@7";

// Selection Fields
const name_fields = table_columns => {
    for (let i = 0; i < table_columns.length - 1; i++) {
        d3.select("select").append("option").text(table_columns[i]);
    }
}


const tabulate = (data, table_columns) => {
    const table = d3.select("#html-table").append("table").attr("id", "report-table");
    const thead = table.append("thead")
    const tbody = table.append("tbody");
    thead.append("tr").selectAll("th").data(table_columns).enter().append("th").text(d => d);
    let i = 0;
    let colour_row = "white";
    const rows = tbody.selectAll("tr").data(data).enter().append("tr").style("background-color", d => {
        return d3.scaleLinear()
            .domain([0.25, 0.75, 2])
            .range(["blue", "white", "red"])(parseFloat(d.B_Miss));
    });

    const cells = rows.selectAll('td')
        .data(row => (
            table_columns.map(column =>
            (
                {
                    column: column, value: row[column]
                })
            )
        ))
        .enter()
        .append('td')
        .text(d => d.value);
}

d3.csv("demo.csv").then(data => {
    const table_columns = data.columns;
    tabulate(data, table_columns);
    name_fields(table_columns);
});