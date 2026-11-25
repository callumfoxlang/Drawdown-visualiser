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
    const startAge = Number(document.getElementById("start-age").value);
    const options = {
      years: Number(document.getElementById("years").value),
      simulations: Number(document.getElementById("simulations").value),
      inflation: Number(document.getElementById("inflation").value) / 100,
      fees: Number(document.getElementById("fees").value) / 100,
      strategy: document.getElementById("strategy").value,
      equityReturn: Number(document.getElementById("equity-return").value) / 100,
      bondReturn: Number(document.getElementById("bond-return").value) / 100
    };
    const results = DrawdownModel.simulate(options);
    drawChart(results);
    drawTable(results);
    document.getElementById("chart-horizon").textContent = `${options.years} YEARS · AGE ${startAge}–${startAge + options.years} · ${options.simulations.toLocaleString("en-GB")} SIMULATIONS`;
  }
  const status = document.getElementById("form-status");
  const exportButton = document.getElementById("export");
  const exportStatus = document.getElementById("export-status");
  let updateTimer;

  function update() {
    try {
      run();
      status.classList.remove("error");
      status.textContent = "Results update automatically.";
      exportButton.disabled = false;
    } catch (exception) {
      exportButton.disabled = true;
      status.classList.add("error");
      status.textContent = "Unable to update the simulation. Previous results are shown.";
      console.error(exception);
    }
  }

  function scheduleUpdate() {
    clearTimeout(updateTimer);
    exportButton.disabled = true;
    exportStatus.textContent = "";
    const invalid = form.querySelector(":invalid");
    if (invalid) {
      const label = invalid.labels[0].childNodes[0].textContent.trim();
      status.classList.add("error");
      status.textContent = `${label}: ${invalid.validationMessage} Previous results are shown.`;
      return;
    }
    status.classList.remove("error");
    status.textContent = "Updating results...";
    updateTimer = setTimeout(update, 300);
  }

  form.addEventListener("input", scheduleUpdate);
  form.addEventListener("change", scheduleUpdate);
  form.addEventListener("submit", event => {
    event.preventDefault();
    scheduleUpdate();
  });

  exportButton.addEventListener("click", async () => {
    exportButton.disabled = true;
    exportStatus.textContent = "Preparing image...";
    let imageUrl;
    try {
      const wrapper = element("svg", { xmlns: ns, width: 1000, height: 1210, viewBox: "0 0 1000 1210" });
      const text = (x, y, value, attributes = {}) => wrapper.append(element("text", {
        x, y, fill: "#233b32", "font-family": "Arial, sans-serif", "font-size": 13, ...attributes
      }, value));
      wrapper.append(element("rect", { width: 1000, height: 1210, fill: "#f5f6f2" }));
      text(30, 38, "Drawdown visualiser", { "font-family": "Georgia, serif", "font-size": 28 });
      const age = Number(document.getElementById("start-age").value);
      const years = Number(document.getElementById("years").value);
      const strategy = document.getElementById("strategy");
      const inflation = strategy.value === "inflation-adjusted" ? `Inflation ${document.getElementById("inflation").value}%` : "Inflation not applied";
      text(30, 59, `Illustrative scenario: age ${age}–${age + years} · ${years} years · ${document.getElementById("simulations").value} simulations · Fees ${document.getElementById("fees").value}%`);
      text(30, 76, `${strategy.selectedOptions[0].textContent} · ${inflation} · Equities ${document.getElementById("equity-return").value}% · Bonds ${document.getElementById("bond-return").value}%`);
      text(30, 90, "Synthetic returns, not historical UK market data. Results are not financial advice.", { fill: "#7d765b" });
      wrapper.append(element("rect", { x: 30, y: 110, width: 940, height: 530, rx: 10, fill: "#fff", stroke: "#e8ece6" }));
      text(58, 145, "THE BIG PICTURE", { fill: "#6d9477", "font-size": 11, "font-weight": "bold" });
      text(58, 177, "Where does the risk begin?", { "font-family": "Georgia, serif", "font-size": 24 });
      text(58, 198, "Portfolio failure rate by initial withdrawal rate", { fill: "#8a978c", "font-size": 12 });
      const chart = svg.cloneNode(true);
      chart.setAttribute("x", "75");
      chart.setAttribute("y", "210");
      chart.setAttribute("width", "850");
      chart.setAttribute("height", "340");
      const chartStyle = element("style", {});
      chartStyle.textContent = '.grid-line { stroke: #e9eee8; stroke-width: 1; } .axis-label { font: 11px Arial, sans-serif; fill: #91a095; } .axis-title { font: 700 9px Arial, sans-serif; letter-spacing: .12em; fill: #9aa99b; }';
      chart.prepend(chartStyle);
      wrapper.append(chart);
      colours.forEach((colour, index) => {
        const x = 86 + index * 75;
        wrapper.append(element("rect", { x, y: 575, width: 15, height: 3, rx: 1, fill: colour }));
        text(x + 20, 580, "P" + index * 10, { fill: "#78897b", "font-size": 11 });
      });
      text(58, 615, "← LOWER WITHDRAWAL", { fill: "#acb8ad", "font-size": 10 });
      text(942, 615, "HIGHER WITHDRAWAL →", { fill: "#acb8ad", "font-size": 10, "text-anchor": "end" });

      wrapper.append(element("rect", { x: 30, y: 660, width: 940, height: 520, rx: 10, fill: "#fff", stroke: "#e8ece6" }));
      text(58, 695, "A CLOSER LOOK", { fill: "#6d9477", "font-size": 11, "font-weight": "bold" });
      text(58, 727, "The numbers, at a glance.", { "font-family": "Georgia, serif", "font-size": 24 });
      text(58, 748, "The percentage of simulations where the portfolio ran out.", { fill: "#8a978c", "font-size": 12 });
      const rows = document.querySelectorAll("#heatmap tr");
      rows.forEach((row, rowIndex) => {
        Array.from(row.cells).forEach((cell, columnIndex) => {
          const x = 65 + columnIndex * 72;
          const y = 770 + rowIndex * 32;
          if (cell.tagName === "TD") wrapper.append(element("rect", { x, y, width: 69, height: 29, rx: 3, fill: cell.style.backgroundColor }));
          text(x + 34.5, y + 19, cell.textContent, { "text-anchor": "middle", fill: cell.tagName === "TD" ? "#425747" : "#829286", "font-size": 11, "font-weight": cell.tagName === "TH" ? "bold" : "normal" });
        });
      });
      text(58, 1150, "PORTFOLIO MIX: P0 = 100% BONDS · P100 = 100% EQUITIES", { fill: "#829286", "font-size": 10 });
      imageUrl = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(wrapper)], { type: "image/svg+xml;charset=utf-8" }));
      const image = new Image();
      image.src = imageUrl;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = 2000;
      canvas.height = 2420;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Unable to create image canvas.");
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const png = await new Promise(resolve => canvas.toBlob(resolve, "image/png"));
      if (!png) throw new Error("Unable to create PNG image.");
      const downloadUrl = URL.createObjectURL(png);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = "drawdown-visualiser.png";
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 60000);
      exportStatus.textContent = "Download requested.";
    } catch (exception) {
      exportStatus.textContent = "Unable to export the image. Please try again.";
      console.error(exception);
    } finally {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
      exportButton.disabled = status.textContent !== "Results update automatically.";
    }
  });
  update();
})();
