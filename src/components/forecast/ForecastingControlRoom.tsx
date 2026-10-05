import React, { useState, useMemo } from 'react';
import {
  Brain,
  Calendar,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  TrendingUp,
  Download,
  ShieldAlert,
  Percent,
  Users,
  GraduationCap,
  Sparkles,
  Sliders,
  Scale,
  Activity,
  Layers,
  Info,
  ChevronDown,
  ChevronUp,
  Languages,
  RefreshCw,
  Key
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine
} from 'recharts';
import {
  AdmissionRecord,
  PopulationRecord,
  ForecastResult,
  ForecastModelId,
  ForecastScenario
} from '../../types';
import { generateForecast } from '../../lib/ml/forecastingEngine';
import { queryGroqInstitutionalAI, getActiveGroqApiKey, StructuredAiResponse } from '../../lib/ai/groqService';
import { ApiKeyModal } from '../ai/ApiKeyModal';
import { AiBriefingSkeleton } from '../common/SkeletonLoader';

interface ForecastingControlRoomProps {
  admissionsData: AdmissionRecord[];
  populationData?: PopulationRecord[];
}

type ViewMode = 'HEADCOUNT' | 'RATIO';

interface ChartSeriesItem {
  academicYear: string;
  isHistorical: boolean;
  // Headcounts
  totalHistorical?: number;
  maleHistorical?: number;
  femaleHistorical?: number;
  totalForecast?: number;
  maleForecast?: number;
  femaleForecast?: number;
  totalLower95?: number;
  totalUpper95?: number;
  femaleUpper95?: number;
  femaleLower95?: number;
  maleUpper95?: number;
  maleLower95?: number;
  optimisticForecast?: number;
  pessimisticForecast?: number;
  // Ratios
  femaleRatioHistorical?: number;
  maleRatioHistorical?: number;
  femaleRatioForecast?: number;
  maleRatioForecast?: number;
  lowerBound95?: number;
  upperBound95?: number;
  // Metadata
  isCapacityExceeded?: boolean;
}

export const ForecastingControlRoom: React.FC<ForecastingControlRoomProps> = ({
  admissionsData,
  populationData = []
}) => {
  // Forecasting State
  const [horizonYears, setHorizonYears] = useState<5 | 6 | 7>(5);
  const [selectedModel, setSelectedModel] = useState<ForecastModelId>('AUTO');
  const [scenario, setScenario] = useState<ForecastScenario>('BASELINE');
  const [planningCapacity, setPlanningCapacity] = useState<number>(600);
  const [viewMode, setViewMode] = useState<ViewMode>('HEADCOUNT');
  const [cohortProjectionView, setCohortProjectionView] = useState<'FEMALE' | 'MALE' | 'TOTAL' | 'ALL'>('ALL');
  const [showPredictionBands, setShowPredictionBands] = useState<boolean>(true);
  const [isScorecardExpanded, setIsScorecardExpanded] = useState<boolean>(false);

  // Live Gemini AI Briefing State
  const [isAiGenerating, setIsAiGenerating] = useState<boolean>(false);
  const [liveAiBriefing, setLiveAiBriefing] = useState<StructuredAiResponse | null>(null);
  const [aiBriefingError, setAiBriefingError] = useState<string | null>(null);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState<boolean>(false);

  // Compute forecast dynamically with memoization
  const forecastResult: ForecastResult = useMemo(() => {
    return generateForecast(
      admissionsData,
      horizonYears,
      selectedModel,
      scenario,
      planningCapacity,
      populationData
    );
  }, [admissionsData, horizonYears, selectedModel, scenario, planningCapacity, populationData]);

  const handleGenerateLiveAiBriefing = async () => {
    const key = getActiveGroqApiKey();
    if (!key) {
      setIsKeyModalOpen(true);
      return;
    }

    setIsAiGenerating(true);
    setAiBriefingError(null);

    const prompt = `Provide an executive institutional planning briefing for the University of Chitral administration based on the currently selected ${forecastResult.modelName} forecast over ${forecastResult.horizonYears} years under the ${scenario} scenario. Specifically address whether projected demand exceeds the planning capacity of ${planningCapacity} seats, the gender parity trajectory, and key operational recommendations for the Vice Chancellor and Registrar.`;

    try {
      const result = await queryGroqInstitutionalAI(
        prompt,
        admissionsData,
        populationData,
        forecastResult,
        { model: 'llama-3.3-70b-versatile' }
      );
      setLiveAiBriefing(result);
    } catch (err: any) {
      if (err?.message?.includes('MISSING_GROQ_KEY')) {
        setIsKeyModalOpen(true);
      } else {
        setAiBriefingError(err?.message || 'Error generating live Groq AI briefing.');
      }
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Chronologically sorted historical data
  const sortedHistorical = useMemo(() => {
    return [...admissionsData].sort((a, b) => a.startYear - b.startYear);
  }, [admissionsData]);

  // First capacity breach point if any
  const firstCapacityBreach = useMemo(() => {
    return forecastResult.predictions.find(p => p.isCapacityExceeded);
  }, [forecastResult]);

  // Combined chart series with smooth bridge from last historical cycle
  const chartSeries = useMemo(() => {
    const historicalPoints: ChartSeriesItem[] = sortedHistorical.map(r => ({
      academicYear: r.academicYear,
      isHistorical: true,
      totalHistorical: r.totalAdmitted,
      maleHistorical: r.maleAdmitted,
      femaleHistorical: r.femaleAdmitted,
      totalForecast: undefined,
      maleForecast: undefined,
      femaleForecast: undefined,
      totalLower95: undefined,
      totalUpper95: undefined,
      femaleUpper95: r.femaleAdmitted,
      femaleLower95: r.femaleAdmitted,
      maleUpper95: r.maleAdmitted,
      maleLower95: r.maleAdmitted,
      femaleRatioHistorical: r.femaleAdmissionRatio,
      maleRatioHistorical: r.maleAdmissionRatio,
      femaleRatioForecast: undefined,
      maleRatioForecast: undefined,
      lowerBound95: undefined,
      upperBound95: undefined,
      isCapacityExceeded: r.totalAdmitted > planningCapacity
    }));

    const lastHistorical = sortedHistorical[sortedHistorical.length - 1];

    const forecastPoints: ChartSeriesItem[] = forecastResult.predictions.map((p, idx) => ({
      academicYear: p.academicYear,
      isHistorical: false,
      totalHistorical: undefined,
      maleHistorical: undefined,
      femaleHistorical: undefined,
      totalForecast: p.totalAdmitted,
      maleForecast: p.maleAdmitted,
      femaleForecast: p.femaleAdmitted,
      totalLower95: p.totalLower95,
      totalUpper95: p.totalUpper95,
      femaleUpper95: Math.round(p.totalUpper95 * (p.femaleRatio / 100)),
      femaleLower95: Math.round(p.totalLower95 * (p.femaleRatio / 100)),
      maleUpper95: Math.round(p.totalUpper95 * (p.maleRatio / 100)),
      maleLower95: Math.round(p.totalLower95 * (p.maleRatio / 100)),
      optimisticForecast: Math.round(p.totalAdmitted * Math.pow(1.04, idx + 1)),
      pessimisticForecast: Math.round(p.totalAdmitted * Math.pow(0.96, idx + 1)),
      femaleRatioHistorical: undefined,
      maleRatioHistorical: undefined,
      femaleRatioForecast: p.femaleRatio,
      maleRatioForecast: p.maleRatio,
      lowerBound95: p.lowerBound95,
      upperBound95: p.upperBound95,
      isCapacityExceeded: p.isCapacityExceeded
    }));

    // Bridge last historical point to forecast line for clean continuous chart
    if (historicalPoints.length > 0 && lastHistorical) {
      const lastIdx = historicalPoints.length - 1;
      historicalPoints[lastIdx] = {
        ...historicalPoints[lastIdx],
        totalForecast: lastHistorical.totalAdmitted,
        maleForecast: lastHistorical.maleAdmitted,
        femaleForecast: lastHistorical.femaleAdmitted,
        totalLower95: lastHistorical.totalAdmitted,
        totalUpper95: lastHistorical.totalAdmitted,
        femaleUpper95: lastHistorical.femaleAdmitted,
        femaleLower95: lastHistorical.femaleAdmitted,
        maleUpper95: lastHistorical.maleAdmitted,
        maleLower95: lastHistorical.maleAdmitted,
        optimisticForecast: lastHistorical.totalAdmitted,
        pessimisticForecast: lastHistorical.totalAdmitted,
        femaleRatioForecast: lastHistorical.femaleAdmissionRatio,
        maleRatioForecast: lastHistorical.maleAdmissionRatio,
        lowerBound95: lastHistorical.femaleAdmissionRatio,
        upperBound95: lastHistorical.femaleAdmissionRatio
      };
    }

    return [...historicalPoints, ...forecastPoints];
  }, [sortedHistorical, forecastResult, planningCapacity]);

  // CSV Exporter for Planners
  const handleExportCSV = () => {
    const headers =
      'Academic Year,Cycle Type,Total Students,Male Students,Female Students,Female Ratio (%),Male Ratio (%),Lower Bound 95 (%),Upper Bound 95 (%),Total Lower Bound 95,Total Upper Bound 95,Scenario,Capacity Threshold\n';

    const histRows = sortedHistorical
      .map(
        r =>
          `${r.academicYear},HISTORICAL,${r.totalAdmitted},${r.maleAdmitted},${r.femaleAdmitted},${r.femaleAdmissionRatio},${r.maleAdmissionRatio},${r.femaleAdmissionRatio},${r.femaleAdmissionRatio},${r.totalAdmitted},${r.totalAdmitted},N/A,${planningCapacity}`
      )
      .join('\n');

    const predRows = forecastResult.predictions
      .map(
        p =>
          `${p.academicYear},FORECAST,${p.totalAdmitted},${p.maleAdmitted},${p.femaleAdmitted},${p.femaleRatio},${p.maleRatio},${p.lowerBound95},${p.upperBound95},${p.totalLower95},${p.totalUpper95},${scenario},${planningCapacity}`
      )
      .join('\n');

    const blob = new Blob([headers + histRows + '\n' + predRows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admimatrix-forecast-${horizonYears}yr-${selectedModel.toLowerCase()}-${scenario.toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Check if any projected point exceeds planning capacity
  const capacityExceededPoint = forecastResult.predictions.find(p => p.isCapacityExceeded);
  const finalYearPred = forecastResult.predictions[forecastResult.predictions.length - 1];

  return (
    <div id="forecasting-control-room-container" className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center space-x-2">
            <Brain className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            <span>Forecasting &amp; Decision-Support Control Room</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Empirical multi-horizon projection engine with walk-forward chronological backtesting, independent gender modeling, and planning capacity simulation.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-xs hover:border-purple-300 dark:hover:border-purple-600 hover:text-purple-700 active:scale-95 cursor-pointer"
            title="Download complete projection matrix as CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Projections CSV</span>
          </button>
        </div>
      </div>

      {/* Control Panel: Horizon, Model Architecture, Scenarios, and Capacity Assumption */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {/* 1. Horizon Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Forecast Horizon
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[5, 6, 7].map(h => (
                <button
                  key={h}
                  onClick={() => setHorizonYears(h as 5 | 6 | 7)}
                  className={`py-2 px-2 rounded-lg text-xs font-bold transition-all duration-200 ease-out flex flex-col items-center justify-center border cursor-pointer hover:-translate-y-0.5 active:scale-95 ${
                    horizonYears === h
                      ? 'bg-purple-600 border-purple-600 text-white shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-slate-700/60 hover:border-purple-300 dark:hover:border-purple-700 hover:text-purple-700'
                  }`}
                >
                  <span className="text-sm">{h} Yrs</span>
                  <span className="text-[10px] font-normal opacity-85">
                    {h === 5 ? 'Standard' : `${h} Cycles`}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Model Selection */}
          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Forecasting Model Architecture
              </label>
              {selectedModel === 'AUTO' && (
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center space-x-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>Auto-Selected: {forecastResult.selectedModelId}</span>
                </span>
              )}
            </div>
            <select
              value={selectedModel}
              onChange={e => setSelectedModel(e.target.value as ForecastModelId)}
              className="w-full py-2.5 px-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
            >
              <option value="AUTO">AUTO (Recommended — Time-Series Walk-Forward Backtesting Selection)</option>
              <option value="HOLT">Holt's Linear Exponential Smoothing (Damped Trend)</option>
              <option value="OLS">Ordinary Least Squares (OLS) Linear Regression</option>
              <option value="DEMOGRAPHIC">Demographic Ratio Model (Chitral Population Proxy Signal)</option>
              <option value="MOVING_AVG">3-Cycle Moving Average (Rolling Historical Mean)</option>
              <option value="POLYNOMIAL">Polynomial Degree 2 Curve (Quadratic Trend)</option>
              <option value="NAIVE">Naive Baseline Benchmark (Persistence: y_t = y_(t-1))</option>
              <option value="LOGIT">Logit-Linked Asymptotic Trend (Sigmoid-Bounded Ratio Drift)</option>
              <option value="ARIMA">ARIMA(1, 1, 0) Differenced Model (Autoregressive)</option>
            </select>
          </div>

          {/* 3. Scenario Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              What-If Scenario Assumption
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  { id: 'BASELINE', label: 'Baseline', sub: '0% adj' },
                  { id: 'OPTIMISTIC', label: 'Optimistic', sub: '+4%/yr' },
                  { id: 'PESSIMISTIC', label: 'Pessimistic', sub: '-4%/yr' }
                ] as const
              ).map(sc => (
                <button
                  key={sc.id}
                  onClick={() => setScenario(sc.id)}
                  className={`py-2 px-1 rounded-lg text-xs font-semibold transition-all duration-200 ease-out flex flex-col items-center justify-center border cursor-pointer hover:-translate-y-0.5 active:scale-95 ${
                    scenario === sc.id
                      ? sc.id === 'OPTIMISTIC'
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                        : sc.id === 'PESSIMISTIC'
                        ? 'bg-amber-600 border-amber-600 text-white shadow-xs'
                        : 'bg-slate-800 dark:bg-slate-700 border-slate-700 text-white shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-[11px] font-bold">{sc.label}</span>
                  <span className="text-[9px] opacity-80">{sc.sub}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Planning Capacity Slider & Display Toggle Row */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Planning Capacity Slider */}
          <div className="flex-1 max-w-lg space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                <Scale className="w-3.5 h-3.5 text-slate-500" />
                <span>Planning Capacity Assumption:</span>
              </span>
              <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                {planningCapacity.toLocaleString()} seats / cycle
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <input
                type="range"
                min="500"
                max="3000"
                step="25"
                value={planningCapacity}
                onChange={e => setPlanningCapacity(Number(e.target.value))}
                className="w-full accent-purple-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
              />
              <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">
                Range: 500–3,000
              </span>
            </div>
            {/* Quick Capacity Presets */}
            <div className="flex items-center space-x-1.5 pt-1">
              <span className="text-[10px] text-slate-400">Presets:</span>
              {[500, 600, 750, 1000, 1500, 2000, 3000].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setPlanningCapacity(val)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-all cursor-pointer ${
                    planningCapacity === val
                      ? 'bg-purple-600 text-white font-bold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-purple-100 dark:hover:bg-purple-900/40 hover:text-purple-600'
                  }`}
                >
                  {val >= 1000 ? `${val / 1000}k` : val}
                </button>
              ))}
            </div>
          </div>

          {/* View Mode Toggle: Headcount (Students) vs Ratio (%) */}
          <div className="flex items-center space-x-2 shrink-0">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Metric Display:</span>
            <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('HEADCOUNT')}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'HEADCOUNT'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-purple-600'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Headcounts (Students)</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('RATIO')}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'RATIO'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-purple-600'
                }`}
              >
                <Percent className="w-3.5 h-3.5" />
                <span>Admission Ratios (%)</span>
              </button>
            </div>

            {/* Toggle Prediction Bands */}
            <button
              onClick={() => setShowPredictionBands(!showPredictionBands)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${
                showPredictionBands
                  ? 'bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-950/40 dark:border-purple-800 dark:text-purple-300'
                  : 'bg-slate-100 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
              }`}
              title="Toggle shaded prediction uncertainty interval"
            >
              {showPredictionBands ? 'Prediction Range: ON' : 'Prediction Range: OFF'}
            </button>
          </div>
        </div>
      </div>

      {/* Capacity Alert Banner if demand exceeds planning capacity */}
      {capacityExceededPoint && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/80 flex items-start space-x-3 text-amber-900 dark:text-amber-200 shadow-xs">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed space-y-1">
            <p className="font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
              Capacity Planning Warning: Demand Exceeds Configured Assumption
            </p>
            <p className="text-amber-700 dark:text-amber-300/90">
              Projected enrollment demand for cycle <strong>{capacityExceededPoint.academicYear}</strong> is{' '}
              <strong>{capacityExceededPoint.totalAdmitted.toLocaleString()} students</strong>, which exceeds the
              configured planning capacity assumption of{' '}
              <strong>{planningCapacity.toLocaleString()} seats</strong> by approximately{' '}
              <strong>{(capacityExceededPoint.totalAdmitted - planningCapacity).toLocaleString()} students</strong>.
              In accordance with statistical standards, AdmiMatrix maintains the unconstrained statistical demand forecast
              rather than artificially suppressing it.
            </p>
          </div>
        </div>
      )}

      {/* Capacity Threshold Alert Badge if breached */}
      {firstCapacityBreach && viewMode === 'HEADCOUNT' && (
        <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center space-x-2.5">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <p className="leading-relaxed">
              <strong>Campus Seating Limit Breach:</strong> Projected demand exceeds capacity ({planningCapacity.toLocaleString()} seats) starting in AY <strong>{firstCapacityBreach.academicYear}</strong> ({firstCapacityBreach.totalAdmitted.toLocaleString()} students; +{(firstCapacityBreach.totalAdmitted - planningCapacity).toLocaleString()} seats deficit).
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 font-mono font-bold text-[10px] shrink-0 self-start sm:self-auto">
            Breach: AY {firstCapacityBreach.academicYear}
          </span>
        </div>
      )}

      {/* Main Interactive Time-Series Chart */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
              <span>
                {viewMode === 'HEADCOUNT'
                  ? `University Enrollment Projections by Student Cohort (${horizonYears} Academic Years)`
                  : `Historical Gender Proportions vs. Projected Ratios (${horizonYears} Academic Years)`}
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Pink: Female projection • Blue: Male projection • Purple: Total demand • Green: Optimistic (+4%) • Amber: Pessimistic (-4%) • Shaded: 95% PI.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Descriptive Legend Labels for Clear Understanding */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-pink-50 dark:bg-pink-950/40 border border-pink-200 dark:border-pink-800/60 text-xs font-semibold text-pink-700 dark:text-pink-300 shadow-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-pink-500 ring-2 ring-pink-200 dark:ring-pink-900 shrink-0" />
                <span>Female Student Projection</span>
              </div>

              <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 text-xs font-semibold text-blue-700 dark:text-blue-300 shadow-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-blue-200 dark:ring-blue-900 shrink-0" />
                <span>Male Student Projection</span>
              </div>

              <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 text-xs font-semibold text-purple-700 dark:text-purple-300 shadow-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 ring-2 ring-purple-200 dark:ring-purple-900 shrink-0" />
                <span>Total Admission Projection</span>
              </div>

              <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs font-semibold text-emerald-700 dark:text-emerald-300 shadow-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200 dark:ring-emerald-900 shrink-0" />
                <span>Optimistic (+4%)</span>
              </div>

              <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs font-semibold text-amber-700 dark:text-amber-300 shadow-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-amber-200 dark:ring-amber-900 shrink-0" />
                <span>Pessimistic (-4%)</span>
              </div>
            </div>

            <span className="font-mono px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs hidden sm:inline-block">
              {forecastResult.modelName}
            </span>
          </div>
        </div>

        {/* Recharts Composite Chart */}
        <div className="h-80 sm:h-96 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartSeries} margin={{ top: 15, right: 20, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
              <XAxis dataKey="academicYear" stroke="#64748b" fontSize={11} tickLine={false} />

              {viewMode === 'HEADCOUNT' ? (
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  domain={['auto', 'auto']}
                  tickFormatter={v => `${v}`}
                />
              ) : (
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  domain={[20, 80]}
                  tickFormatter={v => `${v}%`}
                />
              )}

              {/* Enhanced Custom Tooltip */}
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '12px'
                }}
                formatter={(val: any, name: any) => {
                  if (val === undefined || val === null) return ['—', ''];
                  const labelMap: Record<string, string> = {
                    totalHistorical: 'Total Admitted (Historical)',
                    maleHistorical: 'Male Admitted (Historical)',
                    femaleHistorical: 'Female Admitted (Historical)',
                    totalForecast: 'Projected Total Demand',
                    maleForecast: 'Projected Male Demand',
                    femaleForecast: 'Projected Female Demand',
                    totalUpper95: 'Total Upper Bound (95% PI)',
                    totalLower95: 'Total Lower Bound (95% PI)',
                    femaleUpper95: 'Female Upper Bound (95% PI)',
                    femaleLower95: 'Female Lower Bound (95% PI)',
                    maleUpper95: 'Male Upper Bound (95% PI)',
                    maleLower95: 'Male Lower Bound (95% PI)',
                    optimisticForecast: 'Optimistic Scenario (+4%/yr)',
                    pessimisticForecast: 'Pessimistic Scenario (-4%/yr)',
                    femaleRatioHistorical: 'Female Ratio (Historical)',
                    maleRatioHistorical: 'Male Ratio (Historical)',
                    femaleRatioForecast: 'Projected Female Ratio',
                    maleRatioForecast: 'Projected Male Ratio',
                    upperBound95: 'Ratio Upper Bound (95% PI)',
                    lowerBound95: 'Ratio Lower Bound (95% PI)'
                  };

                  const formatted =
                    viewMode === 'HEADCOUNT'
                      ? `${Number(val).toLocaleString()} students`
                      : `${Number(val).toFixed(2)}%`;

                  return [formatted, labelMap[name] || name];
                }}
                labelFormatter={l => `Academic Year: ${l}`}
              />

              {/* Planning Capacity Reference Line (Headcount view only) */}
              {viewMode === 'HEADCOUNT' && (cohortProjectionView === 'TOTAL' || cohortProjectionView === 'ALL') && (
                <ReferenceLine
                  y={planningCapacity}
                  stroke="#f59e0b"
                  strokeDasharray="4 4"
                  strokeWidth={2}
                  label={{
                    value: `Planning Capacity (${planningCapacity.toLocaleString()})`,
                    position: 'insideTopRight',
                    fill: '#f59e0b',
                    fontSize: 10
                  }}
                />
              )}

              {/* Shaded 95% Prediction Interval Band */}
              {showPredictionBands && (
                <Area
                  type="monotone"
                  dataKey={
                    viewMode === 'RATIO'
                      ? 'upperBound95'
                      : cohortProjectionView === 'FEMALE'
                      ? 'femaleUpper95'
                      : cohortProjectionView === 'MALE'
                      ? 'maleUpper95'
                      : 'totalUpper95'
                  }
                  stroke="none"
                  fill={
                    cohortProjectionView === 'FEMALE'
                      ? '#ec4899'
                      : cohortProjectionView === 'MALE'
                      ? '#3b82f6'
                      : '#9333ea'
                  }
                  fillOpacity={0.14}
                  name="predictionInterval95"
                  legendType="none"
                />
              )}

              {/* HEADCOUNT VIEW LINES */}
              {viewMode === 'HEADCOUNT' && (
                <>
                  {/* FEMALE PROJECTION GRAPH */}
                  {(cohortProjectionView === 'FEMALE' || cohortProjectionView === 'ALL') && (
                    <>
                      <Line
                        type="monotone"
                        dataKey="femaleHistorical"
                        stroke="#ec4899"
                        strokeWidth={cohortProjectionView === 'FEMALE' ? 3.5 : 2}
                        dot={{ r: 4, fill: '#ec4899', stroke: '#fff', strokeWidth: 1.5 }}
                        name="femaleHistorical"
                        connectNulls={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="femaleForecast"
                        stroke="#be185d"
                        strokeWidth={cohortProjectionView === 'FEMALE' ? 3.5 : 2}
                        strokeDasharray="6 4"
                        dot={{ r: 5, fill: '#be185d', stroke: '#fff', strokeWidth: 2 }}
                        name="femaleForecast"
                        connectNulls={false}
                      />
                    </>
                  )}

                  {/* MALE PROJECTION GRAPH */}
                  {(cohortProjectionView === 'MALE' || cohortProjectionView === 'ALL') && (
                    <>
                      <Line
                        type="monotone"
                        dataKey="maleHistorical"
                        stroke="#3b82f6"
                        strokeWidth={cohortProjectionView === 'MALE' ? 3.5 : 2}
                        dot={{ r: 4, fill: '#3b82f6', stroke: '#fff', strokeWidth: 1.5 }}
                        name="maleHistorical"
                        connectNulls={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="maleForecast"
                        stroke="#1d4ed8"
                        strokeWidth={cohortProjectionView === 'MALE' ? 3.5 : 2}
                        strokeDasharray="6 4"
                        dot={{ r: 5, fill: '#1d4ed8', stroke: '#fff', strokeWidth: 2 }}
                        name="maleForecast"
                        connectNulls={false}
                      />
                    </>
                  )}

                  {/* TOTAL ADMISSION PROJECTION GRAPH */}
                  {(cohortProjectionView === 'TOTAL' || cohortProjectionView === 'ALL') && (
                    <>
                      <Line
                        type="monotone"
                        dataKey="totalHistorical"
                        stroke="#9333ea"
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#9333ea', stroke: '#fff', strokeWidth: 1.5 }}
                        name="totalHistorical"
                        connectNulls={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="totalForecast"
                        stroke="#7e22ce"
                        strokeWidth={3}
                        strokeDasharray="6 4"
                        dot={{ r: 4, fill: '#7e22ce', stroke: '#fff', strokeWidth: 1.5 }}
                        name="totalForecast"
                        connectNulls={false}
                      />

                      {/* Scenario Envelope Lines (Optimistic & Pessimistic) */}
                      <Line
                        type="monotone"
                        dataKey="optimisticForecast"
                        stroke="#10b981"
                        strokeWidth={1.5}
                        strokeDasharray="3 3"
                        dot={false}
                        name="optimisticForecast"
                        connectNulls={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="pessimisticForecast"
                        stroke="#f59e0b"
                        strokeWidth={1.5}
                        strokeDasharray="3 3"
                        dot={false}
                        name="pessimisticForecast"
                        connectNulls={false}
                      />
                    </>
                  )}
                </>
              )}

              {/* RATIO VIEW LINES */}
              {viewMode === 'RATIO' && (
                <>
                  {(cohortProjectionView === 'FEMALE' || cohortProjectionView === 'ALL' || cohortProjectionView === 'TOTAL') && (
                    <>
                      <Line
                        type="monotone"
                        dataKey="femaleRatioHistorical"
                        stroke="#ec4899"
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#ec4899', stroke: '#fff', strokeWidth: 1.5 }}
                        name="femaleRatioHistorical"
                        connectNulls={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="femaleRatioForecast"
                        stroke="#be185d"
                        strokeWidth={3}
                        strokeDasharray="5 5"
                        dot={{ r: 4, fill: '#be185d' }}
                        name="femaleRatioForecast"
                        connectNulls={false}
                      />
                    </>
                  )}

                  {(cohortProjectionView === 'MALE' || cohortProjectionView === 'ALL' || cohortProjectionView === 'TOTAL') && (
                    <>
                      <Line
                        type="monotone"
                        dataKey="maleRatioHistorical"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#3b82f6', stroke: '#fff', strokeWidth: 1.5 }}
                        name="maleRatioHistorical"
                        connectNulls={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="maleRatioForecast"
                        stroke="#1d4ed8"
                        strokeWidth={3}
                        strokeDasharray="5 5"
                        dot={{ r: 4, fill: '#1d4ed8' }}
                        name="maleRatioForecast"
                        connectNulls={false}
                      />
                    </>
                  )}
                </>
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Multi-Year Detailed Forecast Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              {horizonYears}-Year Comprehensive Projection Matrix
            </h3>
          </div>
          <div className="flex items-center space-x-3 text-xs">
            <span className="font-mono text-emerald-600 dark:text-emerald-400 font-medium">
              Male + Female = Total (Guaranteed Invariance)
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Academic Year</th>
                <th className="py-3 px-4">Horizon</th>
                <th className="py-3 px-4 text-right">Total Demand</th>
                <th className="py-3 px-4 text-right">Male Students</th>
                <th className="py-3 px-4 text-right">Female Students</th>
                <th className="py-3 px-4 text-right">Female Ratio (%)</th>
                <th className="py-3 px-4 text-right">Male Ratio (%)</th>
                <th className="py-3 px-4 text-right">95% Headcount Range</th>
                <th className="py-3 px-4 text-center">Capacity Check</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300 font-mono">
              {forecastResult.predictions.map(p => {
                const isExceeded = p.isCapacityExceeded;
                return (
                  <tr key={p.academicYear} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white text-sm">
                      {p.academicYear}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                      Step +{p.stepAhead}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-purple-700 dark:text-purple-300 text-sm">
                      {p.totalAdmitted.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-semibold text-blue-600 dark:text-blue-400">
                      {p.maleAdmitted.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-semibold text-pink-600 dark:text-pink-400">
                      {p.femaleAdmitted.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right text-pink-600 dark:text-pink-400">
                      {p.femaleRatio}%
                    </td>
                    <td className="py-3.5 px-4 text-right text-blue-600 dark:text-blue-400">
                      {p.maleRatio}%
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-500 dark:text-slate-400">
                      [{p.totalLower95.toLocaleString()} – {p.totalUpper95.toLocaleString()}]
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {isExceeded ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          <span>Exceeds +{(p.totalAdmitted - planningCapacity).toLocaleString()}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Within Cap</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Forecast Explanation & Model Scorecard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* "Why This Forecast?" / Methodology Summary Card */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
              <Info className="w-4 h-4 text-purple-600" />
              <span>Forecast Explanation &amp; Audit Trail</span>
            </h3>
            <span className="text-xs px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-mono font-semibold">
              Module 4 Engine
            </span>
          </div>

          <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Forecast Horizon:</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {forecastResult.horizonYears} Academic Years ({forecastResult.forecastPeriod})
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Historical Baseline Range:</span>
              <span className="font-mono text-slate-900 dark:text-white font-semibold">
                {forecastResult.historicalPeriod}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Active Model:</span>
              <span className="font-semibold text-purple-600 dark:text-purple-400">
                {forecastResult.modelName}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Validation Method:</span>
              <span className="text-slate-800 dark:text-slate-200">
                Walk-Forward Expanding Window (Leave-Next-Out)
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Active Scenario:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {forecastResult.scenario} ({forecastResult.scenarioMultiplierPct >= 0 ? '+' : ''}
                {forecastResult.scenarioMultiplierPct}%/yr compounded)
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Final Horizon Expectation:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {finalYearPred?.totalAdmitted.toLocaleString()} students [
                {finalYearPred?.totalLower95.toLocaleString()} – {finalYearPred?.totalUpper95.toLocaleString()}]
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500 dark:text-slate-400">Planning Capacity Benchmark:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {planningCapacity.toLocaleString()} seats
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pt-2 border-t border-slate-100 dark:border-slate-800">
            {forecastResult.methodology}
          </p>
        </div>

        {/* Model Backtesting Scorecard Panel */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
                <Activity className="w-4 h-4 text-emerald-600" />
                <span>Model Evaluation &amp; Backtesting Scorecard</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Evaluated against historical University of Chitral cycles without data leakage.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsScorecardExpanded(!isScorecardExpanded)}
              className="text-xs text-purple-600 dark:text-purple-400 hover:underline flex items-center space-x-1 cursor-pointer"
            >
              <span>{isScorecardExpanded ? 'Collapse' : 'View All'}</span>
              {isScorecardExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Quick Metrics for Active Model */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">MAE</span>
              <p className="text-lg font-bold font-mono text-slate-900 dark:text-white mt-0.5">
                {forecastResult.metrics.mae}
              </p>
              <span className="text-[10px] text-slate-400">Mean Abs Error</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">RMSE</span>
              <p className="text-lg font-bold font-mono text-slate-900 dark:text-white mt-0.5">
                {forecastResult.metrics.rmse}
              </p>
              <span className="text-[10px] text-slate-400">Root Mean Sq</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">MAPE</span>
              <p className="text-lg font-bold font-mono text-slate-900 dark:text-white mt-0.5">
                {forecastResult.metrics.mape}%
              </p>
              <span className="text-[10px] text-slate-400">Percentage Err</span>
            </div>
          </div>

          {/* Comparative Model Table */}
          <div className="overflow-x-auto pt-1">
            <table className="w-full text-left text-xs border-collapse font-mono">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-sans text-[11px] font-semibold">
                  <th className="py-2 px-2">Model Architecture</th>
                  <th className="py-2 px-2 text-right">MAE</th>
                  <th className="py-2 px-2 text-right">RMSE</th>
                  <th className="py-2 px-2 text-right">MAPE</th>
                  <th className="py-2 px-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[11px]">
                {(isScorecardExpanded
                  ? forecastResult.modelComparison
                  : forecastResult.modelComparison.slice(0, 4)
                ).map(m => {
                  const isActive =
                    m.modelId === forecastResult.selectedModelId ||
                    (selectedModel === 'AUTO' && m.modelId === forecastResult.selectedModelId);

                  return (
                    <tr
                      key={m.modelId}
                      className={isActive ? 'bg-purple-50/70 dark:bg-purple-950/30 font-semibold' : ''}
                    >
                      <td className="py-2 px-2 font-sans text-slate-800 dark:text-slate-200">
                        {m.modelName}
                      </td>
                      <td className="py-2 px-2 text-right text-slate-600 dark:text-slate-300">
                        {m.mae}
                      </td>
                      <td className="py-2 px-2 text-right text-slate-600 dark:text-slate-300">
                        {m.rmse}
                      </td>
                      <td className="py-2 px-2 text-right text-slate-600 dark:text-slate-300">
                        {m.mape}%
                      </td>
                      <td className="py-2 px-2 text-center">
                        {isActive ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-600 text-white font-sans font-bold">
                            Selected
                          </span>
                        ) : m.modelId === 'NAIVE' ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-sans">
                            Benchmark
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 font-sans">
                            Eligible
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Transparent Demographic Ratio Model Breakdown (when Demographic model is selected or available) */}
      {forecastResult.demographicDetails && (
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Demographic Ratio Model Transparency Details
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] font-sans text-slate-500 block uppercase font-semibold">Chitral Base Population</span>
              <span className="text-base font-bold text-slate-900 dark:text-white">
                {forecastResult.demographicDetails.populationUsed.toLocaleString()}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] font-sans text-slate-500 block uppercase font-semibold">Annual Pop Growth Rate</span>
              <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                {forecastResult.demographicDetails.projectedAnnualPopGrowthRatePct}%
              </span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] font-sans text-slate-500 block uppercase font-semibold">Historical Participation Rate</span>
              <span className="text-base font-bold text-slate-900 dark:text-white">
                {forecastResult.demographicDetails.historicalParticipationRatePct}%
              </span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] font-sans text-slate-500 block uppercase font-semibold">Horizon Future Population</span>
              <span className="text-base font-bold text-purple-600 dark:text-purple-400">
                {forecastResult.demographicDetails.projectedFuturePopulation.toLocaleString()}
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 italic">
            * {forecastResult.demographicDetails.proxyDisclaimer}
          </p>
        </div>
      )}

      {/* Institutional Decision-Support Grounded Summary & Live Gemini AI Briefing */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 text-amber-500" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Decision-Support Planning Guidance &amp; Live AI Briefing
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Deterministic mathematical baseline paired with real-time Groq LPU intelligence.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGenerateLiveAiBriefing}
            disabled={isAiGenerating}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition cursor-pointer shadow-xs active:scale-95 disabled:opacity-50 shrink-0"
          >
            {isAiGenerating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Generating Live Briefing...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate Live Groq Briefing</span>
              </>
            )}
          </button>
        </div>

        {/* Shimmery Skeleton Loader while AI Briefing is generating */}
        {isAiGenerating && (
          <div className="pt-2">
            <AiBriefingSkeleton />
          </div>
        )}

        {/* Live Groq AI Briefing Output (When Generated) */}
        {!isAiGenerating && liveAiBriefing && (
          <div className="p-5 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/80 space-y-4 transition-all">
            <div className="flex items-center justify-between pb-2 border-b border-purple-200/60 dark:border-purple-900/60">
              <span className="text-xs font-bold text-purple-900 dark:text-purple-200 flex items-center space-x-1.5 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                <span>Live Groq Executive Synthesis</span>
              </span>
              <div className="flex items-center space-x-2 text-[10px] font-mono">
                <span className="px-2 py-0.5 rounded bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-200 font-bold">
                  {liveAiBriefing.meta.modelUsed}
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold">
                  {liveAiBriefing.meta.latencyMs}ms
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
              {liveAiBriefing.executiveAnswer}
            </p>

            {liveAiBriefing.urduTranslation && (
              <div className="p-3.5 rounded-xl bg-white/80 dark:bg-slate-900/70 border border-purple-200 dark:border-purple-900 space-y-1">
                <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300 flex items-center space-x-1">
                  <Languages className="w-3.5 h-3.5" />
                  <span>اردو خلاصہ (Urdu Regional Briefing)</span>
                </span>
                <p dir="rtl" className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 font-serif leading-loose">
                  {liveAiBriefing.urduTranslation}
                </p>
              </div>
            )}

            {/* Evidence vs Hypotheses Dual Card */}
            {(liveAiBriefing.verifiedEvidence?.length > 0 || liveAiBriefing.hypotheses?.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {liveAiBriefing.verifiedEvidence?.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 space-y-1.5">
                    <span className="text-[11px] font-bold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Verified Evidence Grounding</span>
                    </span>
                    <ul className="text-xs text-emerald-950 dark:text-emerald-200 space-y-1">
                      {liveAiBriefing.verifiedEvidence.map((ev, i) => (
                        <li key={i} className="leading-snug">• {ev.fact}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {liveAiBriefing.hypotheses?.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 space-y-1.5">
                    <span className="text-[11px] font-bold text-blue-900 dark:text-blue-200 uppercase tracking-wider flex items-center space-x-1">
                      <Brain className="w-3.5 h-3.5 text-blue-600" />
                      <span>Forecast Planning Hypotheses</span>
                    </span>
                    <ul className="text-xs text-blue-950 dark:text-blue-200 space-y-1">
                      {liveAiBriefing.hypotheses.map((hyp, i) => (
                        <li key={i} className="leading-snug">• <strong>{hyp.statement}</strong> ({hyp.impact})</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="pt-2 text-xs text-purple-950 dark:text-purple-200 font-medium">
              <strong>Strategic Recommendation: </strong>
              <span>{liveAiBriefing.planningRecommendation}</span>
            </div>
          </div>
        )}

        {aiBriefingError && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs">
            {aiBriefingError}
          </div>
        )}

        {/* Statistical Baseline Narrative */}
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          Based on verified historical admissions from {forecastResult.historicalPeriod}, the selected{' '}
          <strong>{forecastResult.modelName}</strong> estimates total student enrollment will reach approximately{' '}
          <strong>{finalYearPred?.totalAdmitted.toLocaleString()} students</strong> by academic year{' '}
          <strong>{finalYearPred?.academicYear}</strong> under the <strong>{scenario}</strong> scenario (95% Prediction Range:{' '}
          {finalYearPred?.totalLower95.toLocaleString()} to {finalYearPred?.totalUpper95.toLocaleString()} students). Female
          students are projected at approximately {finalYearPred?.femaleAdmitted.toLocaleString()} ({finalYearPred?.femaleRatio}%),
          and male students at approximately {finalYearPred?.maleAdmitted.toLocaleString()} ({finalYearPred?.maleRatio}%).
        </p>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-2">
            Key Planning Realities (Plain English):
          </span>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-600 dark:text-slate-300">
            {forecastResult.limitations.map((lim, idx) => {
              const colonIndex = lim.indexOf(':');
              const hasColon = colonIndex !== -1;
              const title = hasColon ? lim.slice(0, colonIndex) : null;
              const text = hasColon ? lim.slice(colonIndex + 1).trim() : lim;

              return (
                <li
                  key={idx}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 leading-relaxed flex items-start space-x-2.5 transition-colors hover:border-purple-300 dark:hover:border-purple-700/60"
                >
                  <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0 mt-1.5 shadow-xs" />
                  <div>
                    {title ? (
                      <>
                        <strong className="text-slate-900 dark:text-white font-bold block mb-0.5">
                          {title}
                        </strong>
                        <span className="text-slate-600 dark:text-slate-300 text-xs">
                          {text}
                        </span>
                      </>
                    ) : (
                      <span className="text-slate-600 dark:text-slate-300 text-xs">{lim}</span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* API Key Modal for Judges */}
      <ApiKeyModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        onKeySaved={handleGenerateLiveAiBriefing}
      />
    </div>
  );
};
