import React, { useMemo, useState } from 'react';
import { useExcelData } from '../../context/ExcelDataContext';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/card';
import { AreaTrendChart } from '../../components/shared/ChartCard';
import { formatPercent, formatDuration, cn } from '../../lib/utils';
import { 
  FileWarning, 
  Clock, 
  Share2, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle,
  Award,
  Zap,
  TrendingDown,
  UserCheck
} from 'lucide-react';
import { getDsatInsights } from '../../lib/insights/dsatInsights';
import { getAhtInsights } from '../../lib/insights/ahtInsights';
import { getEscalationsInsights } from '../../lib/insights/escalationsInsights';
import { getShrinkageInsights } from '../../lib/insights/shrinkageInsights';
import { getKpiInsights } from '../../lib/insights/kpiInsights';

export const HomeDashboard: React.FC = () => {
  const {
    filteredDsat,
    filteredAht,
    filteredEscalations,
    filteredShrinkage,
    filteredPerformance,
    loading
  } = useExcelData();

  // State for rankings metric selection ('csat' or 'cpa')
  const [rankingsMetric, setRankingsMetric] = useState<'csat' | 'cpa'>('csat');

  // 1. Calculate Summary Card Metrics
  const summaryMetrics = useMemo(() => {
    // Total DSAT count
    const totalDsat = filteredDsat.length;

    // Total AHT audits
    const totalAhtAudits = filteredAht.length;

    // Social Media Escalations count
    const totalEscalations = filteredEscalations.length;

    // Attendance Summary
    // Roster days = attendance status is not WOFF/WO
    const rosterRecords = filteredShrinkage.filter(s => s.attendance !== 'WOFF' && s.attendance !== 'WO');
    const totalRostered = rosterRecords.length;
    const presentRecords = rosterRecords.filter(s => s.attendance === 'P');
    const halfDayRecords = rosterRecords.filter(s => s.attendance === 'HD');
    const absentRecords = rosterRecords.filter(s => s.attendance === 'A');
    const plannedLeaveRecords = rosterRecords.filter(s => s.attendance === 'PL');

    const totalPresent = presentRecords.length + (halfDayRecords.length * 0.5);
    const attendanceRate = totalRostered > 0 ? totalPresent / totalRostered : 0;
    
    const totalShrinkage = absentRecords.length + plannedLeaveRecords.length + (halfDayRecords.length * 0.5);
    const shrinkageRate = totalRostered > 0 ? totalShrinkage / totalRostered : 0;

    // KPI Average (from performance summary)
    let avgCsat = 0;
    let avgCpa = 0;
    let avgAht = 0;
    const perfRows = filteredPerformance;
    if (perfRows.length > 0) {
      const sumCsat = perfRows.reduce((sum, r) => sum + r.csatPercent, 0);
      const sumCpa = perfRows.reduce((sum, r) => sum + r.cpa, 0);
      const sumAht = perfRows.reduce((sum, r) => sum + r.aht, 0);
      avgCsat = sumCsat / perfRows.length;
      avgCpa = sumCpa / perfRows.length;
      avgAht = sumAht / perfRows.length;
    }

    return {
      totalDsat,
      totalAhtAudits,
      totalEscalations,
      attendanceRate,
      shrinkageRate,
      avgCsat,
      avgCpa,
      avgAht,
      totalRostered,
      absentDays: absentRecords.length,
      leaveDays: plannedLeaveRecords.length
    };
  }, [filteredDsat, filteredAht, filteredEscalations, filteredShrinkage, filteredPerformance]);

  // 2. Aggregate Daily Trends for the Chart
  const dailyTrendsData = useMemo(() => {
    const datesMap = new Map<string, { dsat: number; aht: number; escalations: number }>();

    // Helper to format date key YYYY-MM-DD
    const formatDateKey = (d: Date) => {
      const year = d.getFullYear();
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      const day = d.getDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // Aggregate DSAT
    filteredDsat.forEach(item => {
      const key = formatDateKey(item.date);
      const current = datesMap.get(key) || { dsat: 0, aht: 0, escalations: 0 };
      current.dsat += 1;
      datesMap.set(key, current);
    });

    // Aggregate AHT Audits
    filteredAht.forEach(item => {
      const key = formatDateKey(item.date);
      const current = datesMap.get(key) || { dsat: 0, aht: 0, escalations: 0 };
      current.aht += 1;
      datesMap.set(key, current);
    });

    // Aggregate Escalations
    filteredEscalations.forEach(item => {
      const key = formatDateKey(item.date);
      const current = datesMap.get(key) || { dsat: 0, aht: 0, escalations: 0 };
      current.escalations += 1;
      datesMap.set(key, current);
    });

    // Convert Map to sorted array
    const sortedKeys = Array.from(datesMap.keys()).sort();
    
    // Fill in intermediate dates if dataset is small but let's just map existing keys chronologically
    return sortedKeys.map(dateKey => {
      const val = datesMap.get(dateKey)!;
      // Convert '2026-07-01' to short form for ticks e.g. 'Jul 01'
      const dateObj = new Date(dateKey);
      const label = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
      return {
        date: label,
        'DSAT Audits': val.dsat,
        'AHT Audits': val.aht,
        'SM Escalations': val.escalations,
      };
    });
  }, [filteredDsat, filteredAht, filteredEscalations]);

  // 3. Quick Rankings (Top 5 and Bottom 5)
  const agentRankings = useMemo(() => {
    // Sort performance rows
    const sorted = [...filteredPerformance].filter(r => r.chatCount > 0);
    
    const sortByCsat = (a: any, b: any) => b.csatPercent - a.csatPercent || b.chatCount - a.chatCount;
    const sortByCpa = (a: any, b: any) => b.cpa - a.cpa || b.chatCount - a.chatCount;
    
    const sortFn = rankingsMetric === 'csat' ? sortByCsat : sortByCpa;
    
    sorted.sort(sortFn);
    
    const top = sorted.slice(0, 5);
    const bottom = [...sorted].reverse().slice(0, 5);

    return { top, bottom };
  }, [filteredPerformance, rankingsMetric]);

  // 4. Automated Operations Insights Panel
  const insights = useMemo(() => {
    const dsatAlerts = getDsatInsights(filteredDsat);
    const ahtAlerts = getAhtInsights(filteredAht);
    const escAlerts = getEscalationsInsights(filteredEscalations);
    const shrinkageAlerts = getShrinkageInsights(filteredShrinkage);
    const kpiAlerts = getKpiInsights(filteredPerformance);

    const list: any[] = [];
    
    // Add warnings first
    const addWarning = (alerts: any[]) => {
      const warning = alerts.find(a => a.type === 'warning');
      if (warning) list.push(warning);
    };
    
    addWarning(shrinkageAlerts);
    addWarning(dsatAlerts);
    addWarning(escAlerts);
    addWarning(ahtAlerts);
    
    // Fill up to 4 with other insights
    const allAlerts = [...shrinkageAlerts, ...dsatAlerts, ...escAlerts, ...ahtAlerts, ...kpiAlerts]
      .filter(a => 
        a.title !== 'No DSAT Data' && 
        a.title !== 'No AHT Data' && 
        a.title !== 'No Escalations' && 
        a.title !== 'No Attendance Data' && 
        a.title !== 'No KPI Data' && 
        a.title !== 'Operations Stable'
      );
      
    allAlerts.forEach(alert => {
      if (list.length < 4 && !list.some(l => l.title === alert.title)) {
        list.push(alert);
      }
    });
    
    // Fallback if empty
    if (list.length === 0) {
      list.push({
        type: 'info',
        title: 'Operations Stable',
        desc: 'Metrics are currently within normal baseline tolerances. No immediate action required.'
      });
    }

    return list.slice(0, 4);
  }, [filteredDsat, filteredAht, filteredEscalations, filteredShrinkage, filteredPerformance]);

  const trendsSeries = useMemo(() => [
    { key: 'DSAT Audits', name: 'DSAT Audits', color: '#ef4444' },
    { key: 'AHT Audits', name: 'AHT Audits', color: '#f59e0b' },
    { key: 'SM Escalations', name: 'SM Escalations', color: '#6366f1' }
  ], []);

  return (
    <div className="space-y-6">
      {/* 1. Summary Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {/* Total DSAT */}
        <Card className="flex flex-col justify-between">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total DSAT</span>
            <FileWarning className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-2xl font-bold">{summaryMetrics.totalDsat}</div>
            <p className="text-[10px] text-slate-450 dark:text-slate-500 mt-1">Audit failures in period</p>
          </CardContent>
        </Card>

        {/* Total AHT Audits */}
        <Card className="flex flex-col justify-between">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">AHT Audits</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-2xl font-bold">{summaryMetrics.totalAhtAudits}</div>
            <p className="text-[10px] text-slate-450 dark:text-slate-500 mt-1">Chat audits in period</p>
          </CardContent>
        </Card>

        {/* Social Escalations */}
        <Card className="flex flex-col justify-between">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">SM Escalations</span>
            <Share2 className="w-4 h-4 text-indigo-500" />
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-2xl font-bold">{summaryMetrics.totalEscalations}</div>
            <p className="text-[10px] text-slate-450 dark:text-slate-500 mt-1">Social media tickets raised</p>
          </CardContent>
        </Card>

        {/* Attendance Summary */}
        <Card className="flex flex-col justify-between">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Attendance Summary</span>
            <UserCheck className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-2xl font-bold">{formatPercent(summaryMetrics.attendanceRate)}</div>
            <div className="flex gap-2 mt-1">
              <span className="text-[10px] text-red-500">{summaryMetrics.absentDays} Absents</span>
              <span className="text-[10px] text-slate-450">{summaryMetrics.leaveDays} Leaves</span>
            </div>
          </CardContent>
        </Card>

        {/* KPI Average */}
        <Card className="flex flex-col justify-between">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">KPI Averages</span>
            <Award className="w-4 h-4 text-violet-500" />
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-2xl font-bold">{formatPercent(summaryMetrics.avgCsat)}</div>
            <div className="flex gap-2 mt-1 text-[10px] text-slate-450 dark:text-slate-500">
              <span>CPA: {summaryMetrics.avgCpa.toFixed(1)}</span>
              <span>AHT: {formatDuration(summaryMetrics.avgAht)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 2. Trends & Insights Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Daily Trends Chart (takes 2 cols on desktop) */}
        <div className="lg:col-span-2">
          <AreaTrendChart
            title="Recent Activity Trends"
            description="Daily volume of DSAT audits, AHT audits, and Social Media Escalations"
            data={dailyTrendsData}
            xAxisKey="date"
            series={trendsSeries}
            loading={loading}
          />
        </div>

        {/* Insights Panel */}
        <Card className="h-full flex flex-col">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-indigo-500" /> Key Insights
            </CardTitle>
            <CardDescription className="text-xs">Dynamic operational anomalies and highlights</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 space-y-4">
            {insights.map((item, index) => (
              <div key={index} className="flex gap-2.5 p-3 rounded-lg border text-xs dark:bg-slate-900/50">
                <div className="shrink-0 mt-0.5">
                  {item.type === 'warning' ? (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  ) : item.type === 'success' ? (
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Award className="w-4 h-4 text-indigo-500" />
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

      {/* 3. Quick Rankings (Top & Bottom Agents) */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
          <div>
            <CardTitle className="text-base font-semibold">Agent Performance Rankings</CardTitle>
            <CardDescription className="text-xs">Top and Bottom 5 active agents based on chat outcomes</CardDescription>
          </div>
          {/* Toggle controls */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-md text-xs font-semibold">
            <button
              onClick={() => setRankingsMetric('csat')}
              className={cn(
                "px-2.5 py-1 rounded-sm transition-colors",
                rankingsMetric === 'csat' ? "bg-white text-slate-950 shadow-sm dark:bg-slate-950 dark:text-slate-50" : "text-slate-500"
              )}
            >
              CSAT %
            </button>
            <button
              onClick={() => setRankingsMetric('cpa')}
              className={cn(
                "px-2.5 py-1 rounded-sm transition-colors",
                rankingsMetric === 'cpa' ? "bg-white text-slate-950 shadow-sm dark:bg-slate-950 dark:text-slate-50" : "text-slate-500"
              )}
            >
              CPA
            </button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Top 5 Agents */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-450 uppercase tracking-wider flex items-center gap-1">
                <TrendingUp className="w-4 h-4" /> Top Performers
              </h4>
              <div className="rounded-md border overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500">
                    <tr>
                      <th className="p-2.5">Agent Email</th>
                      <th className="p-2.5 text-right">Chats</th>
                      <th className="p-2.5 text-right">{rankingsMetric === 'csat' ? 'CSAT %' : 'CPA Score'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agentRankings.top.map((row) => (
                      <tr key={row.agentEmail} className="border-t hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-2.5 font-medium">{row.agentEmail.split('@')[0]}</td>
                        <td className="p-2.5 text-right">{row.chatCount}</td>
                        <td className="p-2.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                          {rankingsMetric === 'csat' ? formatPercent(row.csatPercent) : row.cpa.toFixed(1)}
                        </td>
                      </tr>
                    ))}
                    {agentRankings.top.length === 0 && (
                      <tr>
                        <td colSpan={3} className="p-3 text-center text-slate-400">No agent performance data found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom 5 Agents */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-red-500 uppercase tracking-wider flex items-center gap-1">
                <TrendingDown className="w-4 h-4" /> Opportunities for Coaching
              </h4>
              <div className="rounded-md border overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500">
                    <tr>
                      <th className="p-2.5">Agent Email</th>
                      <th className="p-2.5 text-right">Chats</th>
                      <th className="p-2.5 text-right">{rankingsMetric === 'csat' ? 'CSAT %' : 'CPA Score'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agentRankings.bottom.map((row) => (
                      <tr key={row.agentEmail} className="border-t hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-2.5 font-medium">{row.agentEmail.split('@')[0]}</td>
                        <td className="p-2.5 text-right">{row.chatCount}</td>
                        <td className="p-2.5 text-right font-bold text-red-500">
                          {rankingsMetric === 'csat' ? formatPercent(row.csatPercent) : row.cpa.toFixed(1)}
                        </td>
                      </tr>
                    ))}
                    {agentRankings.bottom.length === 0 && (
                      <tr>
                        <td colSpan={3} className="p-3 text-center text-slate-400">No agent performance data found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
