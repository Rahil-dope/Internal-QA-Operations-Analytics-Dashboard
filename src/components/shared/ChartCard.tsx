import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  BarChart,
  Bar
} from 'recharts';
import { Loader2, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

interface ChartCardProps {
  title: string;
  description?: string;
  loading?: boolean;
  children: React.ReactNode;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  description,
  loading = false,
  children
}) => {
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  // Toggle body scroll lock when chart is fullscreen
  React.useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFullscreen]);

  const cardContent = (
    <Card className={cn(
      "w-full flex flex-col transition-all bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800",
      isFullscreen 
        ? "fixed inset-4 md:inset-10 z-50 shadow-2xl max-h-[90vh]" 
        : "relative"
    )}>
      <CardHeader className="pb-4 flex flex-row items-center justify-between space-y-0 border-b border-slate-100 dark:border-slate-800/60">
        <div className="pr-6">
          <CardTitle className="text-base font-semibold text-slate-800 dark:text-slate-100">{title}</CardTitle>
          {description && <CardDescription className="text-xs text-slate-450 dark:text-slate-400 mt-1">{description}</CardDescription>}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="w-8 h-8 rounded-full text-slate-450 hover:bg-slate-100 dark:hover:bg-slate-800"
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen View"}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </Button>
      </CardHeader>
      <CardContent className={cn("p-6 flex-grow flex flex-col", isFullscreen ? "h-full overflow-hidden" : "")}>
        {loading ? (
          <div className="flex h-[300px] items-center justify-center flex-grow">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
          </div>
        ) : (
          <div className={cn("w-full flex-grow", isFullscreen ? "h-full min-h-[400px]" : "h-[300px]")}>
            {children}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <>
      {isFullscreen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity" 
          onClick={() => setIsFullscreen(false)} 
        />
      )}
      {isFullscreen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {cardContent}
        </div>
      ) : (
        cardContent
      )}
    </>
  );
};

// Custom dark-mode friendly chart tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 dark:bg-slate-950/95 border border-slate-200 dark:border-slate-800 p-3 rounded-md shadow-xl text-xs text-slate-800 dark:text-slate-200 backdrop-blur-sm min-w-[120px]">
        <p className="font-bold border-b border-slate-100 dark:border-slate-850 pb-1.5 mb-1.5">{label}</p>
        <div className="space-y-1">
          {payload.map((pld: any) => (
            <div key={pld.dataKey} className="flex items-center justify-between gap-4 py-0.5">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: pld.color }} />
                <span className="text-slate-550 dark:text-slate-400">{pld.name}</span>
              </div>
              <strong className="font-semibold text-slate-900 dark:text-slate-50">{pld.value}</strong>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

// Reusable Trends Chart component using Area Chart
interface AreaTrendChartProps {
  title: string;
  description?: string;
  data: any[];
  xAxisKey: string;
  series: { key: string; name: string; color: string }[];
  loading?: boolean;
}

export const AreaTrendChart: React.FC<AreaTrendChartProps> = ({
  title,
  description,
  data,
  xAxisKey,
  series,
  loading = false
}) => {
  const hasData = data && data.length > 0;

  return (
    <ChartCard title={title} description={description} loading={loading}>
      {hasData ? (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 15, right: 15, left: -20, bottom: 5 }}>
            <defs>
              {series.map(s => (
                <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={s.color} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={s.color} stopOpacity={0.0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-slate-100 dark:stroke-slate-800" />
            <XAxis
              dataKey={xAxisKey}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10, fill: '#888888' }}
              dy={8}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10, fill: '#888888' }}
              dx={-4}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(148, 163, 184, 0.2)', strokeWidth: 1 }} />
            <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
            {series.map(s => (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.name}
                stroke={s.color}
                fillOpacity={1}
                fill={`url(#grad-${s.key})`}
                strokeWidth={2.5}
                activeDot={{ r: 5, strokeWidth: 0 }}
                animationDuration={600}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex h-full items-center justify-center text-xs text-slate-450 dark:text-slate-500">
          No data available for the selected filters
        </div>
      )}
    </ChartCard>
  );
};

// Reusable Bar Chart Component
interface SimpleBarChartProps {
  title: string;
  description?: string;
  data: any[];
  xAxisKey: string;
  yAxisKey: string;
  barColor?: string;
  loading?: boolean;
}

export const SimpleBarChart: React.FC<SimpleBarChartProps> = ({
  title,
  description,
  data,
  xAxisKey,
  yAxisKey,
  barColor = '#6366f1',
  loading = false
}) => {
  const hasData = data && data.length > 0;

  return (
    <ChartCard title={title} description={description} loading={loading}>
      {hasData ? (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 15, right: 15, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-slate-100 dark:stroke-slate-800" />
            <XAxis
              dataKey={xAxisKey}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10, fill: '#888888' }}
              dy={8}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10, fill: '#888888' }}
              dx={-4}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }} />
            <Bar 
              dataKey={yAxisKey} 
              fill={barColor} 
              radius={[4, 4, 0, 0]} 
              maxBarSize={40}
              animationDuration={600}
            />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex h-full items-center justify-center text-xs text-slate-450 dark:text-slate-500">
          No data available for the selected filters
        </div>
      )}
    </ChartCard>
  );
};
