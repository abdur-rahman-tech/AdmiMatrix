import React from 'react';

export const ShimmerBar: React.FC<{ className?: string }> = ({ className = 'h-4 w-full' }) => (
  <div
    className={`relative overflow-hidden rounded bg-slate-200 dark:bg-slate-800/80 ${className}`}
  >
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 dark:via-white/10 to-transparent" />
  </div>
);

export const CardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 shadow-xs space-y-3.5 ${className}`}
  >
    <div className="flex items-center justify-between">
      <ShimmerBar className="h-5 w-1/3" />
      <ShimmerBar className="h-4 w-16 rounded-full" />
    </div>
    <ShimmerBar className="h-3 w-4/5" />
    <div className="pt-2 space-y-2">
      <ShimmerBar className="h-10 w-full rounded-xl" />
      <ShimmerBar className="h-10 w-full rounded-xl" />
    </div>
  </div>
);

export const ChartSkeleton: React.FC<{ className?: string; height?: string }> = ({
  className = '',
  height = 'h-72'
}) => (
  <div
    className={`p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 shadow-xs space-y-4 ${className}`}
  >
    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
      <div className="space-y-1.5 w-1/3">
        <ShimmerBar className="h-5 w-full" />
        <ShimmerBar className="h-3 w-2/3" />
      </div>
      <div className="flex space-x-2">
        <ShimmerBar className="h-7 w-20 rounded-lg" />
        <ShimmerBar className="h-7 w-20 rounded-lg" />
      </div>
    </div>
    {/* Chart bars simulation */}
    <div className={`w-full ${height} flex items-end justify-between gap-3 pt-4 px-2`}>
      {[45, 60, 52, 78, 65, 85, 70, 95, 80, 100].map((h, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
          <div
            style={{ height: `${h}%` }}
            className="w-full rounded-t-md bg-slate-200 dark:bg-slate-800 relative overflow-hidden"
          >
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 dark:via-white/10 to-transparent" />
          </div>
          <ShimmerBar className="h-2 w-6" />
        </div>
      ))}
    </div>
  </div>
);

export const AiBriefingSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    className={`p-6 rounded-2xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-900/50 shadow-sm space-y-4 ${className}`}
  >
    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
      <div className="flex items-center space-x-2">
        <div className="w-5 h-5 rounded-full bg-purple-200 dark:bg-purple-900 animate-pulse" />
        <ShimmerBar className="h-4 w-44" />
      </div>
      <div className="flex space-x-2">
        <ShimmerBar className="h-5 w-24 rounded-full" />
        <ShimmerBar className="h-5 w-16 rounded-full" />
      </div>
    </div>

    <div className="space-y-2">
      <ShimmerBar className="h-4 w-full" />
      <ShimmerBar className="h-4 w-5/6" />
      <ShimmerBar className="h-4 w-4/6" />
    </div>

    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 space-y-2">
      <ShimmerBar className="h-3 w-32" />
      <ShimmerBar className="h-3 w-full" />
      <ShimmerBar className="h-3 w-3/4" />
    </div>

    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
      <ShimmerBar className="h-12 w-full rounded-lg" />
      <ShimmerBar className="h-12 w-full rounded-lg" />
      <ShimmerBar className="h-12 w-full rounded-lg" />
      <ShimmerBar className="h-12 w-full rounded-lg" />
    </div>
  </div>
);

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="rounded-2xl border border-slate-200 dark:border-slate-800/80 overflow-hidden bg-white dark:bg-slate-900">
    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex justify-between">
      <ShimmerBar className="h-4 w-32" />
      <ShimmerBar className="h-4 w-24" />
    </div>
    <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="p-4 flex items-center justify-between gap-4">
          <ShimmerBar className="h-4 w-1/4" />
          <ShimmerBar className="h-4 w-1/6" />
          <ShimmerBar className="h-4 w-1/6" />
          <ShimmerBar className="h-4 w-1/5" />
        </div>
      ))}
    </div>
  </div>
);
