const colors = {
  Male:   { Clothing: "#185FA5", Accessories: "#378ADD", Footwear: "#85B7EB", Outerwear: "#B5D4F4" },
  Female: { Clothing: "#993556", Accessories: "#D4537E", Footwear: "#ED93B1", Outerwear: "#F4C0D1" },
};

const width = 800, height = 450;

d3.csv("shopping_behavior_updated (1).csv").then(function(data) {

  data.forEach(d => d["Purchase Amount (USD)"] = +d["Purchase Amount (USD)"]);

  const rolled = d3.rollups(
    data,
    v => ({ count: v.length, spend: d3.sum(v, d => d["Purchase Amount (USD)"]) }),
    d => d["Gender"],
    d => d["Category"],
    d => d["Item Purchased"]
  );

  const totalCount = data.length;

  const treeData = {
    name: "root",
    children: rolled.map(([gender, categories]) => ({
      name: gender,
      children: categories.map(([category, items]) => ({
        name: category, gender,
        children: items.map(([item, vals]) => ({
          gender, category, item, value: vals.count, count: vals.count, spend: vals.spend
        }))
      }))
    }))
  };

  const svg = d3.select("#treemap")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const tooltip = d3.select("#treemap-tooltip");

  const root = d3.hierarchy(treeData)
    .sum(d => d.value)
    .sort((a, b) => b.value - a.value);

  d3.treemap()
    .size([width, height])
    .paddingOuter(8)
    .paddingInner(3)
    .paddingTop(24)
    (root);

  const cell = svg.selectAll("g")
    .data(root.leaves())
    .join("g")
    .attr("transform", d => `translate(${d.x0},${d.y0})`);

  cell.append("rect")
    .attr("width",  d => d.x1 - d.x0)
    .attr("height", d => d.y1 - d.y0)
    .attr("rx", 4)
    .attr("fill", d => colors[d.data.gender][d.data.category])
    .on("mousemove", (event, d) => {
      const pct = ((d.data.count / totalCount) * 100).toFixed(1);
      tooltip
        .style("opacity", 1)
        .style("left", (event.pageX + 14) + "px")
        .style("top",  (event.pageY - 10) + "px")
        .html(`<strong>${d.data.gender} — ${d.data.category} — ${d.data.item}</strong><br>
               ${d.data.count.toLocaleString()} purchases (${pct}%)<br>
               $${d.data.spend.toLocaleString()} total spend`);
    })
    .on("mouseleave", () => tooltip.style("opacity", 0));

  cell.append("clipPath").attr("id", (d, i) => `cp${i}`)
    .append("rect")
    .attr("width",  d => d.x1 - d.x0)
    .attr("height", d => d.y1 - d.y0);

  const label = cell.append("g").attr("clip-path", (d, i) => `url(#cp${i})`);

  label.append("text")
    .attr("x", 5).attr("y", 13)
    .attr("fill", "#fff").attr("font-size", "10px").attr("font-weight", 500)
    .text(d => (d.x1 - d.x0) > 30 && (d.y1 - d.y0) > 15 ? d.data.item : "");

  label.append("text")
    .attr("x", 5).attr("y", 25)
    .attr("fill", "rgba(255,255,255,0.8)").attr("font-size", "10px")
    .text(d => (d.x1 - d.x0) > 30 && (d.y1 - d.y0) > 28 ? d.data.count.toLocaleString() : "");

  root.children.forEach(p => {
    svg.append("text")
      .attr("x", p.x0 + 7).attr("y", p.y0 + 16)
      .attr("fill", "#666").attr("font-size", "11px")
      .text(p.data.name.toUpperCase());
  });

});