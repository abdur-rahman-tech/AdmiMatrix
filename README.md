# Adminatrix — University of Chitral Institutional Intelligence & Forecasting Platform

> **Advanced Education Analytics, Multi-Horizon Time-Series Forecasting, and Decision-Support Matrix for Upper & Lower Chitral**

---

## 1. Executive Summary & Vision

**Adminatrix** is a research-grade institutional intelligence and demographic forecasting platform engineered specifically for higher education planning in the Chitral valley (Khyber Pakhtunkhwa, Pakistan). Centered on the **University of Chitral (UOCH)**, the platform bridges verified decennial national census data with historical university admission registries to project future student demand over **5, 6, and 7 academic year horizons**.

Adminatrix answers the critical planning question:
> *"Based on historical demographic growth and verified institutional intake trends, what volume of male, female, and total student enrollment can reasonably be expected over the next 5 to 7 years, and how does this demand interact with campus infrastructure capacity?"*

Adminatrix is built as an **evidence-grounded decision-support system**. It rejects black-box guesswork, guarantees mathematical invariance, prevents time-series data leakage through walk-forward backtesting, and strictly separates unconstrained student demand from campus capacity constraints.

---

## 2. Core Problem & What Adminatrix Solves

### The Regional Challenge
1. **Rapid Gender Parity Transition:** The University of Chitral inaugurated in 2017 with a 33.98% female admission share. By 2024–2025, female admissions crossed 50.51%, reaching 51.60% in 2025–2026. Traditional planning models that assume static gender splits fail completely.
2. **Geographic & Demographic Isolation:** Nestled in the Hindu Kush mountains, Upper and Lower Chitral have unique demographic momentum (annual growth rate $\approx 1.74\%$). Planners need to know how regional population expansion translates into higher education demand without confusing correlation with direct causation.
3. **The "Arbitrary Cap" Fallacy:** Institutional planners frequently clamp their forecasts to existing classroom seats (e.g. 2,500 or 3,000 students), hiding real applicant demand. When demand is hidden, universities under-invest in faculty, dormitories, and labs.
4. **Black-Box AI Slop vs. Transparent Math:** Most modern dashboards either use hard-coded mock numbers or prompt ungrounded LLMs to hallucinate statistics. Adminatrix provides deterministic mathematical modeling, chronological backtesting, and strict data governance.

---

## 3. System Architecture & Tech Stack

```
adminatrix/
├── src/
│   ├── assets/              # Official emblems & regional visual assets
│   ├── components/
│   │   ├── admin/           # Administrative ingestion, PIN security & audit workbench
│   │   ├── analytics/       # Population analytics, admissions yield & correlation trends
│   │   ├── common/          # Reusable MetricCards, badges, status pills
│   │   ├── docs/            # Mathematical methodology modal & documentation
│   │   ├── forecast/        # Forecasting Control Room, Recharts composite visualizer
│   │   ├── layout/          # Sticky brand navigation & session controls
│   │   ├── overview/        # Executive summary dashboard & core indicators
│   │   └── query/           # Grounded Natural Language Query Assistant ("Ask the Data")
│   ├── data/
│   │   └── defaultDatasets.ts # Verified PBS Census records & calibrated UOCH admission cycles
│   ├── lib/
│   │   ├── ml/
│   │   │   ├── forecastingEngine.ts # 9 forecasting models, backtest evaluator & AUTO selector
│   │   │   └── mathUtils.ts         # OLS, quadratic regression, moving averages, logit link, safe MAPE
│   │   ├── nlp/
│   │   │   └── dataQueryEngine.ts   # Rule-grounded query answering engine (zero hallucination)
│   │   └── validation/
│   │       └── dataValidator.ts     # Pre-flight CSV validator & domain boundary enforcement
│   ├── types/
│   │   └── index.ts         # Strict TypeScript definitions & domain interfaces
│   ├── App.tsx              # Main orchestrator, tabs, global state & dark/light persistence
│   └── main.tsx             # React 19 entry point
├── package.json
└── vite.config.ts
```

### Technology Highlights
* **Core Framework:** React 19 SPA running on Vite 6 with TypeScript in strict mode.
* **Styling & Design System:** Tailwind CSS with dynamic dark/light mode synchronization via document root classes. Zero generic AI design patterns; clean typographic hierarchy.
* **Data Visualization:** Recharts (`ResponsiveContainer`, `ComposedChart`, `Line`, `Area`, `XAxis`, `YAxis`, `ReferenceLine`, `Tooltip`, `Legend`).
* **CSV Parsing & Validation:** PapaParse with real-time row-by-row syntax and mathematical integrity verification.
* **State Management:** Reactive hooks with derived memoization (`useMemo`, `useCallback`) ensuring complex statistical models never recompute unnecessarily.

---

## 4. Forecasting Model Suite

Adminatrix implements **9 distinct forecasting models**, combining classical time-series analysis, bounded link models, demographic proxies, and an automated data-driven selector.

| Model ID | Model Name | Mathematical Form | Best Used For |
| :--- | :--- | :--- | :--- |
| `AUTO` | **Auto Select Best Model** | Evaluates all eligible models via walk-forward backtesting | Automated, unbiased model selection based on historical performance |
| `NAIVE` | **Naive Persistence Baseline** | $\hat{y}_{T+h} = y_T$ | Standard benchmark to verify if complex models add true predictive value |
| `HOLT` | **Holt’s Linear Exponential Smoothing** | Level $L_t +$ Damped Trend $\sum \phi^k T_t$ | Captures local trajectory with dampening ($\phi=0.94$) to prevent explosive trends |
| `OLS` | **Ordinary Least Squares Regression** | $\hat{y}_t = \alpha + \beta \cdot t$ | Transparent, uniform linear slope across historical cycles |
| `DEMOGRAPHIC` | **Demographic Ratio Model** | $\hat{y}_t = \text{Population}_t \times \text{Participation Rate}_t$ | Links university intake to Chitral Census growth ($1.74\%/\text{yr}$) |
| `MOVING_AVG` | **3-Cycle Moving Average** | $\hat{y} = \frac{1}{3} \sum_{i=0}^2 y_{T-i}$ | Unweighted steady-state projection smoothed over recent cycles |
| `POLYNOMIAL` | **Polynomial Degree 2 Curve** | $\hat{y}_t = c + b \cdot t + a \cdot t^2$ | Captures curvilinear acceleration/deceleration with boundary damping |
| `LOGIT` | **Logit-Linked Asymptotic Trend** | $z = \ln\left(\frac{p}{1-p}\right) \to \text{OLS} \to \text{Sigmoid}$ | Strictly bounds gender ratios within $(0\%, 100\%)$ with realistic saturation |
| `ARIMA` | **ARIMA(1, 1, 0) Differenced Model** | $\Delta y_t = c + \phi_1 \Delta y_{t-1} + \varepsilon_t$ | Stochastic year-over-year increment changes with autoregressive memory |

---

## 5. Mathematical & Algorithmic Deep Dive

### 5.1 Automated Model Selection (`AUTO`) with Occam’s Razor
When `AUTO` is selected, the platform does not assume any model is universally superior. Instead:
1. It slices the historical series into expanding sequential windows.
2. It runs walk-forward validation for every eligible model.
3. It computes **MAE** (Mean Absolute Error), **RMSE** (Root Mean Squared Error), and **MAPE** (Mean Absolute Percentage Error).
4. Models are ranked primarily by lowest RMSE.
5. **Occam's Razor Rule:** If a simpler model (e.g. OLS or Holt) performs within $5\%$ of a higher-complexity model (e.g. Polynomial Degree 2), the system automatically selects the simpler model and documents the rationale in the UI.

### 5.2 Independent Gender Headcount Modeling
Many naive forecasting systems project total enrollment and then arbitrarily split it into male and female shares using a fixed percentage. Adminatrix rejects this.

Adminatrix evaluates and projects headcounts **independently**:
$$\hat{Y}_{\text{male}, t+h} = \mathcal{M}_{\text{male}}(\text{History}_{\text{male}})$$
$$\hat{Y}_{\text{female}, t+h} = \mathcal{M}_{\text{female}}(\text{History}_{\text{female}})$$
$$\hat{Y}_{\text{total}, t+h} = \hat{Y}_{\text{male}, t+h} + \hat{Y}_{\text{female}, t+h}$$

The platform then derives the gender ratios by exact algebraic definition:
$$R_{\text{female}} = \left(\frac{\hat{Y}_{\text{female}}}{\hat{Y}_{\text{total}}}\right) \times 100\% \quad \text{and} \quad R_{\text{male}} = 100.00\% - R_{\text{female}}$$

This mathematical invariance guarantees:
$$\text{Male Headcount} + \text{Female Headcount} = \text{Total Demand Headcount}$$
$$\text{Male Ratio (\%)} + \text{Female Ratio (\%)} = 100.00\%$$

### 5.3 Walk-Forward Time-Series Validation (No Data Leakage)
Standard K-fold cross-validation is statistically invalid for time-series data because training on future observations to predict past cycles creates artificial accuracy.

Adminatrix enforces **Expanding-Window Chronological Backtesting (Leave-Next-Out)**:
* **Step 1:** Train on cycles $2017\text{–}2021 \longrightarrow$ Predict $2022$
* **Step 2:** Train on cycles $2017\text{–}2022 \longrightarrow$ Predict $2023$
* **Step 3:** Train on cycles $2017\text{–}2023 \longrightarrow$ Predict $2024$
* **Step 4:** Train on cycles $2017\text{–}2024 \longrightarrow$ Predict $2025$

#### Validation Metrics Computed
* **MAE (Mean Absolute Error):**
  $$\text{MAE} = \frac{1}{K} \sum_{t=1}^K |y_t - \hat{y}_t|$$
* **RMSE (Root Mean Squared Error):**
  $$\text{RMSE} = \sqrt{\frac{1}{K} \sum_{t=1}^K (y_t - \hat{y}_t)^2}$$
* **Safe MAPE (Mean Absolute Percentage Error):**
  $$\text{MAPE} = \frac{100\%}{K} \sum_{t=1}^K \frac{|y_t - \hat{y}_t|}{|y_t|} \quad (\text{guarded against } |y_t| < 0.001)$$

### 5.4 Demographic Ratio Model Transparency
Rather than pretending demographic growth directly causes enrollment, Adminatrix defines the demographic relationship transparently:
$$\text{Participation Rate}_t = \frac{\text{Historical Admitted Students}_t}{\text{Chitral Population}_t}$$

For future cycles, population projects according to official PBS intercensal growth ($g = 1.74\%$ annually):
$$P_{T+h} = P_T \times (1 + g)^h$$
$$\text{Projected Admissions}_{T+h} = P_{T+h} \times \text{Projected Participation Rate}_{T+h}$$

**Explicit Proxy Disclosure:** Adminatrix labels total population as a demographic proxy because age-stratified ($18\text{–}24$ college cohort) census data is not published separately in open census tables.

### 5.5 Prediction Intervals (Uncertainty Envelope)
Adminatrix never claims "100% certainty" or "exact future commitments." Uncertainty is modeled dynamically:
$$\text{Margin of Error}_h = z \times \sigma_{\text{residuals}} \times \sqrt{1 + (h - 1) \times 0.25}$$
* For $80\%$ Prediction Interval: $z = 1.282$
* For $95\%$ Prediction Interval: $z = 1.960$

As the horizon advances ($h = 1 \dots 7$ years), the prediction band widens conditionally, visually and quantitatively exposing the expanding cone of uncertainty.

---

## 6. What-If Scenario Analysis & Capacity Separation

### 6.1 Future-Only Scenario Adjustments
Adminatrix provides real-time hypothetical stress testing:
* **Baseline (0% adjustment):** Pure continuation of historical momentum.
* **Optimistic (+4% compounded annually):** Reflects expanded provincial scholarship funding, new degree programs, or enhanced female transportation infrastructure.
* **Pessimistic (-4% compounded annually):** Reflects regional economic hardship, inflation, or severe weather disruptions.

$$\hat{Y}_{\text{scenario}, h} = \hat{Y}_{\text{model}, h} \times (1 + r_{\text{scenario}})^h$$

> **Core Invariant:** Scenarios apply strictly to future projections ($h \ge 1$). Historical actual records are never modified.

### 6.2 Demand Forecast vs. Campus Capacity Planning
Adminatrix strictly separates **statistical applicant demand** from **physical campus capacity**:
* Planners can configure an assumption slider (e.g. 1,800 to 4,500 seats; default 3,000).
* When projected demand exceeds capacity (e.g. Demand = 3,420 vs Capacity = 3,000), Adminatrix **does not** artificially cap the forecast line.
* Instead, the chart displays a distinct amber dashed reference line, and an actionable planning notice alerts the administration:
  > *"Projected demand for cycle 2028-2029 (3,420 students) exceeds the configured planning capacity assumption (3,000 seats) by approximately 420 students."*

---

## 7. Data Quality & Pre-Flight Validation Layer

Before forecasting calculations execute, the dataset passes through a pre-flight integrity validator that flags anomalies non-destructively:
* **Discontinuous Cycles:** Detects missing academic years in the timeline.
* **Duplicate Entries:** Flags duplicate records for the same academic cycle.
* **Mathematical Inconsistency:** Identifies records where $\text{Male} + \text{Female} \ne \text{Total}$.
* **Negative Values:** Blocks non-physical negative student counts.
* **Sudden Spikes / Outliers:** Flags single-cycle headcount shifts $>45\%$ as potential anomalies for administrative audit.

---

## 8. Live Groq Cloud LPU AI Architecture & Zero-Hallucination Reasoning

Adminatrix incorporates an active, production-grade **Groq Cloud LPU API** integration (`src/lib/ai/groqService.ts` and `src/components/query/AskTheData.tsx`) replacing static heuristics with ultra-fast, structured open-weight AI reasoning.

### 8.1 Groq LPU Model Architecture
* **Primary Deep Reasoning Model (`openai/gpt-oss-120b`):** Delivers rigorous institutional chain-of-thought analysis grounded directly in the deterministic statistical forecast and historical census records with ultra-low latency.
* **Low-Latency Instant Model (`openai/gpt-oss-20b`):** Fast conversational model for quick interactive querying.
* **Strict JSON Schemas:** Forced `{ type: "json_object" }` ensuring structured outputs with executive answers, data points, confidence rankings, source citations, and strategic recommendations.

### 8.2 Regional Context & Bilingual Support (Urdu & English)
All Groq outputs generate dual-stream analysis:
1. **Executive English Briefing:** Tailored for HEC evaluators and university chancellors.
2. **Regional Urdu Briefing (`اردو خلاصہ`):** Grounded translation rendered with proper RTL typography for regional Khyber Pakhtunkhwa stakeholders.

### 8.3 Hackathon Judge 3-Step Live AI Verification
1. **Configure Groq Key:** Add `GROQ_API_KEY=your_real_key_here` to the `.env` file (Groq options include `openai/gpt-oss-120b` (default) and `openai/gpt-oss-20b`). Alternatively, enter your key in **AI Settings** and click **"Save & Sync API Key"**.
2. **Execute Live Query:** Click the **"Ask AI"** tab in the navigation bar. Select a judge quick-test prompt or type any question. Observe live execution telemetry (Model: `Groq: openai/gpt-oss-120b`, Latency: ~300-500ms, Urdu translation).
3. **Run Live Executive Briefing:** Navigate to the **"Forecast"** tab, scroll to the bottom decision-support card, and click **"Generate Live Groq Briefing"** to see live AI policy reasoning generated from the active mathematical model output.

---

## 9. Live AI Features vs. Future Roadmap

| Feature | Status | Implementation Details |
| :--- | :--- | :--- |
| **Walk-Forward Time-Series ML** | ✅ Live Production | 9 mathematical models evaluated sequentially without data leakage |
| **Groq LPU Reasoning API** | ✅ Live Production | `openai/gpt-oss-120b` with instant LPU inference and zero hallucination |
| **Bilingual Urdu Synthesis** | ✅ Live Production | RTL-formatted Urdu summaries for regional provincial planners |
| **Runtime API Key Management** | ✅ Live Production | In-browser key configuration modal with live ping test and server sync |
| **Cross-Institutional Fed-Learning** | 🗺️ Future Roadmap | Federated models across Swat, Malakand, and Peshawar universities |

---

## 10. Getting Started & Development

### Prerequisites
* **Node.js:** v18.0.0 or higher
* **npm:** v9.0.0 or higher

### Installation & Local Run
```bash
# 1. Clone repository
git clone https://github.com/your-org/adminatrix.git
cd adminatrix

# 2. Install dependencies
npm install

# 3. Add your Groq API key to the local .env file:
#    GROQ_API_KEY=gsk_...
#    Never use a VITE_ prefix; VITE_ values are bundled into browser code.

# 4. Start development server (running on port 3000)
npm run dev

# 5. Verify TypeScript and linting
npm run lint

# 6. Build production bundle
npm run build

# 7. Serve the production build with the server-side AI proxy
npm start
```

Groq API keys are read by the server-side AI proxy and can also be configured directly via the UI settings modal. Prefer `GROQ_API_KEY` in `.env` for server-managed environments.

### Deploying to Vercel

The `/api/ai/*` endpoints run as Vercel serverless functions. In the Vercel project, add `GROQ_API_KEY` (with underscores) under **Settings → Environment Variables** for each environment you deploy, then redeploy. A GitHub Actions repository secret is not automatically available to Vercel at runtime; if you only created a GitHub secret, add the same key to Vercel's environment variables. Do not use `GROQ-API-KEY` or a `VITE_`-prefixed name.

---

## 10. Platform Governance & Data Ethics

* **PBS Census Records (1998, 2017, 2023):** Verified public data published by the Government of Pakistan.
* **University Admission Baseline:** Operates on historical admissions calibrated to institutional dynamics. Where official internal files require authorization, datasets are designated as **Verified** or **Synthetic Demonstration Profile** with persistent banner notifications.
* **Language Standards:** Adminatrix strictly uses probabilistic terminology: *"Projected"*, *"Estimated"*, *"Prediction Range"*, and *"Based on Available Data"*. It never guarantees the future.

---

## 11. Authors & Institutional Attribution

* **Platform Name:** Adminatrix
* **Institutional Focus:** University of Chitral (UOCH) & Regional Planning Directorate
* **Coverage:** Upper Chitral, Lower Chitral, Khyber Pakhtunkhwa, Pakistan
* **License:** MIT License — Open for academic and institutional research use.
