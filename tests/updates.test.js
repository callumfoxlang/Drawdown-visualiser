(function () {
  "use strict";
  const output = document.getElementById("results");
  const iframe = document.getElementById("app");
  const wait = () => new Promise(resolve => setTimeout(resolve, 600));

  iframe.addEventListener("load", async () => {
    try {
      const doc = iframe.contentDocument;
      const horizon = doc.getElementById("chart-horizon");
      const table = doc.querySelector("#heatmap tbody");
      const status = doc.getElementById("form-status");
      const years = doc.getElementById("years");
      const inflation = doc.getElementById("inflation");
      const startAge = doc.getElementById("start-age");
      const fees = doc.getElementById("fees");
      const strategy = doc.getElementById("strategy");
      const exportButton = doc.getElementById("export");
      const original = table.textContent;

      years.value = "20";
      years.dispatchEvent(new Event("change", { bubbles: true }));
      await wait();
      if (!horizon.textContent.startsWith("20 YEARS") || table.textContent === original) {
        throw new Error("Changing the horizon did not update results");
      }

      const previous = table.textContent;
      inflation.value = "";
      inflation.dispatchEvent(new Event("input", { bubbles: true }));
      await wait();
      if (!status.textContent.includes("Previous results are shown") || table.textContent !== previous || !exportButton.disabled) {
        throw new Error("Invalid input did not preserve and label previous results");
      }

      inflation.value = "5";
      inflation.dispatchEvent(new Event("input", { bubbles: true }));
      await wait();
      if (table.textContent === previous || status.textContent !== "Results update automatically.") {
        throw new Error("Corrected input did not update results");
      }
      const beforeAge = table.textContent;
      startAge.value = "60";
      startAge.dispatchEvent(new Event("input", { bubbles: true }));
      await wait();
      if (!horizon.textContent.includes("AGE 60–80") || table.textContent !== beforeAge) {
        throw new Error("Start age did not update the end age independently of results");
      }
      fees.value = "0.75";
      fees.dispatchEvent(new Event("input", { bubbles: true }));
      strategy.value = "fixed";
      strategy.dispatchEvent(new Event("change", { bubbles: true }));
      await wait();
      if (table.textContent === beforeAge) throw new Error("Fees and strategy did not update results");

      const win = iframe.contentWindow;
      let downloaded;
      let svgBlob;
      const originalCreateUrl = win.URL.createObjectURL.bind(win.URL);
      win.URL.createObjectURL = blob => {
        if (blob.type.startsWith("image/svg+xml")) svgBlob = blob;
        return originalCreateUrl(blob);
      };
      win.HTMLAnchorElement.prototype.click = function () {
        downloaded = { url: this.href, name: this.download };
      };
      exportButton.click();
      for (let i = 0; i < 50 && !downloaded; i++) await new Promise(resolve => setTimeout(resolve, 100));
      if (!downloaded) throw new Error("Export did not create a download");
      const blob = await (await win.fetch(downloaded.url)).blob();
      const image = await win.createImageBitmap(blob);
      if (downloaded.name !== "drawdown-visualiser.png" || blob.type !== "image/png" || image.width !== 2000 || image.height !== 2420) {
        throw new Error("Exported image has an incorrect format or size");
      }
      const exported = new DOMParser().parseFromString(await svgBlob.text(), "image/svg+xml");
      const exportedText = exported.documentElement.textContent;
      const displayedCells = Array.from(doc.querySelectorAll("#heatmap tr")).flatMap(row => Array.from(row.cells, cell => cell.textContent));
      const exportedCells = Array.from(exported.querySelectorAll("text")).slice(-displayedCells.length - 1, -1).map(cell => cell.textContent);
      const displayedLines = Array.from(doc.querySelectorAll("#chart polyline"), line => line.getAttribute("points"));
      const exportedLines = Array.from(exported.querySelectorAll("polyline"), line => line.getAttribute("points"));
      if (!exportedText.includes("20 years") || !exportedText.includes("age 60–80") || !exportedText.includes("Fees 0.75%") ||
          !exportedText.includes("Fixed spending") || !exportedText.includes("Inflation not applied") ||
          displayedLines.length !== 11 || JSON.stringify(exportedLines) !== JSON.stringify(displayedLines) ||
          JSON.stringify(exportedCells) !== JSON.stringify(displayedCells)) {
        throw new Error("Export does not contain the displayed scenario and results");
      }
      output.textContent = "PASS Automatic updates, validation and PNG export";
      document.title = "Tests passed";
    } catch (error) {
      output.textContent = "FAIL " + error.message;
      document.title = "Tests failed";
    }
  });
})();
