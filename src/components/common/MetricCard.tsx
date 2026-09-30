import React from 'react';
import { LucideIcon, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface MetricCardProps {
  id?: string;
  title: string;
  value: string | number;
  changeLabel?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  subtext?: string;
  sourceTag?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  id,
  title,
  value,
  changeLabel,
  changeType = 'neutral',
  icon: Icon,
  subtext,
  sourceTag
}) => {
  const getChangeStyle = () => {
    switch (changeType) {
      case 'positive':
        return 'text-emerald-600 dark:text-emerald-400 font-semibold';
      case 'negative':
        return 'text-rose-600 dark:text-rose-400 font-semibold';
      default:
        return 'text-slate-600 dark:text-slate-400 font-medium';
    }
  };

  const ChangeIcon = () => {
    switch (changeType) {
      case 'positive':
        return <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 inline shrink-0" />;
      case 'negative':
        return <ArrowDownRight className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 inline shrink-0" />;
      default:
        return <Minus className="w-3 h-3 text-slate-400 inline shrink-0" />;
    }
  };

  return (
    <div
      id={id}
      className="group cursor-default bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs transition-all duration-200 ease-out hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {title}
          </p>
          <p className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mt-1 font-mono tabular-nums">
            {value}
          </p>
        </div>
        <div className="p-2.5 rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 transition-colors group-hover:bg-purple-100 group-hover:text-purple-700 dark:group-hover:bg-purple-950/80 dark:group-hover:text-purple-300">
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
        {changeLabel ? (
          <div className="flex items-center gap-1">
            <ChangeIcon />
            <span className={getChangeStyle()}>{changeLabel}</span>
          </div>
        ) : (
          <span className="text-slate-500 dark:text-slate-400">{subtext || 'Recorded index'}</span>
        )}

        {sourceTag && (
          <span
            className="text-[11px] text-slate-400 dark:text-slate-500 font-mono tracking-wide"
            title={`Data Source: ${sourceTag}`}
          >
            {sourceTag}
          </span>
        )}
      </div>
    </div>
  );
};
