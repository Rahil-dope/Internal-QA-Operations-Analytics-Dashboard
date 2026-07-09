import React from 'react';
import { CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface InsightAlert {
  type: 'success' | 'warning' | 'info';
  title: string;
  desc: string;
}

interface InsightItemProps {
  insight: InsightAlert;
}

export const InsightItem: React.FC<InsightItemProps> = ({ insight }) => {
  const getBadgeDetails = () => {
    switch (insight.type) {
      case 'warning':
        return {
          label: 'High Priority',
          bg: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30',
          icon: <AlertTriangle className="w-3 h-3 text-red-500 shrink-0" />
        };
      case 'success':
        return {
          label: 'Success',
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-250 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30',
          icon: <CheckCircle className="w-3 h-3 text-emerald-500 shrink-0" />
        };
      case 'info':
      default:
        return {
          label: 'Info',
          bg: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-800',
          icon: <Info className="w-3 h-3 text-indigo-500 dark:text-indigo-400 shrink-0" />
        };
    }
  };

  const badge = getBadgeDetails();

  return (
    <div className="flex flex-col gap-2 p-3.5 rounded-lg border border-slate-150 dark:border-slate-800/60 bg-slate-50/25 dark:bg-slate-900/20 text-xs">
      <div className="flex items-center justify-between gap-3">
        <span className="font-bold text-slate-850 dark:text-slate-200 tracking-tight leading-tight">{insight.title}</span>
        <span className={cn(
          "flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase border shrink-0",
          badge.bg
        )}>
          {badge.icon}
          {badge.label}
        </span>
      </div>
      <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-[11px]">
        {insight.desc}
      </p>
    </div>
  );
};
