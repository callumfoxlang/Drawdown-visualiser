(function () {
  "use strict";
  const output = document.getElementById("results");
  const tests = [];
  function test(name, fn) {
    try {
      fn();
      tests.push("PASS " + name);
    } catch (error) {
      tests.push("FAIL " + name + ": " + error.message);
    }
  }
  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }
  const options = { years: 30, simulations: 200, inflation: 0.025, equityReturn: 0.07, bondReturn: 0.035, fees: 0, strategy: "inflation-adjusted" };
  test("Synthetic pool matches its stated assumptions", () => {
    const pool = DrawdownModel.createPool(options.equityReturn, options.bondReturn);
    const means = [0, 1].map(i => pool.reduce((sum, pair) => sum + pair[i], 0) / pool.length);
    const variances = [0, 1].map(i => pool.reduce((sum, pair) => sum + (pair[i] - means[i]) ** 2, 0) / pool.length);
    const covariance = pool.reduce((sum, pair) => sum + (pair[0] - means[0]) * (pair[1] - means[1]), 0) / pool.length;
    assert(pool.length === 414, "wrong pool size");
    assert(Math.abs(means[0] * 12 - 0.07) < 1e-10 && Math.abs(means[1] * 12 - 0.035) < 1e-10, "incorrect means");
    assert(Math.abs(Math.sqrt(variances[0] * 12) - 0.16) < 1e-10 && Math.abs(Math.sqrt(variances[1] * 12) - 0.06) < 1e-10, "incorrect volatility");
    assert(Math.abs(covariance / Math.sqrt(variances[0] * variances[1]) - 0.2) < 1e-10, "incorrect correlation");
  });
  test("Results are reproducible, bounded and increase with withdrawals", () => {
    const result = DrawdownModel.simulate(options);
    assert(result.length === 10 && result.every(row => row.length === 11), "incorrect result shape");
    assert(JSON.stringify(result) === JSON.stringify(DrawdownModel.simulate(options)), "results differ across runs");
    assert(result.every(row => row.every(value => value >= 0 && value <= 100)), "rate outside 0–100%");
    assert(result.every((row, i) => i === 0 || row.every((value, p) => value >= result[i - 1][p])), "higher withdrawal lowered failure rate");
  });
  test("Higher inflation does not lower failure rates", () => {
    const base = DrawdownModel.simulate({ ...options, years: 20, inflation: 0 });
    const inflated = DrawdownModel.simulate({ ...options, years: 20, inflation: 0.1 });
    assert(inflated.every((row, i) => row.every((value, p) => value >= base[i][p])), "inflation lowered failure rate");
    assert(JSON.stringify(base) !== JSON.stringify(inflated), "inflation had no effect");
  });
  test("Fees and withdrawal strategy affect outcomes", () => {
    const fixed = DrawdownModel.simulate({ ...options, years: 25, strategy: "fixed" });
    const fixedHighInflation = DrawdownModel.simulate({ ...options, years: 25, strategy: "fixed", inflation: 0.1 });
    const adjusted = DrawdownModel.simulate({ ...options, years: 25, inflation: 0.1 });
    const withFees = DrawdownModel.simulate({ ...options, years: 25, strategy: "fixed", fees: 0.02 });
    assert(JSON.stringify(fixed) === JSON.stringify(fixedHighInflation), "fixed spending changed with inflation");
    assert(adjusted.every((row, i) => row.every((value, p) => value >= fixed[i][p])), "inflation-adjusted spending lowered failure rates");
    assert(withFees.every((row, i) => row.every((value, p) => value >= fixed[i][p])), "fees lowered failure rates");
    assert(JSON.stringify(withFees) !== JSON.stringify(fixed), "fees had no effect");
    assert(JSON.stringify(adjusted) !== JSON.stringify(fixed), "withdrawal strategy had no effect");
    assert(JSON.stringify(DrawdownModel.simulate({ ...options, years: 25, inflation: 0 })) === JSON.stringify(DrawdownModel.simulate({ ...options, years: 25, inflation: 0, strategy: "fixed" })), "strategies should match with zero inflation");
  });
  test("Custom horizon accepts both boundaries", () => {
    assert(DrawdownModel.simulate({ ...options, years: 1 }).length === 10, "one-year horizon rejected");
    assert(DrawdownModel.simulate({ ...options, years: 60 }).length === 10, "60-year horizon rejected");
  });
  test("Invalid parameters are rejected", () => {
    for (const invalid of [{ simulations: 0 }, { years: 0 }, { years: 61 }, { years: 2.5 }, { inflation: NaN }, { equityReturn: 0.26 }, { fees: -0.01 }, { fees: 0.11 }, { strategy: "unknown" }]) {
      let threw = false;
      try { DrawdownModel.simulate({ ...options, ...invalid }); } catch (error) { threw = error instanceof RangeError; }
      assert(threw, "invalid options accepted");
    }
  });
  output.textContent = tests.join("\n");
  document.title = tests.some(result => result.startsWith("FAIL")) ? "Tests failed" : "Tests passed";
})();
