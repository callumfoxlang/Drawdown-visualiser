# Drawdown visualiser

To run with Streamlit, install the dependencies with `pip install -r requirements.txt` and run `streamlit run app.py`. For Streamlit Community Cloud, select this repository and branch and set the main file path to `app.py`. Commit and push the files before deploying, so Streamlit can access them.

Alternatively, open `index.html` in a browser to explore illustrative retirement withdrawal outcomes without installing anything.

Open `tests/model.test.html` and `tests/updates.test.html` in a browser to run the model and automatic-update tests.

The chart and heatmap show estimated failure rates for initial withdrawal rates of 1% to 10% and 11 portfolios: P0 is 100% bonds, P100 is 100% equities, and each intermediate step adds 10 percentage points of equities. Choose a 20, 30 or 40-year horizon, inflation, simulation count, and assumed equity and bond returns; the results update automatically. Invalid inputs leave the previous results displayed until corrected.

## Method and limitations

This prototype does **not** contain historical UK market data. It generates a reproducible pool of 414 synthetic monthly equity and bond return pairs, calibrated to the entered annualised means, annual volatilities of 16% and 6%, and a correlation of 0.2. Each simulated year draws 12 paired months with replacement; the arithmetic average monthly portfolio return multiplied by 12 is used as the annual return. Annual losses are capped at 100%. The same sampled return paths are used across portfolios and withdrawal rates for comparison.

Withdrawals are a fixed percentage of the initial portfolio, increased by the chosen inflation rate each year and deducted at year end after returns. A portfolio fails when its balance reaches zero or cannot meet a withdrawal, including at the end of the final year. Failure rates are the fraction of simulations that fail. Allocations are fixed and the model excludes fees and taxes.

These illustrative results are not predictions or financial advice. Synthetic data, arithmetic annualisation and independent monthly sampling can substantially change outcomes compared with historical returns, compounded returns or other simulation methodologies.
