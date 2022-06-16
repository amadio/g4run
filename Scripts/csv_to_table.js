import * as d3 from "https://cdn.skypack.dev/d3@7";

let csv_report = "demo.csv";

// Store all the report files in this array
const all_reports = ["demo.csv","demo2.csv"];
// Getting the Options for selecting the report i.e. CSV File
const report_selection = () => {
    all_reports.forEach(file => {
        d3.select("#report-selection").append("option").text(file);
    })
}

// Selection Fields for metrics
const name_fields = table_columns => {
    for (let i = 0; i < table_columns.length - 1; i++) {
        d3.select("#column_fields").append("option").text(table_columns[i]);
    }
}

// Convert the CSV into Tables
const tabulate = (data, table_columns) => {
    const table = d3.select("#html-table").append("table").attr("id", "report-table");
    const thead = table.append("thead")
    const tbody = table.append("tbody");
    thead.append("tr").selectAll("th").data(table_columns).enter().append("th").text(d => d);

    const rows = tbody.selectAll("tr").data(data).enter().append("tr");

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
        .text(d => d.value).style("background-color", d => {
            if (d.column == "cycles")
                return d3.scaleLinear().domain([0.3, 3]).range(["#5225f5", "#f52540"])(parseFloat(d.value));
            if (d.column == "instr")
                return d3.scaleLinear().domain([0.3, 3]).range(["#5225f5", "#f52540"])(parseFloat(d.value));
            if (d.column == "IPC")
                return d3.scaleLinear().domain([1, 2.5]).range(["#5225f5", "#f52540"])(parseFloat(d.value));
            if (d.column == "IPB")
                return d3.scaleLinear().domain([5.5, 8.5]).range(["#5225f5", "#f52540"])(parseFloat(d.value));
            if (d.column == "B_Miss")
                return d3.scaleLinear().domain([0, 2]).range(["#5225f5", "#f52540"])(parseFloat(d.value));
        }).style("color", d => {
            if (d.column == "Symbol")
                return "black";
            return "white";
        });
}

// Load the CSV data into HTML using d3
const load_CSV = myVar => {
d3.csv(`Data/${myVar}`).then(data => {
    const table_columns = data.columns;
    tabulate(data, table_columns);
    name_fields(table_columns);
});
};

// Download the CSV file on clicking the Button
document.getElementById("csv-download").addEventListener("click", () => {
    window.open(`Data/${csv_report}`);
})

// Update the page on selecting the other Data File (CSV) for generating reports
document.getElementById("report-selection").addEventListener("change",(e) => {
    csv_report = e.target.value;
    document.getElementById("html-table").innerHTML = "";
    load_CSV(csv_report);
})

// Initialize the page to be viewed by default reports
load_CSV(csv_report);
report_selection();
