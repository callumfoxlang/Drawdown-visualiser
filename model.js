(function (root) {
  "use strict";

  function randomGenerator(seed) {
    let state = seed >>> 0;
    return function () {
      state = (state + 0x6D2B79F5) >>> 0;
      let value = state;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
  }

  function normal(random) {
    return Math.sqrt(-2 * Math.log(1 - random())) * Math.cos(2 * Math.PI * random());
  }

  function createPool(equityReturn, bondReturn) {
    const random = randomGenerator(1989);
    const shocks = Array.from({ length: 414 }, () => [normal(random), normal(random)]);
    const means = [0, 1].map(column => shocks.reduce((sum, pair) => sum + pair[column], 0) / shocks.length);
    const equities = shocks.map(pair => pair[0] - means[0]);
    const equityScale = Math.sqrt(equities.reduce((sum, value) => sum + value ** 2, 0) / shocks.length);
    const standardEquities = equities.map(value => value / equityScale);
    const independent = shocks.map(pair => pair[1] - means[1]);
    const projection = independent.reduce((sum, value, i) => sum + value * standardEquities[i], 0) / shocks.length;
    const residuals = independent.map((value, i) => value - projection * standardEquities[i]);
    const residualScale = Math.sqrt(residuals.reduce((sum, value) => sum + value ** 2, 0) / shocks.length);
    return shocks.map((_, i) => {
      const equityShock = standardEquities[i];
      const bondShock = 0.2 * equityShock + Math.sqrt(1 - 0.2 ** 2) * residuals[i] / residualScale;
      return [equityReturn / 12 + 0.16 / Math.sqrt(12) * equityShock, bondReturn / 12 + 0.06 / Math.sqrt(12) * bondShock];
    });
  }

  function simulate(options) {
    const { years, simulations, inflation, equityReturn, bondReturn, fees, strategy } = options;
    if (!Number.isInteger(years) || years < 1 || years > 60 || !Number.isInteger(simulations) || simulations < 100 || simulations > 5000 ||
        !Number.isFinite(inflation) || inflation < 0 || inflation > 0.15 ||
        !Number.isFinite(fees) || fees < 0 || fees > 0.1 ||
        !["inflation-adjusted", "fixed"].includes(strategy) ||
        !Number.isFinite(equityReturn) || equityReturn < -0.1 || equityReturn > 0.25 ||
        !Number.isFinite(bondReturn) || bondReturn < -0.1 || bondReturn > 0.25) {
      throw new RangeError("Invalid simulation parameters.");
    }
    const pool = createPool(equityReturn, bondReturn);
    const random = randomGenerator(2023);
    const failures = Array.from({ length: 10 }, () => Array(11).fill(0));
    for (let simulation = 0; simulation < simulations; simulation++) {
      const balances = Array.from({ length: 10 }, () => Array(11).fill(1));
      let withdrawalMultiplier = 1;
      for (let year = 0; year < years; year++) {
        let equity = 0;
        let bond = 0;
        for (let month = 0; month < 12; month++) {
          const sample = pool[Math.floor(random() * pool.length)];
          equity += sample[0];
          bond += sample[1];
        }
        for (let portfolio = 0; portfolio <= 10; portfolio++) {
          const equityWeight = portfolio / 10;
          const growth = Math.max(0, 1 + equity * equityWeight + bond * (1 - equityWeight)) * (1 - fees);
          for (let rate = 0; rate < 10; rate++) {
            if (balances[rate][portfolio] <= 0) continue;
            balances[rate][portfolio] = Math.max(0, balances[rate][portfolio] * growth - (rate + 1) / 100 * withdrawalMultiplier);
            if (balances[rate][portfolio] === 0) failures[rate][portfolio]++;
          }
        }
        if (strategy === "inflation-adjusted") withdrawalMultiplier *= 1 + inflation;
      }
    }
    return failures.map(row => row.map(count => count / simulations * 100));
  }

  root.DrawdownModel = { simulate, createPool };
})(typeof globalThis !== "undefined" ? globalThis : this);
