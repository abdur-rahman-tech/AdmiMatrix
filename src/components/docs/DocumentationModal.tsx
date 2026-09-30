import React from 'react';
import { X, BookOpen, FileText, CheckCircle2, ShieldAlert, Brain, Database, Award } from 'lucide-react';

interface DocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DocumentationModal: React.FC<DocumentationModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 p-5 flex items-center justify-between z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-purple-900/20 ring-2 ring-purple-500/40 shrink-0">
              <img
                src="/uoch-logo.png"
                alt="University of Chitral Logo"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                AdmiMatrix Technical Documentation &amp; Methodology
              </h3>
              <p className="text-xs text-purple-600 dark:text-purple-400 font-serif italic">
                "The Heartbeat of University of Chitral"
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
          {/* Section 1: Executive Overview */}
          <section className="space-y-2">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-1 flex items-center space-x-2">
              <Award className="w-4 h-4 text-emerald-600" />
              <span>1. Executive Overview &amp; Branding</span>
            </h4>
            <p>
              <strong>AdmiMatrix</strong> is a purpose-built, open-access, research-grade demographic and university admissions forecasting platform dedicated to the Chitral region (Khyber Pakhtunkhwa, Pakistan). Established to support the University of Chitral (UOCH) planning and development departments, researchers, and regional educational planners, AdmiMatrix converts raw census milestones and admissions records into actionable multi-horizon projections.
            </p>
          </section>

          {/* Section 2: Mathematical Invariance & Constraint */}
          <section className="space-y-2">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-1 flex items-center space-x-2">
              <Brain className="w-4 h-4 text-purple-600" />
              <span>2. Mathematical Forecasting Methodology</span>
            </h4>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 font-mono text-[11px] space-y-1">
              <p><strong>Headcount Invariance:</strong> Total Forecast = Male Forecast + Female Forecast</p>
              <p><strong>Gender Ratio Constraint:</strong> Male Ratio (%) + Female Ratio (%) = 100.00%</p>
              <p><strong>Naive Baseline Benchmark:</strong> y_(T+h) = y_T (persistence standard against which all models are tested)</p>
              <p><strong>Capacity Separation:</strong> Demand forecasts represent statistical need; planning capacity benchmarks do not suppress demand.</p>
              <p><strong>Logit Link Transformation:</strong> z = ln(p / (1 - p)), guaranteed bounded in (0, 1) for asymptotic ratios</p>
            </div>
            <p className="mt-1">
              Rather than estimating total enrollment and splitting by an arbitrary percentage, the system models male and female student headcounts independently from historical trends and sums them. Planners can toggle between total headcounts and gender proportions at any time.
            </p>
          </section>

          {/* Section 3: Time-Aware Backtesting */}
          <section className="space-y-2">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-1 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>3. Time-Aware Chronological Backtesting</span>
            </h4>
            <p>
              Standard random cross-validation is statistically invalid for time-series data because future information leaks into past model parameters. AdmiMatrix strictly enforces <strong>expanding-window chronological validation</strong> (Leave-Next-Out), sequentially withholding year T, training on 1..T-1, and measuring out-of-sample prediction error. Metrics reported: Mean Absolute Error (MAE), Root Mean Squared Error (RMSE), and Mean Absolute Percentage Error (MAPE).
            </p>
          </section>

          {/* Section 4: Data Governance & Ethics */}
          <section className="space-y-2">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-1 flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>4. Data Governance &amp; Synthetic Baseline Policy</span>
            </h4>
            <p>
              In accordance with research ethics, AdmiMatrix strictly differentiates between verified public records (e.g. Pakistan Bureau of Statistics 1998, 2017, and 2023 Digital Census enumerations) and university admission datasets. Where official institutional records require administrative authorization, AdmiMatrix operates on an explicitly labeled <strong>Synthetic Demonstration Profile</strong> (marked with persistent banners: <em>"SAMPLE / SYNTHETIC DATA — NOT OFFICIAL UNIVERSITY STATISTICS"</em>). Authorized administrators can ingest verified institutional CSV files at any time via the Admin Ingestion Workbench.
            </p>
          </section>

          {/* Section 5: Dynamic Horizon Principle */}
          <section className="space-y-2">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-1 flex items-center space-x-2">
              <Database className="w-4 h-4 text-blue-600" />
              <span>5. Dynamic Horizon Mechanics (No Hard-Coded Years)</span>
            </h4>
            <p>
              All future projections are computed dynamically from the highest recorded historical academic year (e.g., if latest record is 2025–2026, the 5-year horizon automatically computes 2026–2027 through 2030–2031; the 7-year horizon extends through 2032–2033).
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition"
          >
            Close Documentation
          </button>
        </div>
      </div>
    </div>
  );
};
