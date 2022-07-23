import * as d3 from "https://cdn.skypack.dev/d3@7";

let flame_data = "pythia.svg";
const all_flames = ["pythia.svg", "pythia-inv.svg"];

const flame_selection = () => {
    all_flames.forEach(file => {
        d3.select("#flame-selection").append("option").text(file);
    })
}
const load_flame = () => {
    d3.select("#flame-object").attr("data", `Data/FlameGraphs/${flame_data}`);
}
document.getElementById("flame-selection").addEventListener("change", (e) => {
    flame_data = e.target.value;
    document.getElementById("flame-object").innerHTML = "";
    load_flame();
})
load_flame();
flame_selection();
