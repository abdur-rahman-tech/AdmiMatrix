import {
  AdmissionRecord,
  PopulationRecord,
  ForecastResult,
  ForecastModelId,
  ForecastScenario,
  ModelMetricSummary,
  PredictionPoint,
  ModelComparisonItem,
  DemographicRatioDetails
} from '../../types';
import {
  mean,
  clamp,
  logit,
  invLogit,
  linearRegression,
  polynomialRegression2,
  movingAverage,
  safeMAPE,
  incrementAcademicYear
} from './mathUtils';

export interface SingleSeriesForecastOutput {
  pointForecasts: number[];
  sigma: number;
  parameters: Record<string, number | string>;
  algorithm: string;
  notes: string;
}

// -------------------------------------------------------------
// 1. NAIVE BASELINE MODEL (Benchmark)
// y_{T+h} = y_T (latest observed value)
// -------------------------------------------------------------
export function fitNaiveBaseline(
  series: number[],
  horizon: number
): SingleSeriesForecastOutput {
  const n = series.length;
  const lastVal = n > 0 ? series[n - 1] : 0;
  
  // Residuals: one-step-ahead naive persistence on history
  const residuals: number[] = [];
  for (let i = 1; i < n; i++) {
    residuals.push(series[i] - series[i - 1]);
  }
  const variance = residuals.length > 0
    ? residuals.reduce((sum, r) => sum + r * r, 0) / residuals.length
    : 10.0;
  const sigma = Math.sqrt(variance) || 1.0;

  return {
    pointForecasts: Array.from({ length: horizon }, () => lastVal),
    sigma,
    parameters: {
      benchmarkType: 'Naive Persistence (y_t = y_{t-1})',
      lastObservedValue: Number(lastVal.toFixed(2))
    },
    algorithm: 'Naive Forecast Baseline (Persistence Benchmark)',
    notes: 'Simple random-walk persistence benchmark. Uses latest observed historical value as the future baseline against which sophisticated models are tested.'
  };
}

// -------------------------------------------------------------
// 2. ORDINARY LEAST SQUARES (OLS) LINEAR REGRESSION
// y_t = alpha + beta * t
// -------------------------------------------------------------
export function fitOLSLinear(
  series: number[],
  horizon: number
): SingleSeriesForecastOutput {
  const n = series.length;
  if (n < 2) {
    return fitNaiveBaseline(series, horizon);
  }

  const x = series.map((_, i) => i);
  const ols = linearRegression(x, series);

  const residuals: number[] = [];
  for (let i = 0; i < n; i++) {
    residuals.push(series[i] - ols.predict(i));
  }
  const variance = residuals.reduce((sum, r) => sum + r * r, 0) / Math.max(1, n - 2);
  const sigma = Math.sqrt(variance) || 1.0;

  const pointForecasts: number[] = [];
  for (let h = 1; h <= horizon; h++) {
    const val = Math.max(0, ols.predict(n - 1 + h));
    pointForecasts.push(val);
  }

  return {
    pointForecasts,
    sigma,
    parameters: {
      slope: Number(ols.slope.toFixed(2)),
      intercept: Number(ols.intercept.toFixed(2)),
      rSquared: Number(ols.rSquared.toFixed(3))
    },
    algorithm: 'Ordinary Least Squares (OLS) Linear Regression',
    notes: 'Fits an optimal straight-line trajectory across all historical cycles using standard variance-covariance minimization.'
  };
}

// -------------------------------------------------------------
// 3. HOLT'S LINEAR EXPONENTIAL SMOOTHING (DAMPED)
// -------------------------------------------------------------
export function fitHoltLinear(
  series: number[],
  horizon: number
): SingleSeriesForecastOutput {
  const n = series.length;
  if (n < 2) {
    return fitNaiveBaseline(series, horizon);
  }

  // Grid search to optimize alpha and beta based on in-sample SSE
  let bestAlpha = 0.4;
  let bestBeta = 0.2;
  let minSSE = Infinity;

  const alphaGrid = [0.2, 0.35, 0.5, 0.65, 0.8];
  const betaGrid = [0.05, 0.1, 0.2, 0.3];

  for (const a of alphaGrid) {
    for (const b of betaGrid) {
      let l = series[0];
      let t = series[1] - series[0];
      let sse = 0;

      for (let i = 1; i < n; i++) {
        const yPred = l + t;
        sse += Math.pow(series[i] - yPred, 2);
        const lNext = a * series[i] + (1 - a) * (l + t);
        const tNext = b * (lNext - l) + (1 - b) * t;
        l = lNext;
        t = tNext;
      }

      if (sse < minSSE) {
        minSSE = sse;
        bestAlpha = a;
        bestBeta = b;
      }
    }
  }

  // Final fit with optimal parameters
  let level = series[0];
  let trend = series[1] - series[0];
  const residuals: number[] = [];

  for (let i = 1; i < n; i++) {
    const yHat = level + trend;
    residuals.push(series[i] - yHat);
    const nextLevel = bestAlpha * series[i] + (1 - bestAlpha) * (level + trend);
    const nextTrend = bestBeta * (nextLevel - level) + (1 - bestBeta) * trend;
    level = nextLevel;
    trend = nextTrend;
  }

  const resVariance = residuals.length > 0
    ? residuals.reduce((acc, r) => acc + r * r, 0) / residuals.length
    : 1.0;
  const baseSigma = Math.sqrt(resVariance) || 1.0;

  // Damped trend forecast: phi = 0.94
  const dampingFactor = 0.94;
  const pointForecasts: number[] = [];

  for (let h = 1; h <= horizon; h++) {
    const cumulativeTrend = Array.from({ length: h }, (_, k) => Math.pow(dampingFactor, k + 1))
      .reduce((sum, val) => sum + val, 0);
    const projected = Math.max(0, level + trend * cumulativeTrend);
    pointForecasts.push(projected);
  }

  return {
    pointForecasts,
    sigma: baseSigma,
    parameters: {
      alpha: Number(bestAlpha.toFixed(2)),
      beta: Number(bestBeta.toFixed(2)),
      finalLevel: Number(level.toFixed(2)),
      finalTrend: Number(trend.toFixed(2)),
      damping: dampingFactor
    },
    algorithm: "Holt's Linear Exponential Smoothing (Damped Trend)",
    notes: 'Estimates local level and slope while applying slight multi-year damping to avoid unconstrained over-extrapolation.'
  };
}

// -------------------------------------------------------------
// 4. DEMOGRAPHIC RATIO MODEL
// Projects admissions = Population * ParticipationRate
// -------------------------------------------------------------
export function fitDemographicRatio(
  admissions: AdmissionRecord[],
  population: PopulationRecord[],
  horizon: number
): {
  headcountOutput: SingleSeriesForecastOutput;
  details: DemographicRatioDetails;
} {
  const sortedAdm = [...admissions].sort((a, b) => a.startYear - b.startYear);
  const sortedPop = [...population].sort((a, b) => a.year - b.year);
  const n = sortedAdm.length;

  // Find latest recorded population
  const latestPopRecord = sortedPop[sortedPop.length - 1];
  const latestPop = latestPopRecord ? latestPopRecord.totalPopulation : 515200;
  const popGrowthRate = latestPopRecord?.annualGrowthRate ? latestPopRecord.annualGrowthRate / 100 : 0.0175;

  // Compute historical participation rates: Admitted / Population
  const participationRates: number[] = sortedAdm.map(adm => {
    const popMatch = sortedPop.find(p => p.year === adm.startYear) || latestPopRecord;
    const pop = popMatch ? popMatch.totalPopulation : 500000;
    return (adm.totalAdmitted / pop);
  });

  const latestAdm = sortedAdm[n - 1];
  const latestParticipation = participationRates[n - 1] || 0.0055;

  // Trend the participation rate slightly using linear regression
  const x = participationRates.map((_, i) => i);
  const rateOls = linearRegression(x, participationRates);

  const pointForecasts: number[] = [];
  const residuals: number[] = [];

  for (let i = 0; i < n; i++) {
    const fittedPop = sortedPop.find(p => p.year === sortedAdm[i].startYear)?.totalPopulation || latestPop;
    const fittedRate = rateOls.predict(i);
    const fittedAdmitted = fittedPop * fittedRate;
    residuals.push(sortedAdm[i].totalAdmitted - fittedAdmitted);
  }

  const sigma = Math.sqrt(residuals.reduce((s, r) => s + r * r, 0) / Math.max(1, n)) || 50.0;

  let futurePop = latestPop;
  let finalProjectedRate = latestParticipation;
  for (let h = 1; h <= horizon; h++) {
    futurePop = futurePop * (1 + popGrowthRate);
    const projectedRate = Math.max(0.001, rateOls.predict(n - 1 + h));
    finalProjectedRate = projectedRate;
    const projectedAdmissions = Math.round(futurePop * projectedRate);
    pointForecasts.push(projectedAdmissions);
  }

  const details: DemographicRatioDetails = {
    populationUsed: latestPop,
    historicalEnrollment: latestAdm ? latestAdm.totalAdmitted : 2820,
    historicalParticipationRatePct: Number((latestParticipation * 100).toFixed(4)),
    projectedAnnualPopGrowthRatePct: Number((popGrowthRate * 100).toFixed(2)),
    projectedParticipationRatePct: Number((finalProjectedRate * 100).toFixed(4)),
    projectedFuturePopulation: Math.round(futurePop),
    resultingEnrollment: pointForecasts[pointForecasts.length - 1],
    proxyDisclaimer: 'Total population is used as a demographic proxy because age-specific (18–24 cohort) population data is unavailable in public census reports.'
  };

  return {
    headcountOutput: {
      pointForecasts,
      sigma,
      parameters: {
        basePopulation: latestPop,
        popGrowthRatePct: Number((popGrowthRate * 100).toFixed(2)),
        participationRatePct: Number((latestParticipation * 100).toFixed(4)),
        method: 'Population × Participation Rate Trajectory'
      },
      algorithm: 'Demographic Ratio Model (Population Signal Proxy)',
      notes: 'Couples verified PBS census population growth trajectory with local university participation rate.'
    },
    details
  };
}

// -------------------------------------------------------------
// 5. POLYNOMIAL MODEL (Degree 2 Quadratic Trend)
// Guarded against small datasets
// -------------------------------------------------------------
export function fitPolynomial(
  series: number[],
  horizon: number
): SingleSeriesForecastOutput {
  const n = series.length;
  // If fewer than 4 observations, fall back gracefully to linear regression to prevent overfitting
  if (n < 4) {
    const fallback = fitOLSLinear(series, horizon);
    return {
      ...fallback,
      algorithm: 'Polynomial (Degree 2 - Linear Fallback)',
      notes: 'Insufficient historical observations for reliable quadratic fitting; fell back gracefully to linear regression to avoid overfitting.'
    };
  }

  const x = series.map((_, i) => i);
  const poly = polynomialRegression2(x, series);

  const residuals: number[] = [];
  for (let i = 0; i < n; i++) {
    residuals.push(series[i] - poly.predict(i));
  }
  const variance = residuals.reduce((sum, r) => sum + r * r, 0) / Math.max(1, n - 3);
  const sigma = Math.sqrt(variance) || 1.0;

  const pointForecasts: number[] = [];
  // Ensure the quadratic curve does not explode unnaturally (damp acceleration beyond 3 years)
  for (let h = 1; h <= horizon; h++) {
    const rawVal = poly.predict(n - 1 + h);
    // Prevent negative and damp extreme quadratic curvature
    const clamped = Math.max(series[n - 1] * 0.5, Math.min(series[n - 1] * 2.5, rawVal));
    pointForecasts.push(clamped);
  }

  return {
    pointForecasts,
    sigma,
    parameters: {
      c: Number(poly.coefficients[0].toFixed(2)),
      b: Number(poly.coefficients[1].toFixed(2)),
      a: Number(poly.coefficients[2].toFixed(4))
    },
    algorithm: 'Polynomial Regression (Degree 2 Quadratic)',
    notes: 'Models curvilinear acceleration or deceleration in enrollment with boundary damping to avoid unconstrained polynomial explosion.'
  };
}

// -------------------------------------------------------------
// 6. MOVING AVERAGE (3-Year Rolling)
// -------------------------------------------------------------
export function fitMovingAverage(
  series: number[],
  horizon: number
): SingleSeriesForecastOutput {
  const n = series.length;
  const window = Math.min(3, n);
  const recentSlice = series.slice(Math.max(0, n - window));
  const maVal = mean(recentSlice);

  const residuals: number[] = [];
  for (let i = window; i < n; i++) {
    const localSlice = series.slice(i - window, i);
    residuals.push(series[i] - mean(localSlice));
  }
  const variance = residuals.length > 0
    ? residuals.reduce((s, r) => s + r * r, 0) / residuals.length
    : 10.0;
  const sigma = Math.sqrt(variance) || 1.0;

  return {
    pointForecasts: Array.from({ length: horizon }, () => maVal),
    sigma,
    parameters: {
      windowSize: window,
      recentAverage: Number(maVal.toFixed(2))
    },
    algorithm: `Moving Average (${window}-Cycle Rolling Average)`,
    notes: `Calculates the mean of the most recent ${window} historical cycles and holds it as an unweighted steady-state projection.`
  };
}

// -------------------------------------------------------------
// 7. LOGIT-LINKED ASYMPTOTIC TREND (Bounded Ratios 0-100%)
// -------------------------------------------------------------
export function fitLogitTrend(
  ratioSeries: number[],
  horizon: number
): SingleSeriesForecastOutput {
  const n = ratioSeries.length;
  const zVals = ratioSeries.map(r => logit(r / 100));

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  for (let t = 0; t < n; t++) {
    sumX += t;
    sumY += zVals[t];
    sumXY += t * zVals[t];
    sumXX += t * t;
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX || 1);
  const intercept = (sumY - slope * sumX) / n;

  const residuals: number[] = [];
  for (let t = 0; t < n; t++) {
    const fittedZ = intercept + slope * t;
    const fittedPct = invLogit(fittedZ) * 100;
    residuals.push(ratioSeries[t] - fittedPct);
  }

  const baseSigma = Math.sqrt(
    residuals.reduce((acc, r) => acc + r * r, 0) / Math.max(1, residuals.length)
  ) || 1.0;

  const pointForecasts: number[] = [];
  for (let h = 1; h <= horizon; h++) {
    const targetT = (n - 1) + h;
    const futureZ = intercept + slope * targetT;
    const futurePct = invLogit(futureZ) * 100;
    pointForecasts.push(clamp(futurePct, 5, 95));
  }

  return {
    pointForecasts,
    sigma: baseSigma,
    parameters: {
      logitSlope: Number(slope.toFixed(4)),
      logitIntercept: Number(intercept.toFixed(4)),
      baseResidualSigma: Number(baseSigma.toFixed(2))
    },
    algorithm: 'Logit-Linked Asymptotic Trend Model',
    notes: 'Transforms ratios via logit link, guaranteeing estimates remain mathematically bounded within (0%, 100%) with realistic sigmoid saturation.'
  };
}

// -------------------------------------------------------------
// 8. ARIMA(1, 1, 0) DIFFERENCED MODEL
// -------------------------------------------------------------
export function fitArimaBaseline(
  series: number[],
  horizon: number
): SingleSeriesForecastOutput {
  const n = series.length;
  if (n < 4) {
    return fitHoltLinear(series, horizon);
  }

  const diffs: number[] = [];
  for (let i = 1; i < n; i++) {
    diffs.push(series[i] - series[i - 1]);
  }

  const meanDiff = mean(diffs);
  let numerator = 0;
  let denominator = 0;
  for (let i = 1; i < diffs.length; i++) {
    numerator += (diffs[i] - meanDiff) * (diffs[i - 1] - meanDiff);
  }
  for (let i = 0; i < diffs.length; i++) {
    denominator += Math.pow(diffs[i] - meanDiff, 2);
  }
  const phi = clamp(denominator !== 0 ? numerator / denominator : 0.2, -0.85, 0.85);

  let currentVal = series[n - 1];
  let lastDiff = diffs[diffs.length - 1];
  const baseSigma = Math.sqrt(
    diffs.reduce((acc, d) => acc + Math.pow(d - meanDiff, 2), 0) / diffs.length
  ) || 1.0;

  const pointForecasts: number[] = [];
  for (let h = 1; h <= horizon; h++) {
    const expectedDiff = meanDiff + phi * (lastDiff - meanDiff);
    currentVal = Math.max(0, currentVal + expectedDiff);
    lastDiff = expectedDiff;
    pointForecasts.push(currentVal);
  }

  return {
    pointForecasts,
    sigma: baseSigma,
    parameters: {
      arPhi: Number(phi.toFixed(3)),
      driftDiff: Number(meanDiff.toFixed(2)),
      differencingOrder: 1
    },
    algorithm: 'ARIMA(1, 1, 0) Differenced Model',
    notes: 'Models stochastic year-over-year increment changes with auto-regressive persistence.'
  };
}

function fitCandidateModel(
  series: number[],
  modelId: ForecastModelId,
  horizon: number
): SingleSeriesForecastOutput {
  switch (modelId) {
    case 'NAIVE':
      return fitNaiveBaseline(series, horizon);
    case 'OLS':
      return fitOLSLinear(series, horizon);
    case 'HOLT':
      return fitHoltLinear(series, horizon);
    case 'MOVING_AVG':
      return fitMovingAverage(series, horizon);
    case 'POLYNOMIAL':
      return fitPolynomial(series, horizon);
    case 'LOGIT':
      return fitLogitTrend(series, horizon);
    case 'ARIMA':
      return fitArimaBaseline(series, horizon);
    case 'DEMOGRAPHIC':
    case 'AUTO':
    default:
      return fitOLSLinear(series, horizon);
  }
}

// -------------------------------------------------------------
// WALK-FORWARD TIME-SERIES VALIDATION (BACKTESTING)
// Sequential Leave-Next-Out Evaluation
// -------------------------------------------------------------
export function backtestSeries(
  series: number[],
  modelId: ForecastModelId
): { mae: number; rmse: number; mape: number; isEligible: boolean; notes: string } {
  const n = series.length;
  // Require at least 4 observations for walk-forward validation
  if (n < 4) {
    return {
      mae: 0,
      rmse: 0,
      mape: 0,
      isEligible: false,
      notes: 'Insufficient historical observations for walk-forward backtesting (minimum 4 cycles required).'
    };
  }

  const errors: number[] = [];
  const minTrain = Math.max(3, Math.floor(n * 0.45));

  for (let t = minTrain; t < n; t++) {
    const trainSlice = series.slice(0, t);
    const actual = series[t];
    const pred = fitCandidateModel(trainSlice, modelId, 1).pointForecasts[0];
    errors.push(actual - pred);
  }

  const absErrors = errors.map(e => Math.abs(e));
  const mae = Number(mean(absErrors).toFixed(2));
  const rmse = Number(Math.sqrt(errors.reduce((s, e) => s + e * e, 0) / errors.length).toFixed(2));

  // Actual values for MAPE
  const actuals = series.slice(minTrain);
  const preds = actuals.map((act, i) => act - errors[i]);
  const mape = Number(safeMAPE(actuals, preds).toFixed(2));

  return {
    mae,
    rmse,
    mape,
    isEligible: true,
    notes: 'Evaluated using walk-forward chronological expanding windows without data leakage.'
  };
}

function backtestAdmissionComponents(
  maleSeries: number[],
  femaleSeries: number[],
  modelId: ForecastModelId
): { mae: number; rmse: number; mape: number; isEligible: boolean; notes: string } {
  const n = Math.min(maleSeries.length, femaleSeries.length);
  if (n < 4) {
    return {
      mae: 0,
      rmse: 0,
      mape: 0,
      isEligible: false,
      notes: 'Insufficient historical observations for walk-forward backtesting (minimum 4 cycles required).'
    };
  }

  const errors: number[] = [];
  const actuals: number[] = [];
  const minTrain = Math.max(3, Math.floor(n * 0.45));

  for (let t = minTrain; t < n; t++) {
    const malePrediction = fitCandidateModel(maleSeries.slice(0, t), modelId, 1).pointForecasts[0];
    const femalePrediction = fitCandidateModel(femaleSeries.slice(0, t), modelId, 1).pointForecasts[0];
    const actualTotal = maleSeries[t] + femaleSeries[t];
    errors.push(actualTotal - malePrediction - femalePrediction);
    actuals.push(actualTotal);
  }

  const mae = Number(mean(errors.map(error => Math.abs(error))).toFixed(2));
  const rmse = Number(
    Math.sqrt(errors.reduce((sum, error) => sum + error * error, 0) / errors.length).toFixed(2)
  );
  const predictions = actuals.map((actual, index) => actual - errors[index]);

  return {
    mae,
    rmse,
    mape: Number(safeMAPE(actuals, predictions).toFixed(2)),
    isEligible: true,
    notes: 'Evaluated the summed male/female forecast using walk-forward chronological expanding windows without data leakage.'
  };
}

// -------------------------------------------------------------
// DATA QUALITY & ANOMALY PRE-FLIGHT DETECTOR
// -------------------------------------------------------------
export function detectDataQualityAnomalies(admissions: AdmissionRecord[]): string[] {
  const warnings: string[] = [];
  const sorted = [...admissions].sort((a, b) => a.startYear - b.startYear);

  if (sorted.length === 0) {
    warnings.push('Empty dataset: No historical admission records present.');
    return warnings;
  }

  if (sorted.length === 1) {
    warnings.push(
      'Only one historical admission cycle is available. A trend cannot be estimated, so trend models fall back to the latest observed value; add more historical cycles for a changing forecast.'
    );
  } else if (sorted.length < 4) {
    warnings.push(
      `Only ${sorted.length} historical admission cycles are available. The forecast can estimate a trend, but there is not enough history for reliable walk-forward model selection.`
    );
  }

  const seenYears = new Set<string>();
  for (let i = 0; i < sorted.length; i++) {
    const rec = sorted[i];

    // Duplicate check
    if (seenYears.has(rec.academicYear)) {
      warnings.push(`Duplicate academic year record detected for ${rec.academicYear}.`);
    }
    seenYears.add(rec.academicYear);

    // Negative values
    if (rec.totalAdmitted < 0 || rec.maleAdmitted < 0 || rec.femaleAdmitted < 0) {
      warnings.push(`Negative admission headcount detected in ${rec.academicYear}.`);
    }

    // Mathematical sum mismatch
    if (rec.maleAdmitted + rec.femaleAdmitted !== rec.totalAdmitted) {
      warnings.push(
        `Headcount sum mismatch in ${rec.academicYear}: Male (${rec.maleAdmitted}) + Female (${rec.femaleAdmitted}) != Total (${rec.totalAdmitted}).`
      );
    }

    // Sudden YoY shift (>45% change)
    if (i > 0) {
      const prev = sorted[i - 1];
      const deltaTotal = Math.abs(rec.totalAdmitted - prev.totalAdmitted);
      const pctChange = (deltaTotal / Math.max(1, prev.totalAdmitted)) * 100;
      if (pctChange > 45) {
        warnings.push(
          `Potential anomaly: High single-cycle shift of ${pctChange.toFixed(1)}% between ${prev.academicYear} and ${rec.academicYear}.`
        );
      }
    }
  }

  // Missing year gaps
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].startYear !== sorted[i - 1].startYear + 1) {
      warnings.push(`Discontinuous timeline: Missing academic year between ${sorted[i - 1].academicYear} and ${sorted[i].academicYear}.`);
    }
  }

  return warnings;
}

// -------------------------------------------------------------
// COMPREHENSIVE MULTI-MODEL BACKTEST SCORECARD & AUTO-SELECTOR
// -------------------------------------------------------------
export function compareModelsScorecard(
  totalSeries: number[],
  ratioSeries: number[],
  isRatioMode: boolean = false,
  admissionComponents?: { maleSeries: number[]; femaleSeries: number[] }
): {
  scores: ModelComparisonItem[];
  bestModelId: ForecastModelId;
  selectionRationale: string;
} {
  const seriesToTest = isRatioMode ? ratioSeries : totalSeries;

  const candidateModels: { id: ForecastModelId; name: string; algorithm: string; complexity: number }[] = [
    { id: 'NAIVE', name: 'Naive Persistence Baseline', algorithm: 'Last-Observed Constant (Benchmark)', complexity: 1 },
    { id: 'OLS', name: 'OLS Linear Regression', algorithm: 'Ordinary Least Squares Line of Best Fit', complexity: 2 },
    { id: 'HOLT', name: "Holt's Linear Exponential Smoothing", algorithm: 'Level + Damped Slope Exponential Smoothing', complexity: 3 },
    { id: 'MOVING_AVG', name: '3-Cycle Moving Average', algorithm: 'Rolling Window Arithmetic Mean', complexity: 2 },
    { id: 'POLYNOMIAL', name: 'Polynomial Degree 2 Curve', algorithm: 'Quadratic Least Squares with Damping', complexity: 4 },
    { id: 'ARIMA', name: 'ARIMA(1, 1, 0)', algorithm: 'Autoregressive Differenced Time Series', complexity: 4 }
  ];

  if (isRatioMode) {
    candidateModels.unshift({
      id: 'LOGIT',
      name: 'Logit-Linked Asymptotic Trend',
      algorithm: 'Sigmoid-Bounded Logistic Drift',
      complexity: 3
    });
  }

  const scores: ModelComparisonItem[] = [];

  for (const cand of candidateModels) {
    const bt =
      !isRatioMode && admissionComponents
        ? backtestAdmissionComponents(
            admissionComponents.maleSeries,
            admissionComponents.femaleSeries,
            cand.id
          )
        : backtestSeries(seriesToTest, cand.id);
    scores.push({
      modelId: cand.id,
      modelName: cand.name,
      algorithm: cand.algorithm,
      mae: bt.mae,
      rmse: bt.rmse,
      mape: bt.mape,
      isEligible: bt.isEligible,
      notes: bt.notes
    });
  }

  // Filter eligible models and sort by lowest RMSE then lowest MAE
  const eligible = scores.filter(s => s.isEligible && s.rmse > 0);
  eligible.sort((a, b) => {
    if (Math.abs(a.rmse - b.rmse) > 0.05) {
      return a.rmse - b.rmse;
    }
    return a.mae - b.mae;
  });

  // Assign ranks
  scores.forEach(s => {
    const rankIdx = eligible.findIndex(e => e.modelId === s.modelId);
    s.rank = rankIdx >= 0 ? rankIdx + 1 : undefined;
  });

  // Persistence and moving-average models intentionally return a constant
  // multi-year forecast. Keep them in the scorecard as useful benchmarks, but
  // do not let one-step backtests select them for AUTO multi-year projections.
  const autoEligible = eligible.filter(
    s => s.modelId !== 'NAIVE' && s.modelId !== 'MOVING_AVG'
  );

  let bestModelId: ForecastModelId = 'HOLT';
  let selectionRationale = 'Selected based on lowest historical backtesting RMSE.';

  if (autoEligible.length > 0) {
    const top = autoEligible[0];
    const second = autoEligible[1];

    // If second model is simpler and within 5% error of the top model, prefer simpler model (Occam's razor)
    if (second && second.rmse <= top.rmse * 1.05) {
      const topCand = candidateModels.find(c => c.id === top.modelId);
      const secondCand = candidateModels.find(c => c.id === second.modelId);
      if (secondCand && topCand && secondCand.complexity < topCand.complexity) {
        bestModelId = second.modelId;
        selectionRationale = `Auto selected ${second.modelName} (RMSE: ${second.rmse}) over ${top.modelName} (RMSE: ${top.rmse}) because its performance is within 5% while having lower algorithmic complexity (Occam's razor principle).`;
      } else {
        bestModelId = top.modelId;
        selectionRationale = `Auto selected ${top.modelName} with lowest historical walk-forward RMSE of ${top.rmse} and MAE of ${top.mae}.`;
      }
    } else {
      bestModelId = top.modelId;
      selectionRationale = `Auto selected ${top.modelName} with lowest historical walk-forward RMSE of ${top.rmse} and MAE of ${top.mae}.`;
    }
  }

  return { scores, bestModelId, selectionRationale };
}

// -------------------------------------------------------------
// MAIN FORECAST ORCHESTRATOR
// Dynamic Horizons (5, 6, 7 Years), Independent Male/Female Headcounts,
// Scenario Multipliers, Capacity Planning, Transparent Confidence Bounds
// -------------------------------------------------------------
export function generateForecast(
  historicalData: AdmissionRecord[],
  horizonYears: 5 | 6 | 7 = 5,
  modelId: ForecastModelId = 'AUTO',
  scenario: ForecastScenario = 'BASELINE',
  planningCapacity: number = 3000,
  populationData?: PopulationRecord[]
): ForecastResult {
  if (historicalData.length === 0) {
    throw new Error('Cannot generate forecast with empty historical admission records.');
  }
  if (modelId === 'NAIVE' || modelId === 'MOVING_AVG') {
    throw new Error(
      `${modelId} is a stationary benchmark that repeats a constant value. Select AUTO or a trend model for a multi-year forecast.`
    );
  }

  // 1. Sort chronologically
  const sorted = [...historicalData].sort((a, b) => a.startYear - b.startYear);
  const n = sorted.length;
  const latestRecord = sorted[n - 1];

  // 2. Data Quality Anomaly Check
  const dataQualityWarnings = detectDataQualityAnomalies(sorted);

  // 3. Extract Historical Series
  const maleSeries = sorted.map(r => r.maleAdmitted);
  const femaleSeries = sorted.map(r => r.femaleAdmitted);
  const totalSeries = sorted.map(r => r.totalAdmitted);
  const femaleRatioSeries = sorted.map(r => r.femaleAdmissionRatio);

  // 4. Model Comparison Scorecard & Auto Selection
  const scorecard = compareModelsScorecard(totalSeries, femaleRatioSeries, false, {
    maleSeries,
    femaleSeries
  });

  const effectiveModelId: ForecastModelId =
    modelId === 'AUTO' ? scorecard.bestModelId : modelId;

  // 5. Compute Forecasts for Male, Female, and Total
  // We forecast Male and Female headcounts independently
  let maleOutput: SingleSeriesForecastOutput;
  let femaleOutput: SingleSeriesForecastOutput;
  let demographicDetails: DemographicRatioDetails | undefined;

  switch (effectiveModelId) {
    case 'NAIVE':
      maleOutput = fitNaiveBaseline(maleSeries, horizonYears);
      femaleOutput = fitNaiveBaseline(femaleSeries, horizonYears);
      break;
    case 'OLS':
      maleOutput = fitOLSLinear(maleSeries, horizonYears);
      femaleOutput = fitOLSLinear(femaleSeries, horizonYears);
      break;
    case 'HOLT':
      maleOutput = fitHoltLinear(maleSeries, horizonYears);
      femaleOutput = fitHoltLinear(femaleSeries, horizonYears);
      break;
    case 'MOVING_AVG':
      maleOutput = fitMovingAverage(maleSeries, horizonYears);
      femaleOutput = fitMovingAverage(femaleSeries, horizonYears);
      break;
    case 'POLYNOMIAL':
      maleOutput = fitPolynomial(maleSeries, horizonYears);
      femaleOutput = fitPolynomial(femaleSeries, horizonYears);
      break;
    case 'ARIMA':
      maleOutput = fitArimaBaseline(maleSeries, horizonYears);
      femaleOutput = fitArimaBaseline(femaleSeries, horizonYears);
      break;
    case 'DEMOGRAPHIC': {
      const popRecords = populationData || [];
      const demoRes = fitDemographicRatio(sorted, popRecords, horizonYears);
      demographicDetails = demoRes.details;
      // Distribute demographic projected total using latest/trended gender proportions
      const latestFemaleShare = latestRecord.femaleAdmissionRatio / 100;
      const latestMaleShare = 1 - latestFemaleShare;
      maleOutput = {
        pointForecasts: demoRes.headcountOutput.pointForecasts.map(tot => Math.round(tot * latestMaleShare)),
        sigma: demoRes.headcountOutput.sigma * latestMaleShare,
        parameters: demoRes.headcountOutput.parameters,
        algorithm: demoRes.headcountOutput.algorithm,
        notes: demoRes.headcountOutput.notes
      };
      femaleOutput = {
        pointForecasts: demoRes.headcountOutput.pointForecasts.map(tot => Math.round(tot * latestFemaleShare)),
        sigma: demoRes.headcountOutput.sigma * latestFemaleShare,
        parameters: demoRes.headcountOutput.parameters,
        algorithm: demoRes.headcountOutput.algorithm,
        notes: demoRes.headcountOutput.notes
      };
      break;
    }
    case 'LOGIT':
    default: {
      // Fit total with Holt, fit female ratio with Logit, then split
      const totalFit = fitHoltLinear(totalSeries, horizonYears);
      const ratioFit = fitLogitTrend(femaleRatioSeries, horizonYears);
      femaleOutput = {
        pointForecasts: totalFit.pointForecasts.map((tot, idx) => Math.round(tot * (ratioFit.pointForecasts[idx] / 100))),
        sigma: totalFit.sigma * 0.5,
        parameters: ratioFit.parameters,
        algorithm: ratioFit.algorithm,
        notes: ratioFit.notes
      };
      maleOutput = {
        pointForecasts: totalFit.pointForecasts.map((tot, idx) => tot - femaleOutput.pointForecasts[idx]),
        sigma: totalFit.sigma * 0.5,
        parameters: ratioFit.parameters,
        algorithm: ratioFit.algorithm,
        notes: ratioFit.notes
      };
      break;
    }
  }

  // 6. Scenario Multiplier:
  // Baseline = 1.0 (0% delta)
  // Optimistic = +4% compounded annually on future steps
  // Pessimistic = -4% compounded annually on future steps
  // IMPORTANT: Historical actuals are NEVER modified!
  let annualScenarioRate = 0;
  if (scenario === 'OPTIMISTIC') annualScenarioRate = 0.04;
  else if (scenario === 'PESSIMISTIC') annualScenarioRate = -0.04;

  // 7. Prediction Points Generation
  const predictions: PredictionPoint[] = [];

  for (let idx = 0; idx < horizonYears; idx++) {
    const step = idx + 1;
    const academicYear = incrementAcademicYear(latestRecord.academicYear, step);

    // Apply scenario adjustment strictly to future steps
    const scenarioMultiplier = Math.pow(1 + annualScenarioRate, step);
    const scenarioAdjustmentPct = Number(((scenarioMultiplier - 1) * 100).toFixed(1));

    const rawMale = Math.round(maleOutput.pointForecasts[idx] * scenarioMultiplier);
    const rawFemale = Math.round(femaleOutput.pointForecasts[idx] * scenarioMultiplier);
    const totalAdmitted = rawMale + rawFemale;

    // Ratios: guaranteed to sum to 100%
    const femaleRatio = totalAdmitted > 0
      ? Number(((rawFemale / totalAdmitted) * 100).toFixed(2))
      : 50.0;
    const maleRatio = Number((100.0 - femaleRatio).toFixed(2));

    // Prediction Interval (widens with sqrt(step))
    const totalSigma = Math.sqrt(maleOutput.sigma * maleOutput.sigma + femaleOutput.sigma * femaleOutput.sigma);
    const stepSigma = totalSigma * Math.sqrt(1 + (step - 1) * 0.25);

    // 80% PI (z = 1.282) and 95% PI (z = 1.960) for Total Headcount
    const totalLower80 = Math.max(0, Math.round(totalAdmitted - 1.282 * stepSigma));
    const totalUpper80 = Math.round(totalAdmitted + 1.282 * stepSigma);
    const totalLower95 = Math.max(0, Math.round(totalAdmitted - 1.960 * stepSigma));
    const totalUpper95 = Math.round(totalAdmitted + 1.960 * stepSigma);

    // Ratio Prediction Intervals (widens with step)
    const ratioSigma = (stepSigma / Math.max(1, totalAdmitted)) * 100;
    const lowerBound80 = Number(clamp(femaleRatio - 1.282 * ratioSigma, 5, 95).toFixed(2));
    const upperBound80 = Number(clamp(femaleRatio + 1.282 * ratioSigma, 5, 95).toFixed(2));
    const lowerBound95 = Number(clamp(femaleRatio - 1.960 * ratioSigma, 5, 95).toFixed(2));
    const upperBound95 = Number(clamp(femaleRatio + 1.960 * ratioSigma, 5, 95).toFixed(2));

    // Check capacity exceedance
    const isCapacityExceeded = totalAdmitted > planningCapacity;

    predictions.push({
      academicYear,
      stepAhead: step,
      totalAdmitted,
      maleAdmitted: rawMale,
      femaleAdmitted: rawFemale,
      femaleRatio,
      maleRatio,
      lowerBound80,
      upperBound80,
      lowerBound95,
      upperBound95,
      totalLower80,
      totalUpper80,
      totalLower95,
      totalUpper95,
      scenarioAdjustmentPct,
      isCapacityExceeded
    });
  }

  // 8. Model Metric Summary from Walk-Forward Backtesting
  const backtest =
    effectiveModelId === 'LOGIT'
      ? backtestSeries(totalSeries, 'HOLT')
      : effectiveModelId === 'DEMOGRAPHIC'
        ? backtestSeries(totalSeries, effectiveModelId)
        : backtestAdmissionComponents(maleSeries, femaleSeries, effectiveModelId);
  const firstYear = predictions[0].academicYear;
  const lastYear = predictions[predictions.length - 1].academicYear;

  const metrics: ModelMetricSummary = {
    modelId: effectiveModelId,
    modelName: maleOutput.algorithm,
    algorithm: maleOutput.algorithm,
    trainingPeriod: `${sorted[0].academicYear} to ${latestRecord.academicYear} (${sorted.length} Historical Cycles)`,
    validationMethod: 'Walk-Forward Chronological Expanding Window Backtesting',
    mae: backtest.mae,
    rmse: backtest.rmse,
    mape: backtest.mape,
    parameters: maleOutput.parameters,
    notes: maleOutput.notes
  };

  return {
    runId: `run-${Date.now()}-${effectiveModelId.toLowerCase()}`,
    modelId,
    modelName:
      modelId === 'AUTO'
        ? `Auto-Selected: ${maleOutput.algorithm}`
        : maleOutput.algorithm,
    selectedModelId: effectiveModelId,
    horizonYears,
    baseAcademicYear: latestRecord.academicYear,
    historicalPeriod: `${sorted[0].academicYear} — ${latestRecord.academicYear} (${sorted.length} Historical Cycles)`,
    forecastPeriod: `${firstYear} — ${lastYear} (${horizonYears} Future Academic Years)`,
    scenario,
    scenarioMultiplierPct: annualScenarioRate * 100,
    planningCapacity,
    metrics,
    predictions,
    modelComparison: scorecard.scores,
    demographicDetails,
    dataQualityWarnings,
    methodology:
      modelId === 'AUTO'
        ? `AUTO mode performed expanding-window chronological backtesting on historical University of Chitral admissions data (${sorted[0].academicYear} to ${latestRecord.academicYear}) and selected ${maleOutput.algorithm}. Persistence and moving-average models remain visible as benchmarks but are excluded from automatic multi-year selection because they repeat a constant value. Male and female headcounts were independently evaluated and combined to form the total demand forecast.`
        : `Forecast generated using ${maleOutput.algorithm}. Male and female student enrollments are modeled independently from historical trends and summed to guarantee mathematical consistency. Prediction intervals widen conditionally with forecast horizon distance.`,
    limitations: [
      'Estimates, Not Promises: These numbers show expected student demand based on past trends—not a fixed guarantee.',
      'Real-World Policy Shifts: Opening new colleges, changing student quotas, or local economic changes can push actual numbers higher or lower.',
      'Population as a Signal: We use overall Chitral population trends because separate census figures for 18–24 year-olds are not published.',
      'Capacity vs. Real Demand: Campus seat limits do not stop students from applying. When demand exceeds seats, the university needs more classrooms and teachers.'
    ],
    generatedAt: new Date().toISOString()
  };
}
