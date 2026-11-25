(function () {
  "use strict";

  const colours = ["#294f43", "#507d64", "#94a953", "#b3a65c", "#d18b52", "#bd6956", "#9d6574", "#826f93", "#6686a4", "#71a6ac", "#c5a35b"];
  const form = document.getElementById("scenario-form");
  const svg = document.getElementById("chart");
  const ns = "http://www.w3.org/2000/svg";

  function element(name, attributes, text) {
    const node = document.createElementNS(ns, name);
    Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, value));
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function drawChart(results) {
    svg.querySelectorAll(".plot").forEach(node => node.remove());
    const plot = element("g", { class: "plot" });
    const left = 54, right = 738, top = 16, bottom = 278;
    const x = rate => left + rate / 10 * (right - left);
    const y = value => bottom - value / 100 * (bottom - top);
    for (let value = 0; value <= 100; value += 20) {
      plot.append(element("line", { x1: left, x2: right, y1: y(value), y2: y(value), class: "grid-line" }));
      plot.append(element("text", { x: left - 12, y: y(value) + 4, "text-anchor": "end", class: "axis-label" }, value + "%"));
    }
    for (let rate = 1; rate <= 10; rate++) {
      plot.append(element("text", { x: x(rate), y: bottom + 24, "text-anchor": "middle", class: "axis-label" }, rate + "%"));
    }
    plot.append(element("text", { x: (left + right) / 2, y: 333, "text-anchor": "middle", class: "axis-title" }, "INITIAL WITHDRAWAL RATE"));
    for (let portfolio = 0; portfolio <= 10; portfolio++) {
      const points = results.map((row, rate) => `${x(rate + 1)},${y(row[portfolio])}`).join(" ");
      plot.append(element("polyline", { points, fill: "none", stroke: colours[portfolio], "stroke-width": "2.5", "stroke-linejoin": "round" }));
      results.forEach((row, rate) => plot.append(element("circle", { cx: x(rate + 1), cy: y(row[portfolio]), r: "2.6", fill: colours[portfolio] })));
    }
    svg.append(plot);
  }

  function drawTable(results) {
    const table = document.getElementById("heatmap");
    const header = document.createElement("tr");
    const corner = document.createElement("th");
    corner.scope = "col";
    corner.textContent = "RATE";
    header.append(corner);
    for (let portfolio = 0; portfolio <= 10; portfolio++) {
      const cell = document.createElement("th");
      cell.scope = "col";
      cell.textContent = "P" + portfolio * 10;
      header.append(cell);
    }
    table.tHead.replaceChildren(header);
    const rows = results.map((row, index) => {
      const tr = document.createElement("tr");
      const heading = document.createElement("th");
      heading.scope = "row";
      heading.textContent = (index + 1) + "%";
      tr.append(heading);
      row.forEach(value => {
        const cell = document.createElement("td");
        cell.textContent = (Math.round(value * 10) / 10).toLocaleString("en-GB", { maximumFractionDigits: 1 }) + "%";
        cell.style.backgroundColor = `hsl(${Math.max(0, 140 - value * 1.4)} 45% ${91 - value * 0.14}%)`;
        tr.append(cell);
      });
      return tr;
    });
    table.tBodies[0].replaceChildren(...rows);
  }

  const legend = document.getElementById("legend");
  colours.forEach((colour, index) => {
    const item = document.createElement("span");
    const swatch = document.createElement("i");
    swatch.style.backgroundColor = colour;
    item.append(swatch, document.createTextNode("P" + index * 10));
    legend.append(item);
  });

  function run() {
    const options = {
      years: Number(document.getElementById("years").value),
      simulations: Number(document.getElementById("simulations").value),
      inflation: Number(document.getElementById("inflation").value) / 100,
      equityReturn: Number(document.getElementById("equity-return").value) / 100,
      bondReturn: Number(document.getElementById("bond-return").value) / 100
    };
    const results = DrawdownModel.simulate(options);
    drawChart(results);
    drawTable(results);
    document.getElementById("chart-horizon").textContent = `${options.years} YEARS · ${options.simulations.toLocaleString("en-GB")} SIMULATIONS`;
  }
  form.addEventListener("submit", event => {
    event.preventDefault();
    const error = document.getElementById("form-error");
    error.textContent = "";
    try {
      run();
    } catch (exception) {
      error.textContent = "Unable to run the simulation. Check the assumptions and try again.";
      console.error(exception);
    }
  });
  run();
})();
