import React, { useMemo, useState } from 'react';
import { useExcelData } from '../../context/ExcelDataContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { DataTable } from '../../components/shared/DataTable';
import { Select } from '../../components/ui/select';
import { getKpiInsights } from '../../lib/insights/kpiInsights';
import { MetricCard } from '../../components/shared/MetricCard';
import { InsightItem } from '../../components/shared/InsightItem';
import type { ColumnDef } from '@tanstack/react-table';
import { formatPercent, formatDuration, cn } from '../../lib/utils';
import { 
  UserCheck, 
  Award, 
  Clock, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  TrendingDown, 
  AlertTriangle,
  Zap
} from 'lucide-react';
import type { AgentKPI } from '../../types/data';

export const KpiDashboard: React.FC = () => {
  const { filteredPerformance, loading } = useExcelData();
  const [selectedAgentEmail, setSelectedAgentEmail] = useState<string>('');

  // 1. Team Averages calculation
  const teamAverages = useMemo(() => {
    const total = filteredPerformance.length;
    if (total === 0) return { csat: 0, aht: 0, cpa: 0, frs: 0, chats: 0 };
    
    const sumChats = filteredPerformance.reduce((sum, r) => sum + r.chatCount, 0);
    const sumCsat = filteredPerformance.reduce((sum, r) => sum + r.csatPercent, 0);
    const sumAht = filteredPerformance.reduce((sum, r) => sum + r.aht, 0);
    const sumCpa = filteredPerformance.reduce((sum, r) => sum + r.cpa, 0);
    const sumFrs = filteredPerformance.reduce((sum, r) => sum + r.frs, 0);

    return {
      chats: sumChats / total,
      csat: sumCsat / total,
      aht: sumAht / total,
      cpa: sumCpa / total,
      frs: sumFrs / total
    };
  }, [filteredPerformance]);

  // Set default selected agent on load
  React.useEffect(() => {
    if (filteredPerformance.length > 0 && !selectedAgentEmail) {
      // Find an agent with good chat count
      const activeAgent = filteredPerformance.find(p => p.chatCount > 0);
      if (activeAgent) {
        setSelectedAgentEmail(activeAgent.agentEmail);
      } else {
        setSelectedAgentEmail(filteredPerformance[0].agentEmail);
      }
    }
  }, [filteredPerformance, selectedAgentEmail]);

  // 2. Selected Agent Profile Metrics
  const agentProfile = useMemo(() => {
    if (!selectedAgentEmail) return null;
    const profile = filteredPerformance.find(p => p.agentEmail.toLowerCase() === selectedAgentEmail.toLowerCase());
    if (!profile) return null;

    // Calculate deltas against team averages
    const csatDelta = profile.csatPercent - teamAverages.csat;
    const ahtDelta = profile.aht - teamAverages.aht;
    const cpaDelta = profile.cpa - teamAverages.cpa;
    const frsDelta = profile.frs - teamAverages.frs;

    return {
      profile,
      csatDelta,
      ahtDelta, // negative is good for AHT
      cpaDelta,
      frsDelta
    };
  }, [selectedAgentEmail, filteredPerformance, teamAverages]);

  // 3. Dropdown list options
  const agentOptions = useMemo(() => {
    return filteredPerformance
      .map(p => ({
        value: p.agentEmail,
        label: p.agentEmail.split('@')[0]
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [filteredPerformance]);

  // 4. Insights
  const insights = useMemo(() => getKpiInsights(filteredPerformance), [filteredPerformance]);

  // 5. Compare Top vs Bottom (CSAT% and CPA Side-by-Side)
  const comparisons = useMemo(() => {
    const sorted = [...filteredPerformance].filter(p => p.chatCount > 10);
    sorted.sort((a, b) => b.csatPercent - a.csatPercent);
    const top3 = sorted.slice(0, 3);
    const bottom3 = sorted.reverse().slice(0, 3);
    return { top3, bottom3 };
  }, [filteredPerformance]);

  // 6. Table Columns configuration
  const columns = useMemo<ColumnDef<AgentKPI>[]>(() => [
    {
      accessorKey: 'agentEmail',
      header: 'Agent Email ID',
      cell: info => <span className="font-semibold">{info.getValue() as string}</span>
    },
    {
      accessorKey: 'chatCount',
      header: 'Chats Logged',
      cell: info => (info.getValue() as number).toLocaleString()
    },
    {
      accessorKey: 'csatPercent',
      header: 'CSAT %',
      cell: info => (
        <span className={cn(
          "font-bold",
          (info.getValue() as number) >= 0.8 ? "text-emerald-500" :
          (info.getValue() as number) < 0.65 ? "text-red-500" : "text-amber-500"
        )}>
          {formatPercent(info.getValue() as number)}
        </span>
      )
    },
    {
      accessorKey: 'aht',
      header: 'Avg Handling Time (AHT)',
      cell: info => formatDuration(info.getValue() as number)
    },
    {
      accessorKey: 'frs',
      header: 'First Response (FRS)',
      cell: info => formatDuration(info.getValue() as number)
    },
    {
      accessorKey: 'cpa',
      header: 'CPA Score',
      cell: info => (
        <span className="font-medium text-indigo-500">
          {(info.getValue() as number).toFixed(1)}%
        </span>
      )
    },
    {
      accessorKey: 'csat',
      header: 'CSAT count'
    },
    {
      accessorKey: 'dsat',
      header: 'DSAT count'
    }
  ], []);

  if (!loading && filteredPerformance.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 border rounded-lg h-64 text-center">
        <AlertTriangle className="w-8 h-8 text-slate-400 mb-2" />
        <h3 className="font-semibold">No Performance Records</h3>
        <p className="text-xs text-slate-550 dark:text-slate-400 mt-1 max-w-sm">
          No agent KPI records match the current filters. Modify the filters in the top toolbar to see data.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Team Summary KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5 animate-fade-in">
        <MetricCard
          title="Team Average CSAT"
          value={formatPercent(teamAverages.csat, 1)}
          subtext="Weighted team average"
          icon={<Award className="w-4 h-4 text-slate-400" />}
        />
        <MetricCard
          title="Team Average CPA"
          value={`${teamAverages.cpa.toFixed(1)}%`}
          subtext="Process compliance average"
          icon={<UserCheck className="w-4 h-4 text-indigo-500" />}
        />
        <MetricCard
          title="Team Average AHT"
          value={formatDuration(teamAverages.aht)}
          subtext="Handling time benchmark"
          icon={<Clock className="w-4 h-4 text-amber-500" />}
        />
        <MetricCard
          title="Team Average FRS"
          value={formatDuration(teamAverages.frs)}
          subtext="First response time speed"
          icon={<Clock className="w-4 h-4 text-emerald-500" />}
        />
        <MetricCard
          title="Team Chats Count"
          value={(teamAverages.chats).toFixed(0)}
          subtext="Average chat load per agent"
          icon={<TrendingUp className="w-4 h-4 text-slate-400" />}
        />
      </div>

      {/* 2. Agent Profile & Team Comparison Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Agent Profile Selector (takes 1 col) */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base font-semibold">Agent Profile Card</CardTitle>
            <CardDescription className="text-xs">Compare individual advisor metrics to the team average</CardDescription>
            <div className="pt-2">
              <Select
                options={agentOptions}
                value={selectedAgentEmail}
                onChange={e => setSelectedAgentEmail(e.target.value)}
                className="w-full h-8 text-xs font-semibold"
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-4 space-y-4">
            {agentProfile ? (
              <div className="space-y-4">
                <div className="p-3 bg-indigo-50/25 dark:bg-slate-900 border rounded-lg flex flex-col justify-center">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Active Agent Profile</span>
                  <span className="font-bold text-sm truncate">{agentProfile.profile.agentEmail}</span>
                  <span className="text-[10px] text-indigo-500 font-semibold mt-1">Chats Processed: {agentProfile.profile.chatCount}</span>
                </div>

                <div className="space-y-3.5 text-xs">
                  {/* CSAT */}
                  <div className="flex justify-between items-center py-0.5">
                    <span className="text-slate-500">CSAT Score %</span>
                    <div className="flex items-center gap-1.5 font-bold">
                      <span>{formatPercent(agentProfile.profile.csatPercent, 1)}</span>
                      {agentProfile.csatDelta >= 0 ? (
                        <span className="text-emerald-500 flex items-center text-[10px]"><ArrowUpRight className="w-3.5 h-3.5" /> +{(agentProfile.csatDelta * 100).toFixed(0)}%</span>
                      ) : (
                        <span className="text-red-500 flex items-center text-[10px]"><ArrowDownRight className="w-3.5 h-3.5" /> {(agentProfile.csatDelta * 100).toFixed(0)}%</span>
                      )}
                    </div>
                  </div>

                  {/* CPA */}
                  <div className="flex justify-between items-center py-0.5 border-t border-slate-100 dark:border-slate-800 pt-2">
                    <span className="text-slate-550 dark:text-slate-400">Process Score (CPA)</span>
                    <div className="flex items-center gap-1.5 font-bold">
                      <span>{agentProfile.profile.cpa.toFixed(1)}%</span>
                      {agentProfile.cpaDelta >= 0 ? (
                        <span className="text-emerald-500 flex items-center text-[10px]"><ArrowUpRight className="w-3.5 h-3.5" /> +{agentProfile.cpaDelta.toFixed(0)}%</span>
                      ) : (
                        <span className="text-red-500 flex items-center text-[10px]"><ArrowDownRight className="w-3.5 h-3.5" /> {agentProfile.cpaDelta.toFixed(0)}%</span>
                      )}
                    </div>
                  </div>

                  {/* AHT */}
                  <div className="flex justify-between items-center py-0.5 border-t border-slate-100 dark:border-slate-800 pt-2">
                    <span className="text-slate-550 dark:text-slate-400">Handling Time (AHT)</span>
                    <div className="flex items-center gap-1.5 font-bold">
                      <span>{formatDuration(agentProfile.profile.aht)}</span>
                      {agentProfile.ahtDelta <= 0 ? (
                        <span className="text-emerald-500 flex items-center text-[10px]"><ArrowDownRight className="w-3.5 h-3.5" /> {Math.abs(agentProfile.ahtDelta).toFixed(0)}s (Faster)</span>
                      ) : (
                        <span className="text-red-500 flex items-center text-[10px]"><ArrowUpRight className="w-3.5 h-3.5" /> +{agentProfile.ahtDelta.toFixed(0)}s (Slower)</span>
                      )}
                    </div>
                  </div>

                  {/* FRS */}
                  <div className="flex justify-between items-center py-0.5 border-t border-slate-100 dark:border-slate-800 pt-2">
                    <span className="text-slate-550 dark:text-slate-400">First Response (FRS)</span>
                    <div className="flex items-center gap-1.5 font-bold">
                      <span>{formatDuration(agentProfile.profile.frs)}</span>
                      {agentProfile.frsDelta <= 0 ? (
                        <span className="text-emerald-500 flex items-center text-[10px]"><ArrowDownRight className="w-3.5 h-3.5" /> {Math.abs(agentProfile.frsDelta).toFixed(0)}s (Faster)</span>
                      ) : (
                        <span className="text-red-500 flex items-center text-[10px]"><ArrowUpRight className="w-3.5 h-3.5" /> +{agentProfile.frsDelta.toFixed(0)}s (Slower)</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <span className="text-xs text-slate-400 text-center block pt-10">Select an agent email to view profile statistics.</span>
            )}
          </CardContent>
        </Card>

        {/* Side-by-Side Top vs Bottom Comparison (takes 2 cols) */}
        <Card className="lg:col-span-2">
          <CardHeader className="border-b">
            <CardTitle className="text-base font-semibold">Performance Comparison Summary</CardTitle>
            <CardDescription className="text-xs">Top 3 and Bottom 3 agents mapped by CSAT quality scores</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Top 3 List */}
            <div className="space-y-3.5">
              <h4 className="font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                <TrendingUp className="w-4 h-4" /> Top Performers (CSAT)
              </h4>
              <div className="space-y-3">
                {comparisons.top3.map(row => (
                  <div key={row.agentEmail} className="flex justify-between items-center p-2.5 border rounded-lg bg-slate-50/20">
                    <span className="font-semibold">{row.agentEmail.split('@')[0]}</span>
                    <div className="flex gap-4">
                      <span>Chats: {row.chatCount}</span>
                      <span className="font-bold text-emerald-600">{formatPercent(row.csatPercent, 0)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom 3 List */}
            <div className="space-y-3.5">
              <h4 className="font-bold text-red-500 uppercase tracking-wider flex items-center gap-1">
                <TrendingDown className="w-4 h-4" /> Opportunities for Improvement
              </h4>
              <div className="space-y-3">
                {comparisons.bottom3.map(row => (
                  <div key={row.agentEmail} className="flex justify-between items-center p-2.5 border rounded-lg bg-slate-50/20">
                    <span className="font-semibold">{row.agentEmail.split('@')[0]}</span>
                    <div className="flex gap-4">
                      <span>Chats: {row.chatCount}</span>
                      <span className="font-bold text-red-500">{formatPercent(row.csatPercent, 0)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Dynamic Insights */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-violet-500" /> Operational Action Items
            </CardTitle>
            <CardDescription className="text-xs">Adherence issues and standout performances flagged dynamically</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
            {insights.map((item, index) => (
              <InsightItem key={index} insight={item} />
            ))}
          </CardContent>
        </Card>
      </div>

      {/* 4. Complete Rankings Sorted Table */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-base font-semibold">Agent Performance Rankings Grid</CardTitle>
          <CardDescription className="text-xs">Sortable rankings table mapping all agent KPIs. Supported by Excel and CSV exports.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <DataTable
            columns={columns}
            data={filteredPerformance}
            searchColumn="agentEmail"
            searchPlaceholder="Filter by agent email..."
            exportFilename="agent_kpi_rankings_report.csv"
          />
        </CardContent>
      </Card>
    </div>
  );
};
