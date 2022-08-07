//Logic for Switching the visualization tabs without reloading the page
const openTab = (elem, tabName) => {
    const tabs = document.getElementsByClassName("visual-tabs");
    for (let i = 0; i < tabs.length; i++) {
        tabs[i].classList.remove("active");
    }
    const tabContent = document.getElementsByClassName("visual-tab-content");
    for (let i = 0; i < tabContent.length; i++) {
            tabContent[i].style.visibility = "hidden";
            tabContent[i].style.position = "absolute";
    }
    document.getElementById(tabName).style.position = "";
    document.getElementById(tabName).style.visibility = "visible";
    elem.classList.add("active")
}
document.getElementById("default-tab").click();

const loadReport = (elem,reportType) => {
    const tabs = document.getElementsByClassName("report-type");
    for (let i=0; i< tabs.length; i++){
        tabs[i].classList.remove("report-active");
    }
    const tabContent = document.getElementsByClassName("report-type-content");
    for(let i=0; i<tabContent.length; i++){
        tabContent[i].style.display = "none";
    }
    document.getElementById(reportType).style.display = "block";
    elem.classList.add("report-active")
}
document.getElementById("default-report-type").click();

const loadTreeMap = (elem,treeMapType) => {
    const tabs = document.getElementsByClassName('treemap-type');
    const tabContent = document.getElementsByClassName("treemap-type-content");
    for(let i=0; i<tabContent.length; i++){
        tabContent[i].style.display = "none";
        tabs[i].classList.remove("report-active");
    }
    document.getElementById(treeMapType).style.display = "block";
    elem.classList.add("report-active")
}
document.getElementById("default-treemap-type").click();