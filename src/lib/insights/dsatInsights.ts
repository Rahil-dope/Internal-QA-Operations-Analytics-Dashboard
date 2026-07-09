import type { DSATAudit } from '../../types/data';

export interface InsightAlert {
  type: 'success' | 'warning' | 'info';
  title: string;
  desc: string;
}

export function getDsatInsights(data: DSATAudit[]): InsightAlert[] {
  const insights: InsightAlert[] = [];
  if (data.length === 0) {
    return [{
      type: 'info',
      title: 'No DSAT Data',
      desc: 'No DSAT audits are available in the selected filters to generate insights.'
    }];
  }

  // 1. Top Failure Categories
  const categoryCounts = data.reduce((acc, audit) => {
    const cat = audit.issueCategory || 'Uncategorized';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sortedCategories = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]);
  if (sortedCategories.length > 0) {
    const [topCat, count] = sortedCategories[0];
    const pct = ((count / data.length) * 100).toFixed(0);
    insights.push({
      type: 'warning',
      title: `Top Failure Mode: ${topCat}`,
      desc: `"${topCat}" is the leading driver of customer dissatisfaction, accounting for ${count} cases (${pct}% of total DSAT audits).`
    });
  }

  // 2. Supervisor Hotspots (TLs with high failure counts)
  const tlCounts = data.reduce((acc, audit) => {
    const tl = audit.teamLeader;
    if (tl) {
      acc[tl] = (acc[tl] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const sortedTls = Object.entries(tlCounts).sort((a, b) => b[1] - a[1]);
  const highFailureTls = sortedTls.filter(([_, count]) => count >= 4);
  if (highFailureTls.length > 0) {
    const list = highFailureTls.map(([name, count]) => `${name} (${count})`).join(', ');
    insights.push({
      type: 'warning',
      title: 'Supervisor DSAT Hotspots',
      desc: `The following team leaders have high DSAT frequencies in their teams: ${list}. Review of team coaching plans suggested.`
    });
  }

  // 3. Rebuttal Status Metrics
  const rebuttalCounts = data.reduce((acc, audit) => {
    const status = audit.rebuttalStatus || 'Accept';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const openRebuttals = rebuttalCounts['Open'] || rebuttalCounts['Rebuttal Raised'] || 0;
  if (openRebuttals > 0) {
    insights.push({
      type: 'info',
      title: 'Pending Rebuttals',
      desc: `There are currently ${openRebuttals} audits with active disputes or open rebuttals. Follow up with team leaders for resolution.`
    });
  }

  // 4. Stable Performance
  if (data.length <= 5) {
    insights.push({
      type: 'success',
      title: 'Low DSAT Volatility',
      desc: 'DSAT audits are well within control limits. High operational quality benchmark achieved.'
    });
  }

  return insights.slice(0, 3); // Return top 3 insights
}
