/**
 * Mathematical & Statistical Utilities for Time Series Forecasting
 */

export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export function standardDeviation(values: number[]): number {
  if (values.length < 2) return 0;
  const avg = mean(values);
  const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / (values.length - 1);
  return Math.sqrt(variance);
}

export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

// Logit link transformation: maps (0, 1) -> (-inf, +inf)
export function logit(p: number): number {
  const safeP = clamp(p, 0.001, 0.999);
  return Math.log(safeP / (1 - safeP));
}

// Inverse logit (Sigmoid): maps (-inf, +inf) -> (0, 1)
export function invLogit(z: number): number {
  return 1 / (1 + Math.exp(-z));
}

/**
 * Computes Ordinary Least Squares (OLS) Linear Regression: y = intercept + slope * x
 */
export function linearRegression(x: number[], y: number[]): {
  slope: number;
  intercept: number;
  rSquared: number;
  predict: (xVal: number) => number;
} {
  const n = x.length;
  if (n === 0) {
    return { slope: 0, intercept: 0, rSquared: 0, predict: () => 0 };
  }
  if (n === 1) {
    return { slope: 0, intercept: y[0], rSquared: 1, predict: () => y[0] };
  }

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;
  let sumYY = 0;

  for (let i = 0; i < n; i++) {
    sumX += x[i];
    sumY += y[i];
    sumXY += x[i] * y[i];
    sumXX += x[i] * x[i];
    sumYY += y[i] * y[i];
  }

  const denomX = n * sumXX - sumX * sumX;
  const slope = denomX !== 0 ? (n * sumXY - sumX * sumY) / denomX : 0;
  const intercept = (sumY - slope * sumX) / n;

  // Calculate R-squared
  const meanY = sumY / n;
  let ssTot = 0;
  let ssRes = 0;
  for (let i = 0; i < n; i++) {
    const pred = intercept + slope * x[i];
    ssRes += Math.pow(y[i] - pred, 2);
    ssTot += Math.pow(y[i] - meanY, 2);
  }
  const rSquared = ssTot > 0 ? clamp(1 - ssRes / ssTot, 0, 1) : 1;

  return {
    slope,
    intercept,
    rSquared,
    predict: (xVal: number) => intercept + slope * xVal
  };
}

/**
 * Polynomial Regression (Degree 2 quadratic: y = a*x^2 + b*x + c)
 * Solves system of 3 linear equations via Cramer's rule / matrix inversion
 */
export function polynomialRegression2(x: number[], y: number[]): {
  coefficients: [number, number, number]; // [c, b, a] for c + b*x + a*x^2
  predict: (xVal: number) => number;
} {
  const n = x.length;
  if (n < 3) {
    const ols = linearRegression(x, y);
    return {
      coefficients: [ols.intercept, ols.slope, 0],
      predict: (xVal: number) => ols.predict(xVal)
    };
  }

  let s0 = n;
  let s1 = 0;
  let s2 = 0;
  let s3 = 0;
  let s4 = 0;
  let sy0 = 0;
  let sy1 = 0;
  let sy2 = 0;

  for (let i = 0; i < n; i++) {
    const xi = x[i];
    const yi = y[i];
    const x2 = xi * xi;
    s1 += xi;
    s2 += x2;
    s3 += x2 * xi;
    s4 += x2 * x2;
    sy0 += yi;
    sy1 += yi * xi;
    sy2 += yi * x2;
  }

  // 3x3 system:
  // [s0  s1  s2] [c] = [sy0]
  // [s1  s2  s3] [b] = [sy1]
  // [s2  s3  s4] [a] = [sy2]
  const det =
    s0 * (s2 * s4 - s3 * s3) -
    s1 * (s1 * s4 - s3 * s2) +
    s2 * (s1 * s3 - s2 * s2);

  if (Math.abs(det) < 1e-12) {
    const ols = linearRegression(x, y);
    return {
      coefficients: [ols.intercept, ols.slope, 0],
      predict: (xVal: number) => ols.predict(xVal)
    };
  }

  const detC =
    sy0 * (s2 * s4 - s3 * s3) -
    s1 * (sy1 * s4 - s3 * sy2) +
    s2 * (sy1 * s3 - s2 * sy2);

  const detB =
    s0 * (sy1 * s4 - s3 * sy2) -
    sy0 * (s1 * s4 - s3 * s2) +
    s2 * (s1 * sy2 - sy1 * s2);

  const detA =
    s0 * (s2 * sy2 - sy1 * s3) -
    s1 * (s1 * sy2 - sy1 * s2) +
    sy0 * (s1 * s3 - s2 * s2);

  const c = detC / det;
  const b = detB / det;
  const a = detA / det;

  return {
    coefficients: [c, b, a],
    predict: (xVal: number) => c + b * xVal + a * xVal * xVal
  };
}

/**
 * Computes Moving Average for series
 */
export function movingAverage(series: number[], window: number = 3): number[] {
  const result: number[] = [];
  for (let i = 0; i < series.length; i++) {
    const start = Math.max(0, i - window + 1);
    const subset = series.slice(start, i + 1);
    result.push(mean(subset));
  }
  return result;
}

/**
 * Computes Safe MAPE (Mean Absolute Percentage Error) avoiding division by zero
 */
export function safeMAPE(actuals: number[], predicted: number[]): number {
  if (actuals.length === 0) return 0;
  const pcts: number[] = [];
  for (let i = 0; i < actuals.length; i++) {
    const act = actuals[i];
    const pred = predicted[i];
    if (Math.abs(act) > 0.001) {
      pcts.push((Math.abs(act - pred) / Math.abs(act)) * 100);
    }
  }
  return pcts.length > 0 ? mean(pcts) : 0;
}

/**
 * Parses academic year "2024-2025" and generates next year string "2025-2026"
 */
export function incrementAcademicYear(yearStr: string, steps: number = 1): string {
  const parts = yearStr.split('-');
  if (parts.length === 2) {
    const start = parseInt(parts[0], 10);
    const end = parseInt(parts[1], 10);
    if (!isNaN(start) && !isNaN(end)) {
      return `${start + steps}-${end + steps}`;
    }
  }
  // Fallback if integer year
  const num = parseInt(yearStr, 10);
  if (!isNaN(num)) {
    return `${num + steps}-${num + steps + 1}`;
  }
  return `${yearStr}+${steps}`;
}

export interface HistoricalSeriesPoint {
  index: number;
  yearCode: string;
  femaleRatio: number;
  maleRatio: number;
  totalAdmitted: number;
}
