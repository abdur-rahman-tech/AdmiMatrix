import React from 'react';
import {
  GraduationCap,
  Users,
  Award,
  TrendingUp,
  Percent,
  Calendar,
  AlertTriangle,
  Info
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { AdmissionRecord, DataSource } from '../../types';
import { MetricCard } from '../common/MetricCard';

interface AdmissionAnalyticsProps {
  admissionsData: AdmissionRecord[];
  dataSources: DataSource[];
  onNavigateToAdmin?: () => void;
}

export const AdmissionAnalytics: React.FC<AdmissionAnalyticsProps> = ({
  admissionsData,
  dataSources,
  onNavigateToAdmin
}) => {
  const sorted = [...admissionsData].sort((a, b) => a.startYear - b.startYear);
  const latest = sorted[sorted.length - 1];
  const earliest = sorted[0];

  const totalAdmittedAllYears = sorted.reduce((sum, r) => sum + r.totalAdmitted, 0);
  const totalFemaleAllYears = sorted.reduce((sum, r) => sum + r.femaleAdmitted, 0);
  const aggregateFemaleRatio = totalAdmittedAllYears > 0
    ? Number(((totalFemaleAllYears / totalAdmittedAllYears) * 100).toFixed(1))
    : 0;

  const ratioShift = latest && earliest
    ? Number((latest.femaleAdmissionRatio - earliest.femaleAdmissionRatio).toFixed(2))
    : 0;

  const chartData = sorted.map(r => ({
    academicYear: r.academicYear,
    startYear: r.startYear,
    totalApplicants: r.totalApplicants,
    totalAdmitted: r.totalAdmitted,
    maleAdmitted: r.maleAdmitted,
    femaleAdmitted: r.femaleAdmitted,
    maleApplicants: r.maleApplicants,
    femaleApplicants: r.femaleApplicants,
    femaleRatio: r.femaleAdmissionRatio,
    maleRatio: r.maleAdmissionRatio,
    acceptanceRate: Number(((r.totalAdmitted / (r.totalApplicants || 1)) * 100).toFixed(1))
  }));

  const isSynthetic = sorted.some(r => r.status === 'SYNTHETIC');

  return (
    <div id="admissions-analytics-container" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center space-x-2">
            <GraduationCap className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <span>University of Chitral Admission Analytics</span>
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Module 2: Historical applicant volumes, admitted student headcounts, and gender parity trajectories (2017–2026).
          </p>
        </div>

        {isSynthetic && (
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-semibold">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Demonstration Profile: Synthetic Calibration</span>
          </div>
        )}
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          id="adm-metric-total"
          title="Latest Total Admissions"
          value={latest?.totalAdmitted.toLocaleString() || '0'}
          changeLabel={`From ${earliest?.totalAdmitted} (${earliest?.academicYear})`}
          changeType="positive"
          icon={GraduationCap}
          subtext={`Academic Year ${latest?.academicYear}`}
          sourceTag="UOCH Profile"
        />
        <MetricCard
          id="adm-metric-female-ratio"
          title="Latest Female Ratio"
          value={`${latest?.femaleAdmissionRatio}%`}
          changeLabel={`+${ratioShift}% since 2017`}
          changeType="positive"
          icon={TrendingUp}
          subtext={`${latest?.femaleAdmitted.toLocaleString()} female students`}
          sourceTag="Calculated Ratio"
        />
        <MetricCard
          id="adm-metric-male-ratio"
          title="Latest Male Ratio"
          value={`${latest?.maleAdmissionRatio}%`}
          changeLabel="100% - Female Ratio"
          changeType="neutral"
          icon={Users}
          subtext={`${latest?.maleAdmitted.toLocaleString()} male students`}
          sourceTag="Sum-to-100% Bound"
        />
        <MetricCard
          id="adm-metric-acceptance"
          title="Latest Admission Yield"
          value={`${latest ? ((latest.totalAdmitted / latest.totalApplicants) * 100).toFixed(1) : 0}%`}
          changeLabel={`${latest?.totalAdmitted} of ${latest?.totalApplicants} applicants`}
          changeType="neutral"
          icon={Percent}
          subtext="Admissions / Applicants"
          sourceTag="Selectivity Metric"
        />
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gender Ratio Evolution Chart */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Historical Gender Admission Ratio Trajectory
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Male Ratio vs Female Ratio (enforcing Male % + Female % = 100%)
              </p>
            </div>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-semibold font-mono">
              Parity Exceeded
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                <XAxis dataKey="academicYear" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  domain={[20, 80]}
                  tickFormatter={(val) => `${val}%`}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  formatter={(value: any, name: any) => [
                    `${value}%`,
                    name === 'femaleRatio' ? 'Female Admission Ratio' : 'Male Admission Ratio'
                  ]}
                  labelFormatter={(label) => `Academic Year: ${label}`}
                />
                <Legend
                  verticalAlign="top"
                  height={36}
                  formatter={(value) => (value === 'femaleRatio' ? 'Female Ratio (%)' : 'Male Ratio (%)')}
                />
                <Line
                  type="monotone"
                  dataKey="femaleRatio"
                  stroke="#ec4899"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#ec4899', strokeWidth: 1, stroke: '#fff' }}
                  name="femaleRatio"
                />
                <Line
                  type="monotone"
                  dataKey="maleRatio"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#3b82f6', strokeWidth: 1, stroke: '#fff' }}
                  name="maleRatio"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Admission vs Applicant Volume Chart */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Admitted Headcount Decomposed by Gender
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Male and female admitted student volumes per academic cycle
              </p>
            </div>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium font-mono">
              Headcounts
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                <XAxis dataKey="academicYear" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  formatter={(value: any, name: any) => [
                    `${Number(value).toLocaleString()} students`,
                    name === 'femaleAdmitted' ? 'Female Admitted' : name === 'maleAdmitted' ? 'Male Admitted' : 'Total Applicants'
                  ]}
                />
                <Legend
                  verticalAlign="top"
                  height={36}
                  formatter={(value) =>
                    value === 'femaleAdmitted'
                      ? 'Female Admitted'
                      : value === 'maleAdmitted'
                      ? 'Male Admitted'
                      : 'Total Applicants'
                  }
                />
                <Bar dataKey="maleAdmitted" stackId="a" fill="#3b82f6" name="maleAdmitted" />
                <Bar dataKey="femaleAdmitted" stackId="a" fill="#ec4899" radius={[4, 4, 0, 0]} name="femaleAdmitted" />
                <Line type="monotone" dataKey="totalApplicants" stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3 }} name="totalApplicants" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Admissions Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Comprehensive Admission Records (2017–2026)
            </h3>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              {sorted.length} cycles recorded
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Academic Year</th>
                <th className="py-3 px-4 text-right">Applicants (M / F / Total)</th>
                <th className="py-3 px-4 text-right">Admitted (M / F / Total)</th>
                <th className="py-3 px-4 text-right">Female Ratio (%)</th>
                <th className="py-3 px-4 text-right">Male Ratio (%)</th>
                <th className="py-3 px-4 text-right">Yield Rate</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Context Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {sorted.map((r) => {
                const yieldRate = ((r.totalAdmitted / (r.totalApplicants || 1)) * 100).toFixed(1);
                return (
                  <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      {r.academicYear}
                    </td>
                    <td className="py-3 px-4 text-right font-mono">
                      <span className="text-blue-600 dark:text-blue-400">{r.maleApplicants}</span>
                      <span className="text-slate-400 mx-1">/</span>
                      <span className="text-pink-600 dark:text-pink-400">{r.femaleApplicants}</span>
                      <span className="text-slate-400 mx-1">/</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{r.totalApplicants}</span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono">
                      <span className="text-blue-600 dark:text-blue-400 font-medium">{r.maleAdmitted}</span>
                      <span className="text-slate-400 mx-1">/</span>
                      <span className="text-pink-600 dark:text-pink-400 font-medium">{r.femaleAdmitted}</span>
                      <span className="text-slate-400 mx-1">/</span>
                      <span className="font-bold text-slate-900 dark:text-white">{r.totalAdmitted}</span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-pink-600 dark:text-pink-400">
                      {r.femaleAdmissionRatio}%
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-blue-600 dark:text-blue-400">
                      {r.maleAdmissionRatio}%
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600 dark:text-slate-300">
                      {yieldRate}%
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 text-[10px] rounded bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 font-medium border border-amber-200 dark:border-amber-800">
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400 max-w-md">
                      {r.startYear === 2022 ? (
                        <div className="space-y-1.5 p-2.5 rounded-lg bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/80">
                          <div className="flex items-center space-x-1.5">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 font-semibold text-[10px] border border-amber-300 dark:border-amber-700">
                              Institutional &amp; Community Cultural Context
                            </span>
                            <span className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                              Trough &amp; Compound Events
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-700 dark:text-slate-200 leading-relaxed font-normal">
                            In 2022, students organized a culture night event at University of Chitral. Because of this event, the public of Chitral criticized the university, citing that male and female students enjoy together in the culture night is not in accordance with local cultural and traditional values. Consequently, parents refused to give permission to students for getting admission in the university, precipitating a severe enrollment trough (total admitted dropped to 229, with female enrollment falling to 79). This institutional shock was compounded by the catastrophic July–August 2022 monsoon floods (68 bridges and 50km of roads destroyed), KP provincial university grant freeze, fee hikes, and acute hostel/transport collapse.
                          </p>
                        </div>
                      ) : (
                        <span className="truncate block" title={r.notes}>
                          {r.notes || 'Recorded UOCH cycle.'}
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

      {/* 2022 Historical Context & Event Record Information */}
      <div className="bg-amber-50/70 dark:bg-amber-950/30 rounded-xl p-4 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200 flex items-start space-x-3 shadow-xs">
        <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-amber-900 dark:text-amber-100 uppercase tracking-wider text-[11px]">
            Historical Record Information — 2022 Culture Night Event &amp; Public Reaction
          </p>
          <p className="text-amber-800 dark:text-amber-300/90 leading-relaxed">
            In 2022, students organized a culture night event at University of Chitral. Because of this event, the public of Chitral criticized the university, citing that male and female students enjoying together in the culture night is not in accordance with local cultural and traditional values. Consequently, parents refused to give permission to students for getting admission in the university, precipitating a severe enrollment trough (total admitted dropped to 229, with female enrollment falling to 79). This was compounded by catastrophic July–August 2022 monsoon floods, KP provincial grant freezes, and regional transport disruption.
          </p>
        </div>
      </div>
    </div>
  );
};
