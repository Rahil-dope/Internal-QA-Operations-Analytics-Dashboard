import type { SMEscalation } from '../../types/data';
import type { InsightAlert } from './dsatInsights';

export function getEscalationsInsights(data: SMEscalation[]): InsightAlert[] {
  const insights: InsightAlert[] = [];
  if (data.length === 0) {
    return [{
      type: 'info',
      title: 'No Escalations',
      desc: 'No social media escalations are available in the selected filters to generate insights.'
    }];
  }

  // 1. Top Ticket Sources
  const sourceCounts = data.reduce((acc, esc) => {
    const src = esc.source || 'Other';
    acc[src] = (acc[src] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sortedSources = Object.entries(sourceCounts).sort((a, b) => b[1] - a[1]);
  if (sortedSources.length > 0) {
    const [topSrc, count] = sortedSources[0];
    const pct = ((count / data.length) * 100).toFixed(0);
    insights.push({
      type: 'info',
      title: `Dominant Channel: ${topSrc}`,
      desc: `Social media escalations are heavily concentrated on "${topSrc}", representing ${count} tickets (${pct}% of total SM escalations).`
    });
  }

  // 2. Escalation Reason Hotspots (L3 reasons)
  const reasonCounts = data.reduce((acc, esc) => {
    const r = esc.l3Reason;
    if (r) {
      acc[r] = (acc[r] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const sortedReasons = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1]);
  if (sortedReasons.length > 0) {
    const [topReason, count] = sortedReasons[0];
    if (count >= 5) {
      insights.push({
        type: 'warning',
        title: `Product/SOP Warning: ${topReason}`,
        desc: `High volume of "${topReason}" issues reported on social media (${count} escalations). Investigations on vendor supply chains or store dispatch procedures advised.`
      });
    }
  }

  // 3. Store Hotspots (Stores with high escalation counts)
  const storeCounts = data.reduce((acc, esc) => {
    const store = esc.store;
    if (store && store !== '-') {
      acc[store] = (acc[store] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const sortedStores = Object.entries(storeCounts).sort((a, b) => b[1] - a[1]);
  const highEscalationStores = sortedStores.filter(([_, count]) => count >= 3);
  if (highEscalationStores.length > 0) {
    const list = highEscalationStores.slice(0, 2).map(([name, count]) => `${name} (${count})`).join(', ');
    insights.push({
      type: 'warning',
      title: 'Store Escalation Hotspots',
      desc: `The following store locations are responsible for multiple SM complaints: ${list}. Focus on store dispatch compliance.`
    });
  }

  // 4. ACPT Distribution (Agent Accountability Ratio)
  const agentErr = data.filter(d => d.acpt.toLowerCase() === 'agent').length;
  if (data.length > 0) {
    const ratio = agentErr / data.length;
    if (ratio > 0.4) {
      insights.push({
        type: 'warning',
        title: 'High Agent Failure Ratio',
        desc: `Agent errors account for ${agentErr} escalations (${(ratio * 100).toFixed(0)}% of SM tickets). Ensure agents are verifying chat histories before denying requests.`
      });
    } else {
      insights.push({
        type: 'success',
        title: 'Low Agent Failure Rate',
        desc: `Advisors handled escalations effectively—agent accountability accounts for only ${(ratio * 100).toFixed(0)}% of complaints, with most stemming from system or product issues.`
      });
    }
  }

  return insights.slice(0, 3);
}
