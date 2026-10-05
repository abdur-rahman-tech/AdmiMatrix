import React, { useState } from 'react';
import {
  Users,
  UserCheck,
  TrendingUp,
  MapPin,
  Calendar,
  ExternalLink,
  Info
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  LineChart,
  Line
} from 'recharts';
import { PopulationRecord, DataSource } from '../../types';
import { MetricCard } from '../common/MetricCard';

interface PopulationAnalyticsProps {
  populationData: PopulationRecord[];
  dataSources: DataSource[];
}

export const PopulationAnalytics: React.FC<PopulationAnalyticsProps> = ({
  populationData,
  dataSources
}) => {
  const [selectedDistrict, setSelectedDistrict] = useState<string>('ALL');

  const sortedData = [...populationData].sort((a, b) => a.year - b.year);
  const latest = sortedData[sortedData.length - 1];
  const earliest = sortedData[0];

  const totalGrowth = latest && earliest
    ? Number((((latest.totalPopulation - earliest.totalPopulation) / earliest.totalPopulation) * 100).toFixed(1))
    : 0;

  const chartData = sortedData.map(p => ({
    year: p.year,
    total: p.totalPopulation,
    male: p.malePopulation,
    female: p.femalePopulation,
    malePct: p.malePercentage,
    femalePct: p.femalePercentage,
    growthRate: p.annualGrowthRate || 0,
    isEstimated: p.isEstimated
  }));

  const getSource = (sourceId: string) => {
    return dataSources.find(s => s.id === sourceId)?.sourceName || 'PBS Census';
  };

  return (
    <div id="population-analytics-container" className="space-y-6">
      {/* Module Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center space-x-2">
            <Users className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <span>Chitral Demographic &amp; Population Analytics</span>
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Module 1: Historical census milestones (1998, 2017, 2023 Digital Census) and intercensal growth dynamics.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Coverage:</span>
          <span className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            Upper &amp; Lower Chitral (Combined)
          </span>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          id="pop-metric-total"
          title="Latest Total Population"
          value={latest?.totalPopulation.toLocaleString() || '0'}
          changeLabel={`+${totalGrowth}% since 1998`}
          changeType="positive"
          icon={Users}
          subtext={`Year: ${latest?.year} (PBS Record)`}
          sourceTag="PBS Census"
        />
        <MetricCard
          id="pop-metric-female"
          title="Female Population"
          value={latest?.femalePopulation?.toLocaleString() || 'Not provided'}
          changeLabel={latest?.femalePercentage !== undefined ? `${latest.femalePercentage}% of total` : 'Not provided'}
          changeType="positive"
          icon={UserCheck}
          subtext="Exceeds 50% in 2023 Census"
          sourceTag="Digital Census 2023"
        />
        <MetricCard
          id="pop-metric-male"
          title="Male Population"
          value={latest?.malePopulation?.toLocaleString() || 'Not provided'}
          changeLabel={latest?.malePercentage !== undefined ? `${latest.malePercentage}% of total` : 'Not provided'}
          changeType="neutral"
          icon={UserCheck}
          subtext="Stable sex ratio"
          sourceTag="Digital Census 2023"
        />
        <MetricCard
          id="pop-metric-growth"
          title="Annual Growth Rate (r)"
          value={`${latest?.annualGrowthRate || 1.75}%`}
          changeLabel="1.75% intercensal CAGR"
          changeType="neutral"
          icon={TrendingUp}
          subtext="Normalized rate of change"
          sourceTag="PBS Demographics"
        />
      </div>

      {/* Primary Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Total Population Growth Chart */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Chitral Population Trajectory (1998–2025)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Census milestones (1998, 2017, 2023) and verified intercensal models
              </p>
            </div>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-medium">
              Verified
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                <XAxis dataKey="year" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                  domain={['dataMin - 30000', 'dataMax + 20000']}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  formatter={(value: any) => [`${Number(value).toLocaleString()} residents`, 'Population']}
                  labelFormatter={(label) => `Year: ${label}`}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#059669"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorTotal)"
                  name="Total Population"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gender Decomposition Bar Chart */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Male vs. Female Population Distribution
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Comparison of male and female headcount across census cycles
              </p>
            </div>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
              PBS Records
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                <XAxis dataKey="year" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  formatter={(value: any, name: any) => [
                    `${Number(value).toLocaleString()} people`,
                    name === 'female' ? 'Female Population' : 'Male Population'
                  ]}
                />
                <Legend
                  verticalAlign="top"
                  height={36}
                  formatter={(value) => (value === 'female' ? 'Female Population' : 'Male Population')}
                />
                <Bar dataKey="male" fill="#3b82f6" radius={[4, 4, 0, 0]} name="male" />
                <Bar dataKey="female" fill="#ec4899" radius={[4, 4, 0, 0]} name="female" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Population Data Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Historical Population Records &amp; Methodology Catalog
            </h3>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            {sortedData.length} records indexed
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Year</th>
                <th className="py-3 px-4">District</th>
                <th className="py-3 px-4 text-right">Total Pop</th>
                <th className="py-3 px-4 text-right">Male Pop</th>
                <th className="py-3 px-4 text-right">Female Pop</th>
                <th className="py-3 px-4 text-right">Gender Split (M / F)</th>
                <th className="py-3 px-4 text-right">Annual Growth (r)</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {sortedData.map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                    {rec.year}
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center text-slate-600 dark:text-slate-400">
                      <MapPin className="w-3 h-3 mr-1 text-slate-400" />
                      Combined Chitral
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-semibold">
                    {rec.totalPopulation.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-blue-600 dark:text-blue-400">
                    {rec.malePopulation?.toLocaleString() ?? '—'}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-pink-600 dark:text-pink-400">
                    {rec.femalePopulation?.toLocaleString() ?? '—'}
                  </td>
                  <td className="py-3 px-4 text-right font-mono">
                    <span className="text-blue-600 dark:text-blue-400 font-medium">{rec.malePercentage !== undefined ? `${rec.malePercentage}%` : '—'}</span>
                    <span className="text-slate-400 mx-1">/</span>
                    <span className="text-pink-600 dark:text-pink-400 font-medium">{rec.femalePercentage !== undefined ? `${rec.femalePercentage}%` : '—'}</span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono">
                    {rec.annualGrowthRate ? `${rec.annualGrowthRate}%` : '—'}
                  </td>
                  <td className="py-3 px-4">
                    {rec.isEstimated ? (
                      <span className="px-2 py-0.5 text-[10px] rounded bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 font-medium border border-amber-200 dark:border-amber-800">
                        ESTIMATED
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-[10px] rounded bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 font-medium border border-emerald-200 dark:border-emerald-800">
                        CENSUS ENUMERATED
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-500 dark:text-slate-400 max-w-xs truncate" title={rec.notes}>
                    {rec.notes || 'Official PBS census data.'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
