import React, { useMemo } from 'react';
import { useExcelData } from '../../context/ExcelDataContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { DataTable } from '../../components/shared/DataTable';
import { AreaTrendChart, SimpleBarChart } from '../../components/shared/ChartCard';
import { getEscalationsInsights } from '../../lib/insights/escalationsInsights';
import { MetricCard } from '../../components/shared/MetricCard';
import { InsightItem } from '../../components/shared/InsightItem';
import type { ColumnDef } from '@tanstack/react-table';
import { formatDate, formatPercent, cn } from '../../lib/utils';
import { 
  Share2, 
  UserX, 
  Cpu, 
  Layers, 
  ShieldAlert, 
  Zap,
  AlertTriangle
} from 'lucide-react';
import type { SMEscalation } from '../../types/data';

export const EscalationsDashboard: React.FC = () => {
  const { filteredEscalations, loading } = useExcelData();

  // 1. Insights
  const insights = useMemo(() => getEscalationsInsights(filteredEscalations), [filteredEscalations]);

  // 2. Summary stats
  const stats = useMemo(() => {
    const total = filteredEscalations.length;
    const agentCount = filteredEscalations.filter(d => d.acpt.toLowerCase() === 'agent').length;
    const techCount = filteredEscalations.filter(d => d.acpt.toLowerCase() === 'technology').length;
    const processCount = filteredEscalations.filter(d => d.acpt.toLowerCase() === 'process').length;
    const policyCount = filteredEscalations.filter(d => d.acpt.toLowerCase() === 'policy').length;
    
    return {
      total,
      agentCount,
      techCount,
      processCount,
      policyCount
    };
  }, [filteredEscalations]);

  // 3. Daily trends
  const trendData = useMemo(() => {
    const counts = filteredEscalations.reduce((acc, curr) => {
      const key = curr.date.toISOString().split('T')[0];
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => {
        const dObj = new Date(date);
        return {
          date: dObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }),
          'Escalations': count
        };
      });
  }, [filteredEscalations]);

  // 4. Hourly volume distribution (Peak times of day)
  const hourlyData = useMemo(() => {
    const counts = filteredEscalations.reduce((acc, curr) => {
      const hr = curr.hour;
      acc[hr] = (acc[hr] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    // Create complete 24h spectrum
    const list = [];
    for (let hr = 0; hr < 24; hr++) {
      const count = counts[hr] || 0;
      // Format hour string e.g. "08:00"
      const label = `${hr.toString().padStart(2, '0')}:00`;
      list.push({
        hour: label,
        'Ticket Count': count
      });
    }
    return list;
  }, [filteredEscalations]);

  // 5. Top complaint reasons (L3 reasons)
  const reasonChartData = useMemo(() => {
    const counts = filteredEscalations.reduce((acc, curr) => {
      const r = curr.l3Reason || 'Other';
      acc[r] = (acc[r] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [filteredEscalations]);

  // 6. Source channel breakdown
  const sourceBreakdown = useMemo(() => {
    const counts = filteredEscalations.reduce((acc, curr) => {
      const src = curr.source || 'Other';
      acc[src] = (acc[src] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const list = Object.entries(counts).map(([name, count]) => ({
      name,
      count,
      pct: filteredEscalations.length > 0 ? count / filteredEscalations.length : 0
    }));

    return list.sort((a, b) => b.count - a.count);
  }, [filteredEscalations]);

  // 7. Table Columns
  const columns = useMemo<ColumnDef<SMEscalation>[]>(() => [
    {
      accessorKey: 'ticketId',
      header: 'Ticket ID',
      cell: info => <span className="font-medium font-mono">{info.getValue() as string}</span>
    },
    {
      accessorKey: 'date',
      header: 'Date',
      cell: info => formatDate(info.getValue() as Date)
    },
    {
      accessorKey: 'assignedAdvisor',
      header: 'Assigned QA'
    },
    {
      accessorKey: 'source',
      header: 'Source'
    },
    {
      accessorKey: 'agentName',
      header: 'Agent Name',
      cell: info => <span className="font-semibold">{info.getValue() as string}</span>
    },
    {
      accessorKey: 'store',
      header: 'Store Location'
    },
    {
      accessorKey: 'acpt',
      header: 'ACPT Owner',
      cell: info => {
        const val = String(info.getValue() || '');
        return (
          <span className={cn(
            "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
            val.toLowerCase() === 'agent' 
              ? "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400" 
              : val.toLowerCase() === 'process'
              ? "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400"
              : val.toLowerCase() === 'policy'
              ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400"
              : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400"
          )}>
            {val}
          </span>
        );
      }
    },
    {
      accessorKey: 'l3Reason',
      header: 'L3 Reason',
      cell: info => (
        <span className="font-medium text-red-650 dark:text-red-400">
          {info.getValue() as string}
        </span>
      )
    },
    {
      accessorKey: 'refundDeny',
      header: 'Refund Denied?',
      cell: info => (
        <span className={cn(
          "px-1 text-[10px] font-semibold uppercase",
          String(info.getValue() || '').toLowerCase() === 'yes' ? "text-red-500" : "text-slate-400"
        )}>
          {String(info.getValue() || '')}
        </span>
      )
    }
  ], []);

  if (!loading && filteredEscalations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 border rounded-lg h-64 text-center">
        <AlertTriangle className="w-8 h-8 text-amber-500 mb-2" />
        <h3 className="font-semibold">No Matching SM Escalations</h3>
        <p className="text-xs text-slate-550 dark:text-slate-400 mt-1 max-w-sm">
          No social media tickets match the current filters. Modify filters in the top toolbar to see data.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5 animate-fade-in">
        <MetricCard
          title="Total Escalations"
          value={stats.total}
          subtext="Logged tickets"
          icon={<Share2 className="w-4 h-4 text-slate-400" />}
        />
        <MetricCard
          title="Agent Accountable"
          value={stats.agentCount}
          subtext={`${stats.total > 0 ? ((stats.agentCount / stats.total) * 100).toFixed(0) : 0}% agent error rate`}
          icon={<UserX className="w-4 h-4 text-red-500" />}
        />
        <MetricCard
          title="Technology Error"
          value={stats.techCount}
          subtext="App & server errors"
          icon={<Cpu className="w-4 h-4 text-indigo-500" />}
        />
        <MetricCard
          title="Process Deficiencies"
          value={stats.processCount}
          subtext="SOP alignment gaps"
          icon={<Layers className="w-4 h-4 text-amber-500" />}
        />
        <MetricCard
          title="Policy Constraints"
          value={stats.policyCount}
          subtext="Refund deny SOP limits"
          icon={<ShieldAlert className="w-4 h-4 text-slate-650" />}
        />
      </div>

      {/* 2. Trends & Insights */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Trend Area */}
        <div className="lg:col-span-2">
          <AreaTrendChart
            title="SM Escalation Trends"
            description="Daily count of customer complaints escalated through social media channels"
            data={trendData}
            xAxisKey="date"
            series={[{ key: 'Escalations', name: 'Escalations Count', color: '#6366f1' }]}
            loading={loading}
          />
        </div>

        {/* Dynamic Insights Panel */}
        <Card className="h-full flex flex-col">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-indigo-500" /> SM Escalation Insights
            </CardTitle>
            <CardDescription className="text-xs">Dynamic analysis of filtered social media complaints</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow space-y-3 p-4 overflow-y-auto max-h-[320px]">
            {insights.map((item, index) => (
              <InsightItem key={index} insight={item} />
            ))}
          </CardContent>
        </Card>
      </div>

      {/* 3. Hourly Peaks & Source Split */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Hourly distribution */}
        <SimpleBarChart
          title="Hourly Escalations Peak"
          description="Ticket volume distribution by hour of day (0:00 - 23:00)"
          data={hourlyData}
          xAxisKey="hour"
          yAxisKey="Ticket Count"
          barColor="#6366f1"
          loading={loading}
        />

        {/* Source Channels */}
        <Card className="h-full flex flex-col">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Channel Volume Breakdown</CardTitle>
            <CardDescription className="text-xs">Distribution of escalations by social platform</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow p-4 space-y-3.5">
            {sourceBreakdown.map(item => (
              <div key={item.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="truncate pr-4">{item.name}</span>
                  <span className="shrink-0 text-slate-500">{item.count} tickets ({formatPercent(item.pct, 0)})</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-indigo-500 h-full rounded-full" 
                    style={{ width: `${item.pct * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* 4. Top reasons bar chart */}
      <div className="grid grid-cols-1">
        <SimpleBarChart
          title="Top 10 Escalation Root Causes (L3 Reasons)"
          description="Frequencies of specific customer complaints logged on social media"
          data={reasonChartData}
          xAxisKey="name"
          yAxisKey="value"
          barColor="#ef4444"
          loading={loading}
        />
      </div>

      {/* 5. Logs Grid */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-base font-semibold">SM Escalations Logs</CardTitle>
          <CardDescription className="text-xs">Filter and export raw social media escalation tickets</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <DataTable
            columns={columns}
            data={filteredEscalations}
            searchColumn="agentName"
            searchPlaceholder="Filter by agent..."
            exportFilename="social_media_escalations.csv"
          />
        </CardContent>
      </Card>
    </div>
  );
};
