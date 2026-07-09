import type { AgentKPI } from '../../types/data';
import type { InsightAlert } from './dsatInsights';

export function getKpiInsights(data: AgentKPI[]): InsightAlert[] {
  const insights: InsightAlert[] = [];
  if (data.length === 0) {
    return [{
      type: 'info',
      title: 'No KPI Data',
      desc: 'No agent performance records are available in the selected filters to generate insights.'
    }];
  }

  // 1. KPI Champions (high CSAT and chat count)
  const qualifiedChampions = data.filter(p => p.chatCount >= 100 && p.csatPercent >= 0.85);
  if (qualifiedChampions.length > 0) {
    const topChamp = [...qualifiedChampions].sort((a, b) => b.csatPercent - a.csatPercent)[0];
    insights.push({
      type: 'success',
      title: 'Performance Champion',
      desc: `${topChamp.agentEmail.split('@')[0]} logged ${(topChamp.csatPercent * 100).toFixed(0)}% CSAT across ${topChamp.chatCount} chats, leading the team in operational quality.`
    });
  }

  // 2. High AHT Coaching Opportunities
  const highAhtAgents = data.filter(p => p.chatCount >= 50 && p.aht > 480); // > 8 minutes AHT
  if (highAhtAgents.length > 0) {
    const worstAht = [...highAhtAgents].sort((a, b) => b.aht - a.aht)[0];
    const ahtMins = (worstAht.aht / 60).toFixed(1);
    insights.push({
      type: 'warning',
      title: 'AHT Coaching Alert',
      desc: `${worstAht.agentEmail.split('@')[0]} has a high average handling time of ${ahtMins} mins across ${worstAht.chatCount} chats. Action plan needed for chat concurrency.`
    });
  }

  // 3. Low CSAT / CPA Warnings
  const lowPerformance = data.filter(p => p.chatCount >= 40 && p.csatPercent < 0.65);
  if (lowPerformance.length > 0) {
    const list = lowPerformance.slice(0, 2).map(p => p.agentEmail.split('@')[0]).join(', ');
    insights.push({
      type: 'warning',
      title: 'Critical Quality Focus',
      desc: `Advisors falling below CSAT targets (<65%): ${list}. Recommend review of chat transcript recordings.`
    });
  }

  // 4. CPA correlation check
  const lowCpa = data.filter(p => p.cpa < 90);
  if (lowCpa.length > 0) {
    insights.push({
      type: 'info',
      title: 'Audit Score Compliance',
      desc: `There are ${lowCpa.length} agents with a CPA (Chat Process Adherence) score below the 90% target benchmark. Process compliance refresher needed.`
    });
  }

  return insights.slice(0, 3);
}
