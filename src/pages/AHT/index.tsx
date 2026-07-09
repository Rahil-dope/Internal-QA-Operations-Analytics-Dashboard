import React, { useMemo } from 'react';
import { useExcelData } from '../../context/ExcelDataContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { DataTable } from '../../components/shared/DataTable';
import { AreaTrendChart, SimpleBarChart } from '../../components/shared/ChartCard';
import { getAhtInsights } from '../../lib/insights/ahtInsights';
import type { ColumnDef } from '@tanstack/react-table';
import { formatDate } from '../../lib/utils';
import { 
  Clock, 
  UserX, 
  HelpCircle, 
  AlertTriangle, 
  Layers,
  Zap,
  PhoneCall
} from 'lucide-react';
import { cn } from '../../lib/utils';
import type { AHTAudit } from '../../types/data';

export const AhtDashboard: React.FC = () => {
  const { filteredAht, loading } = useExcelData();

  // 1. Insights
  const insights = useMemo(() => getAhtInsights(filteredAht), [filteredAht]);

  // 2. Summary stats
  const stats = useMemo(() => {
    const total = filteredAht.length;
    const agentCount = filteredAht.filter(d => d.acpt.toLowerCase() === 'agent error').length;
    const processCount = filteredAht.filter(d => d.acpt.toLowerCase() === 'process error').length;
    const customerCount = filteredAht.filter(d => d.acpt.toLowerCase() === 'customer error').length;
    const callingRequired = filteredAht.filter(d => d.wasCallingRequired.toLowerCase() === 'yes').length;
    const callingCompleted = filteredAht.filter(d => d.wasCallingRequired.toLowerCase() === 'yes' && d.didAgentOutcall.toLowerCase() === 'yes').length;
    
    return {
      total,
      agentCount,
      processCount,
      customerCount,
      callingRequired,
      callingCompleted,
      callingRate: callingRequired > 0 ? callingCompleted / callingRequired : 0
    };
  }, [filteredAht]);

  // 3. Daily trends
  const trendData = useMemo(() => {
    const counts = filteredAht.reduce((acc, curr) => {
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
          'AHT Audits': count
        };
      });
  }, [filteredAht]);

  // 4. AHT Score / Value distribution (count of occurrences for each AHT value)
  const distributionData = useMemo(() => {
    const counts = filteredAht.reduce((acc, curr) => {
      const val = curr.aht;
      acc[val] = (acc[val] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    return Object.entries(counts)
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([ahtVal, count]) => ({
        name: `AHT Score: ${ahtVal}`,
        'Audit Count': count
      }));
  }, [filteredAht]);

  // 5. High AHT drivers bar chart
  const driverChartData = useMemo(() => {
    const counts = filteredAht.reduce((acc, curr) => {
      const reason = curr.exactReason || 'Other';
      acc[reason] = (acc[reason] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredAht]);

  // 6. Category (Theme) breakdown
  const themeBreakdown = useMemo(() => {
    const counts = filteredAht.reduce((acc, curr) => {
      const theme = curr.theme || 'Uncategorized';
      acc[theme] = (acc[theme] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const list = Object.entries(counts).map(([name, count]) => ({
      name: name.split('*(-Sub-)*')[0], // Trim subcategory tags for cleaner displays
      count,
      pct: filteredAht.length > 0 ? count / filteredAht.length : 0
    }));

    return list.sort((a, b) => b.count - a.count).slice(0, 5);
  }, [filteredAht]);

  // 7. Table Columns
  const columns = useMemo<ColumnDef<AHTAudit>[]>(() => [
    {
      accessorKey: 'ticketId',
      header: 'Ticket ID',
      cell: info => <span className="font-medium font-mono">{info.getValue() as string}</span>
    },
    {
      accessorKey: 'date',
      header: 'Audit Date',
      cell: info => formatDate(info.getValue() as Date)
    },
    {
      accessorKey: 'agentEmail',
      header: 'Agent Email',
      cell: info => <span className="font-semibold">{String(info.getValue() || '').split('@')[0]}</span>
    },
    {
      accessorKey: 'queueName',
      header: 'Queue'
    },
    {
      accessorKey: 'wasCallingRequired',
      header: 'Call Req?',
      cell: info => (
        <span className={cn(
          "px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase",
          String(info.getValue() || '').toLowerCase() === 'yes' 
            ? "bg-amber-50 text-amber-700 dark:bg-amber-950/20" 
            : "bg-slate-100 text-slate-700 dark:bg-slate-800"
        )}>
          {String(info.getValue() || '')}
        </span>
      )
    },
    {
      accessorKey: 'didAgentOutcall',
      header: 'Outcalled?',
      cell: info => (
        <span className={cn(
          "px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase",
          String(info.getValue() || '').toLowerCase() === 'yes' 
            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20" 
            : "bg-red-50 text-red-700 dark:bg-red-950/20"
        )}>
          {String(info.getValue() || '')}
        </span>
      )
    },
    {
      accessorKey: 'acpt',
      header: 'ACPT Error Category',
      cell: info => {
        const val = String(info.getValue() || '');
        return (
          <span className={cn(
            "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
            val.toLowerCase() === 'agent error' 
              ? "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400" 
              : val.toLowerCase() === 'process error'
              ? "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400"
              : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400"
          )}>
            {val}
          </span>
        );
      }
    },
    {
      accessorKey: 'exactReason',
      header: 'AHT Driver Reason',
      cell: info => (
        <div className="max-w-[200px] truncate" title={info.getValue() as string}>
          {info.getValue() as string}
        </div>
      )
    },
    {
      accessorKey: 'processSuggestion',
      header: 'Coaching Suggestion',
      cell: info => (
        <div className="max-w-[200px] truncate" title={info.getValue() as string}>
          {info.getValue() as string}
        </div>
      )
    }
  ], []);

  if (!loading && filteredAht.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 border rounded-lg h-64 text-center">
        <AlertTriangle className="w-8 h-8 text-amber-500 mb-2" />
        <h3 className="font-semibold">No Matching AHT Records</h3>
        <p className="text-xs text-slate-550 dark:text-slate-400 mt-1 max-w-sm">
          No AHT audits match the current filters. Modify filters in the top toolbar to see data.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="flex flex-col justify-between">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total AHT Audits</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-[10px] text-slate-450 mt-1">Conducted audits</p>
          </CardContent>
        </Card>

        <Card className="flex flex-col justify-between">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Agent Error</span>
            <UserX className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.agentCount}</div>
            <p className="text-[10px] text-red-500 font-semibold mt-1">
              {stats.total > 0 ? ((stats.agentCount / stats.total) * 100).toFixed(0) : 0}% team share
            </p>
          </CardContent>
        </Card>

        <Card className="flex flex-col justify-between">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Process Error</span>
            <Layers className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.processCount}</div>
            <p className="text-[10px] text-slate-450 mt-1">SOP & systems bottlenecks</p>
          </CardContent>
        </Card>

        <Card className="flex flex-col justify-between">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Customer Error</span>
            <HelpCircle className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.customerCount}</div>
            <p className="text-[10px] text-slate-450 mt-1">Customer-driven delay triggers</p>
          </CardContent>
        </Card>

        <Card className="flex flex-col justify-between">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Outcall Compliance</span>
            <PhoneCall className="w-4 h-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{((stats.callingRate) * 100).toFixed(0)}%</div>
            <p className="text-[10px] text-slate-450 mt-1">
              {stats.callingCompleted} of {stats.callingRequired} required outcalls
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 2. Trends & Insights */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Trend Area */}
        <div className="lg:col-span-2">
          <AreaTrendChart
            title="AHT Audits Activity"
            description="Daily count of AHT quality audits completed"
            data={trendData}
            xAxisKey="date"
            series={[{ key: 'AHT Audits', name: 'Audits Completed', color: '#f59e0b' }]}
            loading={loading}
          />
        </div>

        {/* Dynamic Insights Panel */}
        <Card className="h-full flex flex-col">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-500" /> AHT Bottleneck Insights
            </CardTitle>
            <CardDescription className="text-xs">Dynamic operational summaries for coaching</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 space-y-4">
            {insights.map((item, idx) => (
              <div key={idx} className="flex gap-2.5 p-3 rounded-lg border text-xs bg-slate-50/40 dark:bg-slate-900/50">
                <div className="shrink-0 mt-0.5">
                  {item.type === 'warning' ? (
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                  ) : (
                    <Clock className="w-4 h-4 text-amber-500" />
                  )}
                </div>
                <div>
                  <div className="font-semibold text-slate-850 dark:text-slate-200">{item.title}</div>
                  <div className="text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{item.desc}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* 3. High AHT drivers */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <SimpleBarChart
          title="High AHT Reasons"
          description="Frequencies of specific root causes behind long handling times"
          data={driverChartData}
          xAxisKey="name"
          yAxisKey="value"
          barColor="#f59e0b"
          loading={loading}
        />

        {/* Theme Category Lists */}
        <Card className="h-full flex flex-col">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Issue Theme Breakdown</CardTitle>
            <CardDescription className="text-xs">Audit frequencies by high-level customer issues</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow p-4 space-y-3.5">
            {themeBreakdown.map(item => (
              <div key={item.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="truncate pr-4">{item.name}</span>
                  <span className="shrink-0 text-slate-500">{item.count} audits</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-amber-500 h-full rounded-full" 
                    style={{ width: `${item.pct * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* 4. Score Distribution Bar Chart */}
      <div className="grid grid-cols-1">
        <SimpleBarChart
          title="AHT Audit Score Distribution"
          description="Histogram showing frequency of different logged AHT score values"
          data={distributionData}
          xAxisKey="name"
          yAxisKey="Audit Count"
          barColor="#6366f1"
          loading={loading}
        />
      </div>

      {/* 5. Logs Grid */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-base font-semibold">AHT Audit Logs</CardTitle>
          <CardDescription className="text-xs">Export and filter detailed auditing parameters</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <DataTable
            columns={columns}
            data={filteredAht}
            searchColumn="agentEmail"
            searchPlaceholder="Filter by agent..."
            exportFilename="aht_audits_report.csv"
          />
        </CardContent>
      </Card>
    </div>
  );
};
