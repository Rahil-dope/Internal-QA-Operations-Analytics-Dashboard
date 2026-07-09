import React, { useMemo } from 'react';
import { useExcelData } from '../../context/ExcelDataContext';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { DataTable } from '../../components/shared/DataTable';
import { AreaTrendChart } from '../../components/shared/ChartCard';
import { getShrinkageInsights } from '../../lib/insights/shrinkageInsights';
import { MetricCard } from '../../components/shared/MetricCard';
import { InsightItem } from '../../components/shared/InsightItem';
import type { ColumnDef } from '@tanstack/react-table';
import { formatDate, formatPercent, formatDuration, cn } from '../../lib/utils';
import { 
  UserCheck, 
  UserX, 
  Calendar, 
  AlertTriangle, 
  Clock,
  Zap,
  Database
} from 'lucide-react';
import type { ShrinkageRecord } from '../../types/data';

export const ShrinkageDashboard: React.FC = () => {
  const { filteredShrinkage, loading, dataset } = useExcelData();

  if (!loading && !dataset) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg min-h-[300px] text-center max-w-md mx-auto my-12 shadow-sm animate-fade-in select-none">
        <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-950 flex items-center justify-center mb-4">
          <Database className="w-5 h-5 text-slate-400" />
        </div>
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-50">No data available</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
          There is no operations data loaded. Upload an Excel workbook to unlock dashboard analytics.
        </p>
        <div className="mt-5">
          <Link 
            to="/upload" 
            className="inline-flex items-center justify-center rounded-md text-xs font-semibold px-4 h-9 bg-indigo-650 hover:bg-indigo-755 text-white transition-colors"
          >
            Upload Workbook
          </Link>
        </div>
      </div>
    );
  }

  // 1. Insights
  const insights = useMemo(() => getShrinkageInsights(filteredShrinkage), [filteredShrinkage]);

  // 2. Summary stats
  const stats = useMemo(() => {
    const total = filteredShrinkage.length;
    const rostered = filteredShrinkage.filter(s => s.attendance !== 'WOFF' && s.attendance !== 'WO');
    const rosteredCount = rostered.length;
    const presentCount = rostered.filter(s => s.attendance === 'P').length;
    const halfDayCount = rostered.filter(s => s.attendance === 'HD').length;
    const absentCount = rostered.filter(s => s.attendance === 'A').length;
    const leaveCount = rostered.filter(s => s.attendance === 'PL').length;
    const offCount = filteredShrinkage.filter(s => s.attendance === 'WOFF' || s.attendance === 'WO').length;

    const presentSum = presentCount + (halfDayCount * 0.5);
    const attendanceRate = rosteredCount > 0 ? presentSum / rosteredCount : 0;
    
    // Total deficit hours
    const totalActualSecs = filteredShrinkage.reduce((sum, r) => sum + r.actualLoginHrs, 0);
    const totalTargetSecs = filteredShrinkage.reduce((sum, r) => sum + r.targetLoginHrs, 0);
    const deficitSecs = Math.max(0, totalTargetSecs - totalActualSecs);

    return {
      total,
      rosteredCount,
      presentCount,
      halfDayCount,
      absentCount,
      leaveCount,
      offCount,
      attendanceRate,
      deficitSecs,
      actualLoginHrs: totalActualSecs
    };
  }, [filteredShrinkage]);

  // 3. Daily trends
  const trendData = useMemo(() => {
    // Group roster counts and present counts by date
    const dateMap = new Map<string, { rostered: number; present: number }>();

    filteredShrinkage.forEach(item => {
      const key = item.date.toISOString().split('T')[0];
      const isOff = item.attendance === 'WOFF' || item.attendance === 'WO';
      
      const current = dateMap.get(key) || { rostered: 0, present: 0 };
      if (!isOff) {
        current.rostered += 1;
        if (item.attendance === 'P') current.present += 1;
        if (item.attendance === 'HD') current.present += 0.5;
      }
      dateMap.set(key, current);
    });

    return Array.from(dateMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, val]) => {
        const dObj = new Date(date);
        const rate = val.rostered > 0 ? val.present / val.rostered : 0;
        return {
          date: dObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }),
          'Attendance %': Math.round(rate * 100)
        };
      });
  }, [filteredShrinkage]);

  // 4. Roster Heatmap Grid Calculations
  const heatmapData = useMemo(() => {
    if (filteredShrinkage.length === 0) return { dates: [], grid: [] };

    // Get unique list of dates in ascending order
    const datesSet = new Set<string>();
    filteredShrinkage.forEach(s => datesSet.add(s.date.toISOString().split('T')[0]));
    const sortedDateKeys = Array.from(datesSet).sort();

    // Group attendance status by agent email
    const agentMap = new Map<string, { name: string; attendance: Record<string, string> }>();
    filteredShrinkage.forEach(item => {
      const email = item.zeptoId.toLowerCase();
      const dateKey = item.date.toISOString().split('T')[0];
      
      const agentData = agentMap.get(email) || { name: item.employeeName || email.split('@')[0], attendance: {} };
      agentData.attendance[dateKey] = item.attendance;
      agentMap.set(email, agentData);
    });

    const grid = Array.from(agentMap.entries()).map(([email, val]) => ({
      email,
      name: val.name,
      attendance: val.attendance
    })).sort((a, b) => a.name.localeCompare(b.name));

    return {
      dates: sortedDateKeys.map(dKey => {
        const dObj = new Date(dKey);
        return {
          key: dKey,
          label: dObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short', timeZone: 'UTC' })
        };
      }),
      grid
    };
  }, [filteredShrinkage]);

  // 5. Table columns for raw logs
  const columns = useMemo<ColumnDef<ShrinkageRecord>[]>(() => [
    {
      accessorKey: 'date',
      header: 'Date',
      cell: info => formatDate(info.getValue() as Date)
    },
    {
      accessorKey: 'employeeName',
      header: 'Employee Name',
      cell: info => <span className="font-semibold">{info.getValue() as string}</span>
    },
    {
      accessorKey: 'zeptoId',
      header: 'Email / ID',
      cell: info => <span className="font-mono">{info.getValue() as string}</span>
    },
    {
      accessorKey: 'supervisor',
      header: 'Supervisor'
    },
    {
      accessorKey: 'wfhWfo',
      header: 'WFH/WFO'
    },
    {
      accessorKey: 'attendance',
      header: 'Status',
      cell: info => {
        const val = String(info.getValue() || 'P');
        return (
          <span className={cn(
            "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
            val === 'P' 
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400" 
              : val === 'A'
              ? "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400"
              : val === 'HD'
              ? "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400"
              : val === 'PL'
              ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400"
              : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400"
          )}>
            {val === 'P' ? 'Present' : val === 'A' ? 'Absent' : val === 'HD' ? 'Half Day' : val === 'PL' ? 'Leave' : 'Off'}
          </span>
        );
      }
    },
    {
      accessorKey: 'actualLoginHrs',
      header: 'Login Hours',
      cell: info => formatDuration(info.getValue() as number)
    },
    {
      accessorKey: 'targetLoginHrs',
      header: 'Target Hours',
      cell: info => formatDuration(info.getValue() as number)
    }
  ], []);

  if (!loading && filteredShrinkage.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 border rounded-lg h-64 text-center">
        <AlertTriangle className="w-8 h-8 text-amber-500 mb-2" />
        <h3 className="font-semibold">No Matching Roster Records</h3>
        <p className="text-xs text-slate-550 dark:text-slate-400 mt-1 max-w-sm">
          No shrinkage or attendance logs match the current filters. Modify filters in the top toolbar to see data.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5 animate-fade-in">
        <MetricCard
          title="Attendance Rate"
          value={formatPercent(stats.attendanceRate, 1)}
          subtext="Roster shifts compliance"
          icon={<UserCheck className="w-4 h-4 text-emerald-500" />}
        />
        <MetricCard
          title="Rostered Shifts"
          value={stats.rosteredCount}
          subtext={`Excludes weekly-offs (${stats.offCount})`}
          icon={<Calendar className="w-4 h-4 text-slate-400" />}
        />
        <MetricCard
          title="Unplanned Absents"
          value={stats.absentCount}
          subtext={`${stats.rosteredCount > 0 ? ((stats.absentCount / stats.rosteredCount) * 100).toFixed(0) : 0}% unplanned shrinkage`}
          icon={<UserX className="w-4 h-4 text-red-500" />}
        />
        <MetricCard
          title="Planned Leaves"
          value={stats.leaveCount}
          subtext="Approved holiday leaves"
          icon={<Calendar className="w-4 h-4 text-indigo-500" />}
        />
        <MetricCard
          title="Login Hours Deficit"
          value={`${stats.deficitSecs > 0 ? (stats.deficitSecs / 3600).toFixed(1) : '0.0'}h`}
          subtext={`Actual: ${(stats.actualLoginHrs / 3600).toFixed(0)}h`}
          icon={<Clock className="w-4 h-4 text-amber-500" />}
        />
      </div>

      {/* 2. Trends & Insights */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Trend Area */}
        <div className="lg:col-span-2">
          <AreaTrendChart
            title="Attendance Compliance Trend"
            description="Daily team attendance rate percentage (excluding weekly offs)"
            data={trendData}
            xAxisKey="date"
            series={[{ key: 'Attendance %', name: 'Attendance Rate %', color: '#10b981' }]}
            loading={loading}
          />
        </div>

        {/* Dynamic Insights Panel */}
        <Card className="h-full flex flex-col">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-emerald-500" /> Attendance Alerts
            </CardTitle>
            <CardDescription className="text-xs">Dynamic analysis of roster compliance</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow space-y-3 p-4 overflow-y-auto max-h-[320px]">
            {insights.map((item, index) => (
              <InsightItem key={index} insight={item} />
            ))}
          </CardContent>
        </Card>
      </div>

      {/* 3. Interactive Roster Heatmap Grid */}
      <Card>
        <CardHeader className="pb-2 border-b">
          <CardTitle className="text-base font-semibold">Roster Attendance Heatmap Grid</CardTitle>
          <CardDescription className="text-xs">Daily roster status visual grid by agent and date</CardDescription>
        </CardHeader>
        <CardContent className="pt-4 overflow-hidden">
          {/* Heatmap Legend */}
          <div className="flex flex-wrap gap-4 text-[10px] font-bold uppercase mb-4 text-slate-500">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-emerald-500 rounded" /> Present (P)</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-red-500 rounded" /> Absent (A)</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-amber-400 rounded" /> Half Day (HD)</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-indigo-500 rounded" /> Planned Leave (PL)</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-slate-200 dark:bg-slate-800 rounded" /> Weekly Off (WO)</span>
          </div>

          {/* Scrolling Grid */}
          <div className="overflow-x-auto border rounded-md max-h-[400px]">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b text-slate-500 sticky top-0">
                <tr>
                  <th className="p-2 border-r bg-slate-50 dark:bg-slate-900 sticky left-0 z-10 w-[150px] shrink-0 font-bold">Employee Name</th>
                  {heatmapData.dates.map(d => (
                    <th key={d.key} className="p-2 text-center font-bold min-w-[65px]">{d.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {heatmapData.grid.map(row => (
                  <tr key={row.email} className="border-t hover:bg-slate-100/30">
                    {/* Fixed name column */}
                    <td className="p-2 border-r bg-white dark:bg-slate-950 font-medium sticky left-0 z-10 truncate max-w-[150px] shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                      {row.name}
                    </td>
                    {/* Attendance status cells */}
                    {heatmapData.dates.map(date => {
                      const status = row.attendance[date.key] || 'WOFF';
                      return (
                        <td key={date.key} className="p-2.5 text-center">
                          <div className="flex justify-center">
                            <span 
                              className={cn(
                                "w-6 h-6 flex items-center justify-center rounded font-bold text-[9px] text-white shadow-sm",
                                status === 'P' ? "bg-emerald-500" :
                                status === 'A' ? "bg-red-500" :
                                status === 'HD' ? "bg-amber-400" :
                                status === 'PL' ? "bg-indigo-500" :
                                "bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                              )}
                              title={`${row.name} on ${date.label}: ${status}`}
                            >
                              {status}
                            </span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 4. Logs grid */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-base font-semibold">Shrinkage & Roster Logs</CardTitle>
          <CardDescription className="text-xs">Filter and export detailed team attendance parameters</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <DataTable
            columns={columns}
            data={filteredShrinkage}
            searchColumn="employeeName"
            searchPlaceholder="Filter by employee name..."
            exportFilename="attendance_roster_report.csv"
          />
        </CardContent>
      </Card>
    </div>
  );
};
