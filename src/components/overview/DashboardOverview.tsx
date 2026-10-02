import React, { useMemo } from 'react';
import {
  Users,
  GraduationCap,
  TrendingUp,
  Brain,
  ArrowRight,
  MapPin
} from 'lucide-react';
import { PopulationRecord, AdmissionRecord, ForecastResult, AuditLog, UserRole } from '../../types';
import { MetricCard } from '../common/MetricCard';
import admimatrixOfficialLogo from '../../assets';

interface DashboardOverviewProps {
  populationData: PopulationRecord[];
  admissionsData: AdmissionRecord[];
  forecastResult: ForecastResult;
  onNavigate: (tab: string) => void;
  auditLogs?: AuditLog[];
  userRole?: UserRole;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  populationData,
  admissionsData,
  forecastResult,
  onNavigate
}) => {
  // Latest records
  const sortedPop = useMemo(() => {
    return [...populationData].sort((a, b) => b.year - a.year);
  }, [populationData]);

  const sortedAdm = useMemo(() => {
    return [...admissionsData].sort((a, b) => b.startYear - a.startYear);
  }, [admissionsData]);

  const latestPop = sortedPop[0];
  const latestAdm = sortedAdm[0];
  const nextYearPred = forecastResult?.predictions?.[0];

  // Valley summary
  const totalValleyPop = useMemo(() => {
    const combined2023 = populationData.find(p => p.year === 2023 && p.district === 'COMBINED_CHITRAL');
    if (combined2023) return combined2023.totalPopulation;
    const lower = populationData.find(p => p.year === 2023 && p.district === 'LOWER_CHITRAL');
    const upper = populationData.find(p => p.year === 2023 && p.district === 'UPPER_CHITRAL');
    if (lower && upper) return lower.totalPopulation + upper.totalPopulation;
    return latestPop ? latestPop.totalPopulation : 515200;
  }, [populationData, latestPop]);

  const lowerChitralPop = useMemo(() => {
    const rec = populationData.find(p => p.district === 'LOWER_CHITRAL' && (p.year === 2023 || p.year === 2024));
    return rec ? rec.totalPopulation : 320000;
  }, [populationData]);

  const upperChitralPop = useMemo(() => {
    const rec = populationData.find(p => p.district === 'UPPER_CHITRAL' && (p.year === 2023 || p.year === 2024));
    return rec ? rec.totalPopulation : 195200;
  }, [populationData]);

  const lowerPct = totalValleyPop > 0 ? ((lowerChitralPop / totalValleyPop) * 100).toFixed(1) : '62.1';
  const upperPct = totalValleyPop > 0 ? ((upperChitralPop / totalValleyPop) * 100).toFixed(1) : '37.9';

  return (
    <div id="dashboard-overview-container" className="space-y-6">
      {/* Clean, Simple Executive Header */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-l-4 border-l-emerald-500 border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-xl overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 ring-2 ring-cyan-500/60 shadow-xs shrink-0 flex items-center justify-center">
            <img
              id="admimatrix-overview-logo"
              src={admimatrixOfficialLogo}
              alt="AdmiMatrix logo"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                AdmiMatrix
              </h1>
              <span className="text-xs text-slate-400 dark:text-slate-500 hidden sm:inline">·</span>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hidden sm:inline">
                Chitral Institutional Intelligence
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Chitral Demographics, Admissions Analytics &amp; 5-Year Projection Matrix
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => onNavigate('forecast')}
            className="px-3.5 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold transition-all duration-150 ease-out cursor-pointer flex items-center space-x-1.5 shadow-xs active:scale-95"
          >
            <Brain className="w-3.5 h-3.5" />
            <span>5-Year Forecast</span>
          </button>
        </div>
      </div>

      {/* 4 Core Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          id="overview-metric-pop"
          title="Chitral Population"
          value={totalValleyPop.toLocaleString()}
          changeLabel="2023 PBS Census"
          changeType="positive"
          icon={Users}
          subtext={`Lower: ${lowerChitralPop.toLocaleString()} • Upper: ${upperChitralPop.toLocaleString()}`}
          sourceTag="PBS Census"
        />
        <MetricCard
          id="overview-metric-admissions"
          title="Latest Admissions"
          value={latestAdm ? latestAdm.totalAdmitted.toLocaleString() : '2,820'}
          changeLabel={`Cycle ${latestAdm?.academicYear || '2025-26'}`}
          changeType="positive"
          icon={GraduationCap}
          subtext={`${latestAdm?.totalApplicants.toLocaleString() || '6,100'} Applicants`}
          sourceTag="UOCH Registry"
        />
        <MetricCard
          id="overview-metric-female-ratio"
          title="Female Enrollment"
          value={`${latestAdm?.femaleAdmissionRatio || 52.5}%`}
          changeLabel="Majority Share"
          changeType="positive"
          icon={TrendingUp}
          subtext={`Male Share: ${latestAdm?.maleAdmissionRatio || 47.5}%`}
          sourceTag="Registry Calc"
        />
        <MetricCard
          id="overview-metric-next-forecast"
          title={`Forecast (${nextYearPred?.academicYear || '2026-27'})`}
          value={nextYearPred ? `${nextYearPred.totalAdmitted.toLocaleString()} Students` : '2,980 Students'}
          changeLabel={`Demand Projection (${forecastResult?.scenario || 'Baseline'})`}
          changeType="neutral"
          icon={Brain}
          subtext={`F: ${nextYearPred?.femaleRatio || 51.6}% • M: ${nextYearPred?.maleRatio || 48.4}%`}
          sourceTag={forecastResult?.modelName || 'Auto Model'}
        />
      </div>

      {/* Two Clear Insight Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* District Population Breakdown */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 transition-all duration-300 ease-out hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 transition-transform duration-300 hover:scale-110">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Chitral Valley Population Breakdown
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Regional distribution according to 2023 Digital Census
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('population')}
              className="group/link text-xs font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 flex items-center space-x-1 cursor-pointer transition-colors duration-200"
            >
              <span>Details</span>
              <ArrowRight className="w-3 h-3 transition-transform duration-200 group-hover/link:translate-x-1" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="group/stat p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-white dark:hover:bg-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700/60 hover:shadow-xs cursor-default">
              <span className="text-xs text-slate-500 dark:text-slate-400 transition-colors duration-200 group-hover/stat:text-slate-700 dark:group-hover/stat:text-slate-300">Lower Chitral</span>
              <p className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1 transition-colors duration-200 group-hover/stat:text-emerald-600 dark:group-hover/stat:text-emerald-400">
                {lowerChitralPop.toLocaleString()}
              </p>
              <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mt-0.5">{lowerPct}% of total</p>
            </div>

            <div className="group/stat p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-white dark:hover:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-700/60 hover:shadow-xs cursor-default">
              <span className="text-xs text-slate-500 dark:text-slate-400 transition-colors duration-200 group-hover/stat:text-slate-700 dark:group-hover/stat:text-slate-300">Upper Chitral</span>
              <p className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1 transition-colors duration-200 group-hover/stat:text-blue-600 dark:group-hover/stat:text-blue-400">
                {upperChitralPop.toLocaleString()}
              </p>
              <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mt-0.5">{upperPct}% of total</p>
            </div>
          </div>

          {/* Clean Visual Distribution Bar */}
          <div className="space-y-1.5 pt-1">
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden flex transition-all duration-300 hover:h-3">
              <div
                style={{ width: `${lowerPct}%` }}
                className="bg-emerald-500 h-full transition-all duration-500 ease-out hover:brightness-110"
                title={`Lower Chitral: ${lowerPct}%`}
              />
              <div
                style={{ width: `${upperPct}%` }}
                className="bg-blue-500 h-full transition-all duration-500 ease-out hover:brightness-110"
                title={`Upper Chitral: ${upperPct}%`}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>Lower Chitral ({lowerPct}%)</span>
              <span>Upper Chitral ({upperPct}%)</span>
            </div>
          </div>
        </div>

        {/* Admissions & Gender Parity */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 transition-all duration-300 ease-out hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400 transition-transform duration-300 hover:scale-110">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Admissions &amp; Gender Parity
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {latestAdm?.academicYear || '2025-2026'} Academic Intake
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('admissions')}
              className="group/link text-xs font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 flex items-center space-x-1 cursor-pointer transition-colors duration-200"
            >
              <span>Details</span>
              <ArrowRight className="w-3 h-3 transition-transform duration-200 group-hover/link:translate-x-1" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="group/stat p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-white dark:hover:bg-slate-800 hover:border-purple-300 dark:hover:border-purple-700/60 hover:shadow-xs cursor-default">
              <span className="text-xs text-slate-500 dark:text-slate-400 transition-colors duration-200 group-hover/stat:text-slate-700 dark:group-hover/stat:text-slate-300">Female Students</span>
              <p className="text-xl font-bold font-mono text-purple-600 dark:text-purple-400 mt-1 transition-transform duration-200 group-hover/stat:scale-[1.02] origin-left">
                {latestAdm?.femaleAdmitted.toLocaleString() || '1,480'}
              </p>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mt-0.5">
                {latestAdm?.femaleAdmissionRatio || 52.5}% of admitted
              </p>
            </div>

            <div className="group/stat p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-white dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-xs cursor-default">
              <span className="text-xs text-slate-500 dark:text-slate-400 transition-colors duration-200 group-hover/stat:text-slate-700 dark:group-hover/stat:text-slate-300">Male Students</span>
              <p className="text-xl font-bold font-mono text-slate-700 dark:text-slate-300 mt-1 transition-transform duration-200 group-hover/stat:scale-[1.02] origin-left">
                {latestAdm?.maleAdmitted.toLocaleString() || '1,340'}
              </p>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mt-0.5">
                {latestAdm?.maleAdmissionRatio || 47.5}% of admitted
              </p>
            </div>
          </div>

          {/* Visual Gender Parity Bar */}
          <div className="space-y-1.5 pt-1">
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden flex transition-all duration-300 hover:h-3">
              <div
                style={{ width: `${latestAdm?.femaleAdmissionRatio || 52.5}%` }}
                className="bg-purple-600 h-full transition-all duration-500 ease-out hover:brightness-110"
                title={`Female: ${latestAdm?.femaleAdmissionRatio || 52.5}%`}
              />
              <div
                style={{ width: `${latestAdm?.maleAdmissionRatio || 47.5}%` }}
                className="bg-slate-400 dark:bg-slate-600 h-full transition-all duration-500 ease-out hover:brightness-110"
                title={`Male: ${latestAdm?.maleAdmissionRatio || 47.5}%`}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>Female ({latestAdm?.femaleAdmissionRatio || 52.5}%)</span>
              <span>Male ({latestAdm?.maleAdmissionRatio || 47.5}%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          onClick={() => onNavigate('population')}
          className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-emerald-400 dark:hover:border-emerald-500 hover:shadow-md hover:-translate-y-1 active:scale-[0.99] transition-all duration-300 ease-out cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 transition-all duration-300 ease-out group-hover:scale-110 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/60 group-hover:shadow-xs">
              <Users className="w-5 h-5 transition-transform duration-300 group-hover:rotate-3" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 transition-all duration-300 ease-out group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:translate-x-1.5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-3.5 transition-colors duration-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
            Population Analytics
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 transition-colors duration-200 group-hover:text-slate-700 dark:group-hover:text-slate-300">
            PBS census records across 1998, 2017 &amp; 2023.
          </p>
        </div>

        <div
          onClick={() => onNavigate('admissions')}
          className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md hover:-translate-y-1 active:scale-[0.99] transition-all duration-300 ease-out cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 transition-all duration-300 ease-out group-hover:scale-110 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/60 group-hover:shadow-xs">
              <GraduationCap className="w-5 h-5 transition-transform duration-300 group-hover:rotate-3" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 transition-all duration-300 ease-out group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-1.5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-3.5 transition-colors duration-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">
            Admissions Analytics
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 transition-colors duration-200 group-hover:text-slate-700 dark:group-hover:text-slate-300">
            Historical cohorts, applicant trends, and acceptance ratios.
          </p>
        </div>

        <div
          onClick={() => onNavigate('forecast')}
          className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-md hover:-translate-y-1 active:scale-[0.99] transition-all duration-300 ease-out cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400 transition-all duration-300 ease-out group-hover:scale-110 group-hover:bg-purple-100 dark:group-hover:bg-purple-900/60 group-hover:shadow-xs">
              <Brain className="w-5 h-5 transition-transform duration-300 group-hover:rotate-3" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 transition-all duration-300 ease-out group-hover:text-purple-600 dark:group-hover:text-purple-400 group-hover:translate-x-1.5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-3.5 transition-colors duration-200 group-hover:text-purple-600 dark:group-hover:text-purple-400">
            5-Year Forecast
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 transition-colors duration-200 group-hover:text-slate-700 dark:group-hover:text-slate-300">
            Configurable projection models with 95% confidence bounds.
          </p>
        </div>
      </div>
    </div>
  );
};
