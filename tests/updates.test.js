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
      if (!status.textContent.includes("Previous results are shown") || table.textContent !== previous) {
        throw new Error("Invalid input did not preserve and label previous results");
      }

      inflation.value = "5";
      inflation.dispatchEvent(new Event("input", { bubbles: true }));
      await wait();
      if (table.textContent === previous || status.textContent !== "Results update automatically.") {
        throw new Error("Corrected input did not update results");
      }
      output.textContent = "PASS Automatic updates, invalid input and recovery";
      document.title = "Tests passed";
    } catch (error) {
      output.textContent = "FAIL " + error.message;
      document.title = "Tests failed";
    }
  });
})();
