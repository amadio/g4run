import * as d3 from "https://cdn.skypack.dev/d3@7";

const tabulate = (data, columns) => {
    const table = d3.select("#html-table").append("table");
    const thead = table.append("thead")
    const tbody = table.append("tbody");
    thead.append("tr").selectAll("th").data(columns).enter().append("th").text(d => d);

    const rows = tbody.selectAll("tr").data(data).enter().append("tr");
    const cells = rows.selectAll('td')
        .data(row => (
            columns.map(column =>
            ({
                column: column, value: row[column]
            })
            )
        ))
        .enter()
        .append('td')
        .text(d => d.value);
}

d3.csv("../demo.csv").then(data => {
    console.log(data)
    const columns = ['cycles', 'instr', 'IPC', 'IPB', 'B_Miss', 'Symbol'];
    tabulate(data, columns)
});