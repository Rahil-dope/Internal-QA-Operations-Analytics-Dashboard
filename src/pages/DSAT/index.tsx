import React, { useMemo, useState } from 'react';
import { useExcelData } from '../../context/ExcelDataContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { DataTable } from '../../components/shared/DataTable';
import { AreaTrendChart, SimpleBarChart } from '../../components/shared/ChartCard';
import { getDsatInsights } from '../../lib/insights/dsatInsights';
import { Input } from '../../components/ui/input';
import { ColumnDef } from '@tanstack/react-table';
import { formatDate, formatPercent } from '../../lib/utils';
import { 
  FileWarning, 
  UserX, 
  HelpCircle, 
  AlertTriangle, 
  ClipboardList,
  Search,
  Zap
} from 'lucide-react';
import type { DSATAudit } from '../../types/data';

export const DsatDashboard: React.FC = () => {
  const { filteredDsat, loading } = useExcelData();
  const [subCategorySearch, setSubCategorySearch] = useState('');

  // 1. Insights
  const insights = useMemo(() => getDsatInsights(filteredDsat), [filteredDsat]);

  // 2. Summary stats
  const stats = useMemo(() => {
    const total = filteredDsat.length;
    const agentCount = filteredDsat.filter(d => d.acpt.toLowerCase() === 'agent').length;
    const customerCount = filteredDsat.filter(d => d.acpt.toLowerCase() === 'customer').length;
    const processCount = filteredDsat.filter(d => d.acpt.toLowerCase() === 'process').length;
    const policyCount = filteredDsat.filter(d => d.acpt.toLowerCase() === 'policy').length;
    
    return {
      total,
      agentCount,
      customerCount,
      processCount,
      policyCount,
      agentErrorRate: total > 0 ? agentCount / total : 0
    };
  }, [filteredDsat]);

  // 3. Daily trends
  const trendData = useMemo(() => {
    const counts = filteredDsat.reduce((acc, curr) => {
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
          'DSAT Count': count
        };
      });
  }, [filteredDsat]);

  // 4. Categories bar chart data
  const categoryChartData = useMemo(() => {
    const counts = filteredDsat.reduce((acc, curr) => {
      const cat = curr.issueCategory || 'Uncategorized';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredDsat]);

  // 5. Searchable sub-categories tag list / frequency bars
  const subCategoryFrequencies = useMemo(() => {
    const counts = filteredDsat.reduce((acc, curr) => {
      const sub = curr.issueSubCategory || 'Uncategorized';
      acc[sub] = (acc[sub] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const list = Object.entries(counts).map(([name, count]) => ({
      name,
      count,
      pct: filteredDsat.length > 0 ? count / filteredDsat.length : 0
    }));

    return list.sort((a, b) => b.count - a.count);
  }, [filteredDsat]);

  // Filtered sub-categories based on search
  const filteredSubCategories = useMemo(() => {
    return subCategoryFrequencies.filter(item => 
      item.name.toLowerCase().includes(subCategorySearch.toLowerCase())
    );
  }, [subCategoryFrequencies, subCategorySearch]);

  // 6. Table Columns configuration
  const columns = useMemo<ColumnDef<DSATAudit>[]>(() => [
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
      accessorKey: 'agentName',
      header: 'Agent',
      cell: info => <span className="font-semibold">{info.getValue() as string}</span>
    },
    {
      accessorKey: 'teamLeader',
      header: 'TL / Supervisor'
    },
    {
      accessorKey: 'issueCategory',
      header: 'Category'
    },
    {
      accessorKey: 'issueSubCategory',
      header: 'Sub-Category'
    },
    {
      accessorKey: 'acpt',
      header: 'ACPT',
      cell: info => {
        const val = String(info.getValue() || '');
        return (
          <span className={cn(
            "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
            val.toLowerCase() === 'agent' 
              ? "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400" 
              : val.toLowerCase() === 'customer'
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400"
              : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400"
          )}>
            {val}
          </span>
        );
      }
    },
    {
      accessorKey: 'observations',
      header: 'Observations',
      cell: info => (
        <div className="max-w-[280px] truncate" title={info.getValue() as string}>
          {info.getValue() as string}
        </div>
      )
    }
  ], []);

  // Handle empty datasets
  if (!loading && filteredDsat.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 border rounded-lg h-64 text-center">
        <AlertTriangle className="w-8 h-8 text-amber-500 mb-2" />
        <h3 className="font-semibold">No Matching DSAT Records</h3>
        <p className="text-xs text-slate-550 dark:text-slate-400 mt-1 max-w-sm">
          No DSAT audits match the current filters. Modify the date range, agent select, or search query in the top toolbar to see data.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Summary Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="flex flex-col justify-between">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total DSAT Audits</span>
            <FileWarning className="w-4 h-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-[10px] text-slate-450 mt-1">Evaluated audit failures</p>
          </CardContent>
        </Card>

        <Card className="flex flex-col justify-between">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Agent Accountable</span>
            <UserX className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.agentCount}</div>
            <p className="text-[10px] text-red-500 font-semibold mt-1">
              {formatPercent(stats.agentErrorRate)} error rate
            </p>
          </CardContent>
        </Card>

        <Card className="flex flex-col justify-between">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Process Accountable</span>
            <ClipboardList className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.processCount}</div>
            <p className="text-[10px] text-slate-450 mt-1">Operational bottlenecks</p>
          </CardContent>
        </Card>

        <Card className="flex flex-col justify-between">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Customer Accountability</span>
            <HelpCircle className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.customerCount}</div>
            <p className="text-[10px] text-slate-450 mt-1">Expectation mismatch failures</p>
          </CardContent>
        </Card>

        <Card className="flex flex-col justify-between">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Policy Constraints</span>
            <HelpCircle className="w-4 h-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.policyCount}</div>
            <p className="text-[10px] text-slate-450 mt-1">SOP policy constraints</p>
          </CardContent>
        </Card>
      </div>

      {/* 2. Charts & Insights Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Trend Area Chart */}
        <div className="lg:col-span-2">
          <AreaTrendChart
            title="DSAT Volume Trend"
            description="Daily count of DSAT failures logged during quality evaluations"
            data={trendData}
            xAxisKey="date"
            series={[{ key: 'DSAT Count', name: 'Failures', color: '#ef4444' }]}
            loading={loading}
          />
        </div>

        {/* Dynamic Insights Panel */}
        <Card className="h-full flex flex-col">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-indigo-500" /> DSAT Quality Insights
            </CardTitle>
            <CardDescription className="text-xs">Dynamic analysis of filtered audit records</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 space-y-4">
            {insights.map((item, idx) => (
              <div key={idx} className="flex gap-2.5 p-3 rounded-lg border text-xs bg-slate-50/40 dark:bg-slate-900/50">
                <div className="shrink-0 mt-0.5">
                  {item.type === 'warning' ? (
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                  ) : (
                    <HelpCircle className="w-4 h-4 text-indigo-500" />
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

      {/* 3. Reason Analysis Section */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Reason Bar Chart */}
        <SimpleBarChart
          title="Top DSAT Categories"
          description="Frequencies of major issue categories"
          data={categoryChartData}
          xAxisKey="name"
          yAxisKey="value"
          barColor="#ef4444"
          loading={loading}
        />

        {/* Searchable Sub-Categories Cloud Replacement */}
        <Card className="h-full flex flex-col">
          <CardHeader className="pb-2 border-b">
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base font-semibold">Sub-Category Breakdown</CardTitle>
                <CardDescription className="text-xs">Frequency ranking of detailed failure causes</CardDescription>
              </div>
              <div className="relative w-48 shrink-0">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <Input
                  placeholder="Filter reasons..."
                  value={subCategorySearch}
                  onChange={e => setSubCategorySearch(e.target.value)}
                  className="pl-8 h-8 text-xs"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto max-h-[300px] p-4 space-y-3.5">
            {filteredSubCategories.map(item => (
              <div key={item.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="truncate pr-4">{item.name}</span>
                  <span className="shrink-0 text-slate-500">{item.count} audits ({formatPercent(item.pct, 0)})</span>
                </div>
                {/* Horizontal bar representing frequency */}
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-indigo-500 h-full rounded-full" 
                    style={{ width: `${item.pct * 100}%` }}
                  />
                </div>
              </div>
            ))}
            {filteredSubCategories.length === 0 && (
              <div className="text-xs text-slate-400 text-center py-10">No matching sub-categories found</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 4. Detailed Logs Data Table */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-base font-semibold">DSAT Audit Logs</CardTitle>
          <CardDescription className="text-xs">Filter and export raw quality auditing evaluations</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <DataTable
            columns={columns}
            data={filteredDsat}
            searchColumn="agentName"
            searchPlaceholder="Filter by agent..."
            exportFilename="dsat_audits_report.csv"
          />
        </CardContent>
      </Card>
    </div>
  );
};
