import type { AHTAudit } from '../../types/data';
import type { InsightAlert } from './dsatInsights';

export function getAhtInsights(data: AHTAudit[]): InsightAlert[] {
  const insights: InsightAlert[] = [];
  if (data.length === 0) {
    return [{
      type: 'info',
      title: 'No AHT Data',
      desc: 'No AHT audits are available in the selected filters to generate insights.'
    }];
  }

  // 1. Primary high AHT reasons
  const reasonCounts = data.reduce((acc, audit) => {
    const reason = audit.exactReason;
    if (reason && reason !== '-') {
      acc[reason] = (acc[reason] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const sortedReasons = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1]);
  if (sortedReasons.length > 0) {
    const [topReason, count] = sortedReasons[0];
    const pct = ((count / data.length) * 100).toFixed(0);
    insights.push({
      type: 'warning',
      title: 'Top AHT Bottleneck',
      desc: `"${topReason}" is the primary driver of extended handling times, present in ${count} audits (${pct}% of high AHT audits).`
    });
  }

  // 2. Outcall Requirements vs actual behavior
  const callingRequired = data.filter(d => d.wasCallingRequired.toLowerCase() === 'yes');
  const actualOutcalls = callingRequired.filter(d => d.didAgentOutcall.toLowerCase() === 'yes');
  
  if (callingRequired.length > 0) {
    const complianceRate = actualOutcalls.length / callingRequired.length;
    if (complianceRate < 0.8) {
      insights.push({
        type: 'warning',
        title: 'Low Outcall Compliance',
        desc: `Outcalls were required in ${callingRequired.length} audits, but completed in only ${actualOutcalls.length} cases (compliance rate: ${(complianceRate * 100).toFixed(0)}%). Missed outcalls frequently lead to repeat chats and high overall AHT.`
      });
    } else {
      insights.push({
        type: 'success',
        title: 'Strong Call Compliance',
        desc: `High outcall compliance achieved: ${(complianceRate * 100).toFixed(0)}% of required outcalls were completed by advisors.`
      });
    }
  }

  // 3. Top Opportunity Areas
  const oppCounts = data.reduce((acc, audit) => {
    const opp = audit.ahtOpportunity;
    if (opp && opp !== '-') {
      acc[opp] = (acc[opp] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const sortedOpps = Object.entries(oppCounts).sort((a, b) => b[1] - a[1]);
  if (sortedOpps.length > 0) {
    const [topOpp, count] = sortedOpps[0];
    insights.push({
      type: 'info',
      title: 'Advisor Opportunity',
      desc: `The leading coaching focus is "${topOpp}" (${count} instances). Addressing this will yield immediate AHT reductions.`
    });
  }

  return insights.slice(0, 3);
}
