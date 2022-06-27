export default function define(runtime, observer) {
  const filename = "treemap.json";
  const main = runtime.module();
  main.variable(observer("chart")).define("chart", ["treemap","data","d3","width","height","DOM","format","color"],
  function(treemap,data,d3,width,height,DOM,format,color)
{
  const root = treemap(data);

  const svg = d3
    .create("svg")
    .attr("viewBox", [0, 0, width, height])
    .style("font", "10px Open Sans, sans-serif");

  const shadow = DOM.uid("shadow");

  svg
    .append("filter")
    .attr("id", shadow.id)
    .append("feDropShadow")
    .attr("flood-opacity", 0.1)
    .attr("dx", 0)
    .attr("stdDeviation", 3);

  const node = svg
    .selectAll("g")
    .data(d3.group(root, d => d.height))
    .join("g")
    .attr("filter", shadow)
    .selectAll("g")
    .data(d => d[1])
    .join("g")
    .attr("transform", d => `translate(${d.x0},${d.y0})`);

  node.append("title").text(
    d =>
      `${d
        .ancestors()
        .reverse()
        .map(d => d.data.name)
        .join(" → ")} ${format(d.value / root.value)}`
  );

  node
    .append("rect")
    .attr("id", d => (d.nodeUid = DOM.uid("node")).id)
    .attr("fill", d => color(d.height))
    .attr("fill-opacity", 0.7)
    .attr("width", d => d.x1 - d.x0)
    .attr("height", d => d.y1 - d.y0);

  node
    .append("clipPath")
    .attr("id", d => (d.clipUid = DOM.uid("clip")).id)
    .append("use")
    .attr("xlink:href", d => d.nodeUid.href);

  node
    .append("text")
    .attr("clip-path", d => d.clipUid)
    .selectAll("tspan")
    .data(d =>
      d.data.name.split(/(.*)::/g).concat(format(d.value / root.value))
    )
    .join("tspan")
    .attr("fill-opacity", (d, i, nodes) =>
      i === nodes.length - 1 ? 0.8 : null
    )
    .text(d => d);

  node
    .filter(d => d.children)
    .selectAll("tspan")
    .attr("dx", 3)
    .attr("y", 10);

  node
    .filter(d => !d.children)
    .selectAll("tspan")
    .attr("x", 2)
    .attr(
      "y",
      (d, i, nodes) => `${(i === nodes.length - 1) * 0.3 + 1.1 + i * 0.9}em`
    );

  return svg.node();
}
);
  main.variable(observer("viewof colors")).define("viewof colors", ["html"], function(html){return(
html`<select>
  <option>schemeCategory10</option>
  <option>schemeAccent</option>
  <option selected>schemePaired</option>
  <option>schemeDark2</option>
  <option>schemeSet1</option>
  <option>schemeSet2</option>
  <option>schemeSet3</option>
  <option>schemePastel1</option>
  <option>schemePastel2</option>
  <option>schemeTableau10</option>
</select>`
)});
  main.variable(observer("colors")).define("colors", ["Generators", "viewof colors"], (G, _) => G.input(_));
  main.variable(observer("viewof tile")).define("viewof tile", ["html"], function(html){return(
html`<select>
  <option>treemapBinary</option>
  <option>treemapDice</option>
  <option>treemapSlice</option>
  <option>treemapSliceDice</option>
  <option selected>treemapSquarify</option>
</select>`
)});
  main.variable(observer("tile")).define("tile", ["Generators", "viewof tile"], (G, _) => G.input(_));

  main.variable(observer("data")).define("data", ["d3"], function(d3) { return d3.json(filename) });

  main.variable(observer("treemap")).define("treemap", ["d3","width","height","tile"], function(d3,width,height,tile){return(
data =>
  d3
    .treemap()
    .size([width, height])
    .tile(d3[tile])
    .paddingOuter(1)
    .paddingTop(13)
    .paddingInner(1)
    .round(true)(
    d3
      .hierarchy(data)
      .sum(d => d.value)
      .sort((a, b) => b.value - a.value)
  )
)});
  main.variable(observer("width")).define("width", function(){return( window.innerWidth) });
  main.variable(observer("height")).define("height", function(){return( window.innerHeight)});
  main.variable(observer("format")).define("format", ["d3"], function(d3){return(
d3.format(".2%")
)});
  main.variable(observer("color")).define("color", ["d3","colors"], function(d3,colors){return(
d3.scaleOrdinal(d3[colors])
)});
  main.variable(observer("d3")).define("d3", ["require"], function(require){return(
require("d3@6")
)});
  return main;
}
