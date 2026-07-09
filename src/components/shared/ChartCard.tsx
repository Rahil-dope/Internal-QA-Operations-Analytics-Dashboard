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
import { Loader2 } from 'lucide-react';

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
  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        {description && <CardDescription className="text-xs">{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex h-[300px] items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : (
          <div className="h-[300px] w-full">{children}</div>
        )}
      </CardContent>
    </Card>
  );
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
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              {series.map(s => (
                <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={s.color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={s.color} stopOpacity={0.0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-slate-200 dark:stroke-slate-800" />
            <XAxis
              dataKey={xAxisKey}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10, fill: '#888888' }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10, fill: '#888888' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '12px',
                color: '#000000',
              }}
              itemStyle={{ padding: '2px 0' }}
            />
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
                strokeWidth={2}
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
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-slate-200 dark:stroke-slate-800" />
            <XAxis
              dataKey={xAxisKey}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10, fill: '#888888' }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10, fill: '#888888' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '12px',
                color: '#000000',
              }}
            />
            <Bar dataKey={yAxisKey} fill={barColor} radius={[4, 4, 0, 0]} maxBarSize={40} />
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
