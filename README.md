# AdmiMatrix

AdmiMatrix is a browser-based analytics dashboard for exploring Chitral population and University of Chitral (UOCH) admissions data. It combines historical summaries, data-quality checks, and configurable student-demand forecasts to support planning.

## Features

- Population and admissions dashboards with historical trends
- Five-, six-, and seven-year forecasts with model comparison, scenarios, and prediction intervals
- CSV import with field, year, headcount, and gender-total validation
- Capacity threshold alerts and forecast CSV export
- Admin screens for managing datasets and access requests
- Rule-based "Ask the Data" queries for supported population, admissions, and forecast questions
- Responsive interface with light and dark themes

## How It Works

1. **Load data:** The app starts with bundled population and admissions records. Population records include census observations and labeled estimates; the bundled UOCH admissions history is marked as synthetic demonstration data.
2. **Review and update:** Dashboards summarize records by year and gender. Administrators can import CSV data; invalid rows are reported rather than accepted. Dataset and admin changes persist in browser storage on that device.
3. **Choose a forecast:** The forecasting control room takes the admissions history, selected model, 5/6/7-year horizon, scenario, and planning-capacity threshold.
4. **Calculate results:** The forecasting engine sorts records chronologically, reports data-quality warnings, backtests candidate models using expanding historical windows, then calculates future values. For most models, male and female headcounts are forecast separately and summed; LOGIT and DEMOGRAPHIC use their documented split methods below.
5. **Inspect or export:** Results show annual total, male, and female demand; gender ratios; uncertainty ranges; model error metrics; scenario adjustments; and capacity-exceedance flags. Forecasts can be exported as CSV.

Capacity is an alert threshold, not a cap: projections remain unchanged when demand exceeds the configured capacity. Baseline leaves projections unadjusted; Optimistic and Pessimistic apply compounded +4% and -4% annual scenario adjustments to future years only.

## Forecast Models

All models are implemented in the project's TypeScript forecasting engine; no external machine-learning service is required.

| Model | What it does |
| --- | --- |
| `AUTO` | Backtests six headcount models (NAIVE, OLS, HOLT, MOVING_AVG, POLYNOMIAL, ARIMA) and selects using historical RMSE, with a simpler-model preference when performance is within 5%. |
| `NAIVE` | Holds the latest observed value constant as a benchmark. |
| `OLS` | Extends a least-squares straight-line trend. |
| `HOLT` | Smooths level and trend, then damps the trend for future years. |
| `MOVING_AVG` | Extends the average of up to the latest three cycles as a steady-state projection. |
| `POLYNOMIAL` | Fits a quadratic trend and bounds extreme projections. |
| `ARIMA` | Uses an ARIMA(1,1,0)-style model of changes between cycles; falls back to Holt for short histories. |
| `LOGIT` | Projects total demand with Holt and female share with a bounded logit trend, then derives male demand from the remainder. |
| `DEMOGRAPHIC` | Projects population using the latest recorded growth rate and multiplies it by a historical admissions participation-rate trend; it uses the latest gender split. |

`AUTO` currently evaluates the six headcount models listed in its row; LOGIT and DEMOGRAPHIC are selectable separately, not candidates in AUTO selection. Backtesting requires at least four historical observations. The scorecard reports MAE, RMSE, and MAPE. Prediction intervals are residual-based approximations that widen with forecast horizon; they are not guarantees of coverage.

## Data and Query Notes

- Population data includes 1998, 2017, and 2023 census observations plus records explicitly marked as estimates. Review each record's source and estimate status before interpreting it as an official count.
- Bundled UOCH admissions are a synthetic demonstration profile, not verified institutional intake records. Imported records are labeled according to the application's import workflow; users should verify source documents themselves.
- CSV validation checks academic-year format and duplicates, nonnegative numeric headcounts, male/female totals, admitted-versus-applicant totals, and unusual ratios. Forecast preflight also warns about timeline gaps, duplicate years, inconsistent totals, negative counts, and large single-cycle changes.
- "Ask the Data" uses local keyword rules over the available records and current forecast. It is not a general-purpose AI assistant; unsupported questions return an unavailable-data response.
- Admin PINs and datasets are handled in browser storage. This client-side demo is not production authentication and should not store sensitive or confidential information.

## Tools and Libraries

- **React 19 + TypeScript:** user interface and application logic
- **Vite 8:** development server and production bundling
- **Tailwind CSS 4:** styling
- **Recharts:** population, admissions, and forecast charts
- **PapaParse:** CSV parsing before validation
- **Lucide React:** interface icons
- **Browser localStorage/sessionStorage:** demo persistence for records, preferences, and session state

The forecasting math and query rules are project code in `src/lib/ml` and `src/lib/nlp`. The app does not call an LLM to generate forecast results.

## Run Locally

Requires Node.js 20.19 or later, or 22.12 or later (Vite 8 requirement).

```bash
npm install
npm run dev
```

The development server is available at `http://localhost:3000`.

```bash
npm run lint
npm run build
```

Use `npm run clean` to remove generated build output.

`npm run lint` runs the TypeScript check. `npm run clean` removes generated build output. Forecasts are estimates based on available data, not guaranteed outcomes; confirm inputs and source labels before using results for institutional decisions.

## Project Team

- **Team leader:** Abdur Rahman | 0345 1441531
- **Member:** Quarrtul Ain
- **Member:** Samrina Aziz
- **Member:** Muhammad Hanif | 0344 9700533