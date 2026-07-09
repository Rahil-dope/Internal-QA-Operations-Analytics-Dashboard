import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '../ui/card';
import { Copy, Check } from 'lucide-react';
import { cn } from '../../lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtext: string | React.ReactNode;
  icon: React.ReactNode;
  valueClassName?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtext,
  icon,
  valueClassName
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(String(value)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <Card 
      onClick={handleCopy}
      className="group relative cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-800 hover:shadow-md transition-all duration-200 active:scale-[0.98] select-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
      title="Click to copy metric value"
    >
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{title}</span>
        <div className="text-slate-400 group-hover:text-indigo-500 dark:group-hover:text-indigo-405 transition-colors">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className={cn("text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50", valueClassName)}>
            {value}
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center w-6 h-6 rounded bg-slate-50 dark:bg-slate-800 shrink-0">
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <Copy className="w-3 h-3 text-slate-400 hover:text-indigo-500" />
            )}
          </div>
        </div>
        <div className="flex items-center justify-between mt-1 min-h-[16px]">
          <div className="text-[10px] text-slate-450 dark:text-slate-400 truncate max-w-[80%]">
            {subtext}
          </div>
          {copied && (
            <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold animate-fade-in shrink-0">
              Copied!
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
