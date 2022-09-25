import {metrics} from "./metrics.js"

let ascending = false;
let last_column = "";

export default function tabulate(target, data, columns) {
  var table = d3.select(target).append("table");
  var thead = table.append("thead");
  var tbody = table.append("tbody");

  var heads = thead.append("tr")
    .selectAll("th")
    .data(columns)
    .enter()
      .append("th")
      .text(column => metrics[column] ? metrics[column].name : column.replaceAll("_", " "))
      .attr("title", column => metrics[column] ? metrics[column].description : column);

  var rows = tbody.selectAll("tr")
    .data(data)
    .enter()
      .append("tr");

  heads.on("click", (event, column) => {
    if (column != last_column)
      ascending = false;

    if (ascending)
      rows.sort(function (a, b) { return a[column] < b[column] ? -1 : 1; });
    else
      rows.sort(function (a, b) { return a[column] > b[column] ? -1 : 1; });

    last_column = column;
    ascending = !ascending;
  });

  var cells = rows.selectAll("td")
    .data(row => columns.map(col => {
      return {
        column: col,
        value: row[col],
        text: metrics[col] ? metrics[col].format(row[col]) : row[col],
        color: metrics[col] ? metrics[col].color(row[col]) : undefined
      };
    }))
    .enter()
      .append("td")
      .text(d => d.text)
      .style("background-color", d => d.color)

  return table;
}
