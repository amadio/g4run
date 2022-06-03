const openTab = (elem, tabName) => {
    console.log(elem)
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
document.getElementById("defaultOpenTab").click();

const openReport = (elem, reportName) => {
    const reports = document.getElementsByClassName("report-tabs");
    for(let i=0; i< reports.length; i++){
        reports[i].classList.remove("active");
    }
    const reportContent = document.getElementsByClassName("report-contents");
    for(let i=0 ;i< reportContent.length; i++){
        reportContent[i].style.display = "none";
    }
    document.getElementById(reportName).style.display = "block";
    elem.classList.add("active");
}
document.getElementById("defaultOpenReport").click();

const reader = new FileReader();
console.log(reader);