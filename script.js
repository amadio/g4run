//Logic for Switching the visualization tabs without reloading the page
const openTab = (elem, tabName) => {
    const tabs = document.getElementsByClassName("visual-tabs");
    for (let i = 0; i < tabs.length; i++) {
        tabs[i].classList.remove("active");
    }
    const tabContent = document.getElementsByClassName("visual-tab-content");
    for (let i = 0; i < tabContent.length; i++) {
        tabContent[i].style.display = "none";
    }
    document.getElementById(tabName).style.display = "block";
    elem.classList.add("active")
}
document.getElementById("default-tab").click();

//--------------->Make the Columns Array dynamic in both d3 logic and normal js logic<------------
const columns = ['cycles', 'instr', 'IPC', 'IPB', 'B_Miss', 'Symbol'];

// Get value of the selected column field from the dropdown
const getSelectedField = () => {
    const selectField = document.getElementById("column_fields").value;
    return selectField;
}

// Reset button hidden initially
const reset_btn = document.getElementById("reset-filter");
reset_btn.style.display = "none";

// Filtering the table columns based on threshold on clicking Apply button
const update = () => {
    reset_btn.style.display = "";
    let h_input, l_input, h_filter, l_filter, table, tr, td, txtValue, numValue, selectedIndex;
    h_input = document.getElementById("h_threshold");
    l_input = document.getElementById("l_threshold");
    h_filter = parseFloat(h_input.value);
    l_filter = parseFloat(l_input.value);
    table = document.getElementById("report-table");
    tr = table.getElementsByTagName("tr");

    if (h_filter && l_filter) {

        // Getting Index of selected dropdown
        for (let j = 0; j < columns.length; j++) {
            if (tr[0].getElementsByTagName("th")[j].innerText == getSelectedField()) {
                selectedIndex = j;
                break;
            };
        }
        
        // Filtering the Table based on Theshold Values provided
        let count = tr.length;
        for (let i = 0; i < tr.length; i++) {
            td = tr[i].getElementsByTagName("td")[selectedIndex];
            if (td) {
                txtValue = td.innerText;
                numValue = parseFloat(txtValue);
                if (numValue <= l_filter || numValue >= h_filter) {
                    tr[i].style.display = "none";
                    count--;
                }
            }
        }
        // If no entry matches the filters
        if (count - 1 == 0) {
            document.getElementById("html-table").innerText = "No Fields Exist in this range."
        }
    }
}

// Reset the table back to its initiall state
const reset = () => {
    const table = document.getElementById("report-table");
    const tr = table.getElementsByTagName("tr");
    const h_input = document.getElementById("h_threshold");
    const l_input = document.getElementById("l_threshold");
    for (let i = 0; i < tr.length; i++) {
        tr[i].style.display = "";
    }
    reset_btn.style.display = "none";
    h_input.value = "";
    l_input.value = "";
}
