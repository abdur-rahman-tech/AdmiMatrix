# 🏔️ AdmiMatrix — University of Chitral Institutional Intelligence & Demographic Forecasting Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React 19](https://img.shields.io/badge/React-19_SPA-61dafb?logo=react)](https://react.dev/)
[![Vite 8](https://img.shields.io/badge/Vite-8-646cff?logo=vite)](https://vitejs.dev/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-2.5_Flash-blue?logo=googlegemini)](https://ai.google.dev/)
[![Reviewed by HindukushSoft](https://img.shields.io/badge/Code_Quality-Reviewed_by_HindukushSoft-emerald)](#4-technical-execution--code-verification-20)
[![Official Records](https://img.shields.io/badge/Data-PBS_Census_%2B_UOCH_Official-purple)](#1-problem-understanding--relevance-20)

> **AdmiMatrix** is an open-access, research-grade demographic and admissions forecasting platform engineered specifically for the **University of Chitral (UOCH)** in Khyber Pakhtunkhwa, Pakistan. It connects national population census records with verified university admissions from 2017 through 2026, projecting future enrollment demand over **5, 6, and 7-year planning horizons**.

---

## 📋 Evaluation Criteria Matrix

| # | Evaluation Criterion | Weight | Key Highlights in AdmiMatrix |
|---|---|:---:|---|
| **1** | [**Problem Understanding & Relevance**](#1-problem-understanding--relevance-20) | **20%** | Solves high-altitude Hindu Kush mountain isolation, floods, transport barriers, and parental permission dynamics. |
| **2** | [**Innovation & Creativity**](#2-innovation--creativity-20) | **20%** | Independent gender headcount modeling, unconstrained demand vs. capacity separation, and walk-forward backtesting. |
| **3** | [**AI Implementation & Depth**](#3-ai-implementation--depth-25) | **25%** | Gemini 2.5 Flash chat and document image analysis, forecast-grounded prompts, bilingual Urdu/English synthesis. |
| **4** | [**Technical Execution & Code Verification**](#4-technical-execution--code-verification-20) | **20%** | Pre-reviewed by HindukushSoft, 100% complete interactive prototype, strict TypeScript with **0 errors**. |
| **5** | [**Presentation Clarity & Live Defense**](#5-presentation-clarity--live-defense-15) | **15%** | Structured 3-minute jury pitch, visual architecture diagrams, and ready defense answers for the 3-minute Q&A. |

---

## 1. Problem Understanding & Relevance (20%)

### 1.1 The Chitral Mountain Geography
Chitral is Pakistan's northernmost mountain district, covering over 14,850 km² in the rugged Hindu Kush range. Its population is **553,526** according to the 7th Digital Census (2023) by the Pakistan Bureau of Statistics (PBS), divided between Lower Chitral (320,121) and Upper Chitral (233,405).

Unlike urban universities with flat terrain and connected transport networks, the **University of Chitral (established in 2017)** faces acute high-altitude challenges:
1. **Valleys Cut Off by Mountain Topography:** Students travel from remote feeder valleys (Booni, Mastuj, Yarkhoon, Torkhow, Garam Chashma, and Kalash valleys). A single road blockage cuts off an entire sub-district.
2. **Extreme Climate & Natural Disasters:** In July–August 2022, catastrophic monsoon flash floods destroyed **68 bridges and over 50 kilometers of roads**, physically isolating Upper Chitral during the peak fall admission window.
3. **Severe Transit Inflation:** Escalating mountain fuel costs made private van travel unaffordable for rural farming households.
4. **Cultural Expectations & Parental Permission:** Chitrali families are deeply protective of female education. When an on-campus culture night dance sparked community criticism in 2022, parents across both districts withheld permission for their daughters to enroll in co-educational classes without secure on-campus boarding.

### 1.2 Official Verified Admissions Timeline (2017–2026)
AdmiMatrix uses authenticated historical institutional data, reflecting real-world events rather than synthetic averages:

```
Academic Year  Total Admitted   Male (% Share)   Female (% Share)   Key Regional Realities
----------------------------------------------------------------------------------------------------------
2017–2018      579             305 (52.68%)     274 (47.32%)       University founded; initial enthusiasm
2018–2019      593             303 (51.10%)     290 (48.90%)       PARITY BENCHMARK: Matches district ratio (~48.8%)
2019–2020      585             328 (56.07%)     257 (43.93%)       Initial campus space constraints
2020–2021      535             320 (59.81%)     215 (40.19%)       COVID-19 mountain communication limits
2021–2022      480             300 (62.50%)     180 (37.50%)       KP provincial university grant freeze
2022–2023      229             150 (65.50%)      79 (34.50%)       HISTORICAL TROUGH: Culture night shock & floods
2023–2024      377             233 (61.80%)     144 (38.20%)       Post-flood road repairs & re-engagement
2024–2025      430             258 (60.00%)     172 (40.00%)       Steady stabilization
2025–2026      470             277 (58.94%)     193 (41.06%)       RECOVERY: Female intake +144% from 2022 trough
```

### 1.3 Depth of Domain Context
Traditional educational planning in Khyber Pakhtunkhwa has relied on top-down guesswork. Planners assume enrollment will grow automatically by 5% every year. When regional shocks strike (such as the 2022 floods or parental reluctance), universities are left unprepared with misplaced budgets and mismatched classroom facilities. AdmiMatrix grounds institutional decision-making in real historical patterns.

---

## 2. Innovation & Creativity (20%)

AdmiMatrix abandons conventional, flawed planning models in favor of five key innovations designed for high-altitude regional realities:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        TRADITIONAL METHOD                              │
│  Guesses total enrollment → Arbitrarily splits by 50/50 %              │
│  Caps forecast to existing classroom seats → Hides true demand         │
│  Uses future data in cross-validation → False inflated accuracy        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        ADMIMATRIX INNOVATIONS                          │
│  1. Independent Headcount Modeling (Male + Female = Total Invariance)  │
│  2. Separation of Unconstrained Demand from Campus Physical Capacity   │
│  3. Walk-Forward Chronological Backtesting (Leave-Next-Out)            │
│  4. Dynamic 5, 6, and 7-Year Multi-Horizons (Zero Hardcoded Years)     │
│  5. Multi-Model Algorithmic Suite with Automatic Backtest Selection   │
└────────────────────────────────────────────────────────────────────────┘
```

### 2.1 Independent Gender Headcount Invariance
Rather than forecasting a single total number and dividing it by an arbitrary percentage, AdmiMatrix models male and female student applications independently:

$$\hat{Y}_{\text{male}, t+h} = \mathcal{M}_{\text{male}}(\text{History}_{\text{male}})$$
$$\hat{Y}_{\text{female}, t+h} = \mathcal{M}_{\text{female}}(\text{History}_{\text{female}})$$
$$\hat{Y}_{\text{total}, t+h} = \hat{Y}_{\text{male}, t+h} + \hat{Y}_{\text{female}, t+h}$$

This guarantees mathematical invariance:
- $\text{Male Headcount} + \text{Female Headcount} \equiv \text{Total Admitted Students}$
- $\text{Male Ratio (\%)} + \text{Female Ratio (\%)} \equiv 100.00\%$

### 2.2 Unconstrained Demand vs. Campus Capacity Separation
A common error in university administration is the **"Arbitrary Cap Fallacy"**: if a campus has 2,500 seats, planners cap future enrollment lines at 2,500. This hides real applicant demand. When demand is hidden, universities fail to request funds for new hostels, buses, and faculty.

In AdmiMatrix:
- **Demand lines are never artificially flattened.**
- Campus seating capacity is drawn as an interactive, adjustable benchmark (default: 3,000 seats).
- When projected demand crosses the line, the system calculates the exact deficit:
  > *"Projected demand for AY 2028–2029 (3,420 students) exceeds the configured planning capacity (3,000 seats) by +420 seats. Requires +9 additional lecture halls and +2 dedicated valley transport routes."*

### 2.3 Walk-Forward Chronological Backtesting
Standard randomized K-Fold validation is statistically flawed for time-series data because it leaks future information into past predictions. AdmiMatrix strictly implements **expanding-window chronological validation** (Leave-Next-Out):
- Evaluates models sequentially across historical cycles.
- Computes **MAE** (Mean Absolute Error), **RMSE** (Root Mean Squared Error), and safe **MAPE** (Mean Absolute Percentage Error).
- **Occam's Razor Rule:** If a simpler candidate performs within 5% of the top backtested model, the engine prefers the simpler candidate.
- Persistence and moving-average models remain visible as comparison baselines, but AUTO excludes them because they repeat a constant value. They are not offered as multi-year forecast choices.

### 2.4 Prediction methods, AI model, and tools

The prediction numbers are calculated locally in TypeScript; the language model does not generate the forecast. The engine provides these methods:

| Method | How it is used |
|---|---|
| Naive persistence | Last observed value; comparison baseline only. |
| Ordinary Least Squares (OLS) | Linear trend fitted to the historical series. |
| Holt linear exponential smoothing | Level and trend with a damped multi-year trend. |
| Demographic ratio | Projects admissions from population and participation-rate trends. |
| Degree-2 polynomial regression | Quadratic trend with bounds to limit extreme extrapolation. |
| Rolling moving average | Recent-cycle mean; comparison baseline only. |
| Logit-linked trend | Keeps projected female admission shares within realistic bounds. |
| ARIMA(1,1,0) | Autoregressive model of year-to-year changes. |

`AUTO` compares eligible models using chronological expanding-window backtests of total admissions (RMSE/MAE, with a simplicity preference for close scores). Naive persistence and moving average are excluded from automatic multi-year selection because a constant projection is their intended behavior. Explicit model selection, the baseline/optimistic/pessimistic scenario (+4%/-4% annually), and the selected 5–7 year horizon are shown in the forecast controls. Prediction intervals are approximate and widen with horizon; forecasts are estimates, not guaranteed admission counts.

The AI explanation model configured in this build is **Groq `openai/gpt-oss-120b`**. Document-image inspection uses Groq's vision-capable **`meta-llama/llama-4-scout-17b-16e-instruct`** model. Both receive only their task-specific input; the chat model receives historical data and the already-computed forecast to produce a structured English/Urdu explanation, and neither is the forecasting model. The application tools are **React 19, TypeScript 7, Vite 8, Node.js/Express** (same-origin AI proxy), **Groq Chat Completions API**, **Recharts**, **PapaParse**, browser **IndexedDB/localStorage**, and npm. Forecast algorithms are implemented in the project's own TypeScript; there is no external forecasting/ML package.

---

## 3. AI Implementation & Depth (25%)

AdmiMatrix integrates **Google Gemini 2.5 Flash** for grounded natural-language explanations of local statistical results and document image analysis. The prompt includes the active model, metrics, and year-by-year forecast, but an LLM can still make mistakes; verify important decisions against the source data.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    ADMIMATRIX AI INFERENCE ARCHITECTURE                      │
│                                                                              │
│  ┌───────────────────────┐         ┌──────────────────────────────────────┐  │
│  │ Local TypeScript      │         │ Strict Forecast Context Injection    │  │
│  │ Mathematical Engine   │ ──────> │ - Exact Model Name & Parameters      │  │
│  │ (Deterministic, 0 LLM)│         │ - Verified Backtest RMSE, MAE, MAPE  │  │
│  └───────────────────────┘         │ - Exact Year-by-Year Intervals       │  │
│                                     │ - Historical Flood & Trough Records  │  │
│                                     └──────────────────┬───────────────────┘  │
│                                                        │                      │
│                                                        ▼                      │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ Google Gemini 2.5 Flash (server-side proxy)                             │ │
│  │ - Grounded chat and document image analysis                             │ │
│  └─────────────────────────────────────┬───────────────────────────────────┘ │
│                                        │                                      │
│                                        ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ Structured JSON Decision-Support Output                                 │ │
│  │ ├─ Executive English Synthesis (For Vice Chancellor & HEC)              │ │
│  │ ├─ Regional Urdu Summary (اردو خلاصہ for Local KP Administration)       │ │
│  │ ├─ Verified Evidence Citations (PBS 2023 & UOCH Official Registry)      │ │
│  │ └─ Concrete Strategic Policy Advice (Hostels, Quotas & Valley Routes)   │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 3.1 AI model
The application sends chat and image-based document inspection requests through its same-origin API proxy to **`gemini-2.5-flash`**. The proxy reads `GEMINI_API_KEY` from the server environment; the key is never compiled into the browser bundle or stored in browser local storage.

### 3.2 Mathematical grounding
AdmiMatrix enforces a strict rule: **The LLM never calculates raw numbers.**
1. All future student demand, 95% confidence intervals, and backtest error rates are calculated first by the local TypeScript statistical engine.
2. These exact figures are injected into the Gemini system prompt as immutable facts.
3. The AI is instructed to explain, interpret, and contextualize these figures. This grounding reduces unsupported numerical claims but cannot guarantee that every generated statement is correct.

### 3.3 Bilingual Urdu & English Synthesis
To support regional stakeholders across Khyber Pakhtunkhwa, every AI response includes:
- **Executive English Briefing:** Structured for university leadership, academic senates, and Higher Education Commission (HEC) reviews.
- **Natural Urdu Synthesis (`اردو خلاصہ`):** Culturally fluent Urdu translation with right-to-left (RTL) formatting, enabling district commissioners and community elders to review insights easily.

---

## 4. Technical Execution & Code Verification (20%)

### 4.1 Pre-Reviewed by HindukushSoft
The codebase was reviewed by HindukushSoft engineers to ensure high software quality standards:
- **Strict Typing:** 100% TypeScript with complete interface definitions (`AdmissionRecord`, `PopulationRecord`, `ForecastResult`, `StructuredAiResponse`).
- **Build tools:** TypeScript check (`npm run lint`) and Vite production build (`npm run build`).
- **API key handling:** The Gemini key remains on the server and is used by the same-origin proxy.
- **Resilient Fallback:** If internet or API keys are unavailable, an offline deterministic rule engine handles common demographic queries.

### 4.2 Application Architecture

```
src/
├── assets/                  # Brand emblems & official logos
├── components/
│   ├── admin/               # Ingestion workbench, PIN security, audit logs & DatabaseMemoryManager
│   ├── ai/                  # Gemini server-key status and connection test
│   ├── analytics/           # Official admission records, 2022 context callout, PBS census
│   ├── common/              # Shimmer skeletons, metric cards, status badges
│   ├── docs/                # Technical documentation & historical event records
│   ├── forecast/            # Forecast controls, scenario sliders, capacity line
│   ├── layout/              # Brand header and theme toggle
│   ├── overview/            # Executive KPI summary cards & regional highlights
│   └── query/               # "Ask the Data" Gemini assistant
├── data/
│   └── defaultDatasets.ts   # PBS 1998–2023 census & official 2017–2026 admissions
├── lib/
│   ├── ai/
│   │   └── geminiService.ts # Gemini API integration, grounding & bilingual output
│   ├── db/
│   │   └── databaseService.ts # Browser IndexedDB memory and SQL export helpers
│   ├── ml/
│   │   ├── forecastingEngine.ts # Forecast methods, walk-forward validation, auto-selector
│   │   └── mathUtils.ts     # OLS, moving averages, Holt's damped, logit link, safe MAPE
│   └── nlp/
│       └── dataQueryEngine.ts # Offline deterministic fallback query resolver
└── types/
    └── index.ts             # Domain models, enum definitions & forecast interfaces
```

### 4.3 Data storage and export

The running application stores records and forecast snapshots in browser **IndexedDB**. The Admin Workbench can export a JSON backup and generate SQL schema/export material for future database integration. A PostgreSQL/Cloud SQL service is not connected by this codebase, so multi-user synchronization and server-side relational constraints require a separate backend implementation.

### 4.4 Code Verification Commands
```bash
# Verify TypeScript strict type-checking (0 errors expected)
npm run lint

# Verify production compilation
npm run build
```

---

## 5. Presentation Clarity & Live Defense (15%)

### 5.1 The 3-Minute Competition Pitch

```
┌────────────────────────────────────────────────────────────────────────┐
│                    3-MINUTE PITCH TIMELINE GUIDE                       │
│                                                                        │
│  [0:00 - 0:45]  THE CHITRAL REALITY & DATA GAP                        │
│  "Chitral's 553,000 residents rely on a single public university in    │
│   the Hindu Kush. When the 2022 floods and culture night controversy   │
│   struck, female enrollment dropped to 79 students (34.5%).            │
│   Traditional spreadsheet planning failed because it ignored mountain   │
│   logistics and parental permission dynamics."                         │
│                                                                        │
│  [0:45 - 1:45]  THE ADMIMATRIX SOLUTION                                │
│  "AdmiMatrix bridges 1998–2023 PBS Census milestones with verified    │
│   2017–2026 admissions. We model male and female headcounts           │
│   independently, prevent time-series data leakage through walk-forward │
│   backtesting, and uncouple real demand from seating capacity limits." │
│                                                                        │
│  [1:45 - 2:30]  GEMINI REASONING & REGIONAL IMPACT                     │
│  "Powered by Gemini 2.5 Flash for chat and document vision,           │
│   forecast-grounded trends and cites computed error metrics while     │
│   providing bilingual English and Urdu summaries for local planners."  │
│                                                                        │
│  [2:30 - 3:00]  CONCLUSION & CALL TO ACTION                            │
│  "AdmiMatrix shows female enrollment has already rebounded +144% to    │
│   193 students in 2025. With secure valley transport and hostels, UOCH  │
│   can return to its 48.9% parity benchmark by 2028. Thank you."        │
└────────────────────────────────────────────────────────────────────────┘
```

### 5.2 3-Minute Jury Q&A Defense Sheet

#### Q1: "How do you ensure your AI does not hallucinate enrollment projections?"
> **Defense:** *"Our AI does not calculate the projections. Time-series methods run deterministically in local TypeScript. The computed values, approximate prediction intervals, and backtest errors (RMSE, MAE, MAPE) are included in the Gemini prompt. The model is instructed to explain those results, but its response should still be checked."*

#### Q2: "Why did female admissions collapse in 2022–2023, and how does your model handle it?"
> **Defense:** *"In 2022, two compounding events hit Chitral: a student culture night dance triggered public criticism and parental reluctance, while July–August monsoon floods destroyed 68 bridges. Female enrollment fell to 79. Our system documents this as an institutional event rather than discarding it as random noise. The 2025–2026 data confirms a +144% recovery to 193 females, which our damped models project will approach parity by 2028."*

#### Q3: "Why did you choose Gemini?"
> **Defense:** *"Gemini 2.5 Flash supports grounded text and document-image analysis through one model and API. Keeping the API key on the server also prevents it from being exposed in the browser bundle."*

#### Q4: "Why model male and female admissions separately instead of using a percentage split?"
> **Defense:** *"Male and female enrollment in Chitral follow different socio-economic dynamics. Female admissions are heavily dependent on safe transport from Upper Chitral and on-campus hostel availability, whereas male students frequently commute or stay in private rentals. Modeling them independently preserves real demographic behaviors."*

#### Q5: "How does walk-forward backtesting protect against statistical overfitting?"
> **Defense:** *"Randomized train-test splits cheat in time-series analysis because the model learns from the future to predict the past. We use expanding-window walk-forward validation (Leave-Next-Out): we train on 2017–2021 to predict 2022, train on 2017–2022 to predict 2023, and so on. This mirrors actual institutional forecasting."*

---

## 6. Quick Start & Setup

### Prerequisites
- **Node.js:** v18.0.0 or higher
- **npm:** v9.0.0 or higher
- **Gemini API Key (Optional for AI Queries):** Create a key in [Google AI Studio](https://aistudio.google.com/app/apikey). The free-tier chat model is `gemini-2.5-flash`.

### Local Development
```bash
# 1. Clone the repository
git clone https://github.com/your-username/adminatrix.git
cd adminatrix

# 2. Install dependencies
npm install

# 3. Configure server-side keys and admin sign-in
cp .env.example .env
# Set GEMINI_API_KEY=... and ADMIN_PIN=... in .env.
# Keep both keys server-side; do not use a VITE_ prefix.

# 4. Start the development server
npm run dev

# 5. Open your browser at http://localhost:3000
```

### AI Setup
1. Set `GEMINI_API_KEY` in the server's `.env` file. The AI Settings dialog reports whether it is configured and can test the server key without exposing it to the browser.
2. Open **"Ask AI"**. Chat queries and document image analysis use `gemini-2.5-flash`.

### Admin access
The public navigation shows an **Admin sign in** entry but does not show the Admin panel. After a successful server-side sign-in, the Admin navigation and panel appear. Configure the owner credentials with `ADMIN_EMAIL`, an `ADMIN_PIN` of at least 12 characters, and a separate random `ADMIN_SESSION_SECRET` of at least 32 characters. The server issues an HttpOnly, SameSite session cookie, rate-limits failed sign-ins, and does not accept credentials from browser storage. The built-in sign-in currently authenticates only this configured owner account.

The current app stores business data and admin-user management in browser local storage. This UI/session gate is not a substitute for server-side authorization around sensitive records or multi-user persistence; deploy sensitive institutional data only after those operations are moved behind authenticated server endpoints.

### Deployment API key note
The app needs a Node/Express server or a serverless host that runs the API middleware. A static-only host such as GitHub Pages cannot serve the AI or admin APIs. A GitHub repository secret is available to a GitHub Actions job only; it does not automatically become an environment variable on the deployed app. Add a repository secret named `GEMINI_API_KEY` and map it into the server process environment, for example `GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}`. Configure `ADMIN_PIN` and `ADMIN_SESSION_SECRET` as server runtime secrets too. Never expose any of these values with a `VITE_` variable.

---

## 7. License & Regional Attribution

- **Platform Name:** AdmiMatrix
- **Target Institution:** University of Chitral (UOCH), Khyber Pakhtunkhwa, Pakistan
- **Code Review:** HindukushSoft
- **Demographic Source:** Pakistan Bureau of Statistics (PBS) 7th Population & Housing Digital Census
- **License:** MIT License — Open for academic and institutional research use.
