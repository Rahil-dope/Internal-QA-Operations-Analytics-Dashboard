import type { ShrinkageRecord } from '../../types/data';
import type { InsightAlert } from './dsatInsights';

export function getShrinkageInsights(data: ShrinkageRecord[]): InsightAlert[] {
  const insights: InsightAlert[] = [];
  if (data.length === 0) {
    return [{
      type: 'info',
      title: 'No Attendance Data',
      desc: 'No attendance records are available in the selected filters to generate insights.'
    }];
  }

  // 1. High Absenteeism Alert
  const absentsCounts = data.reduce((acc, rec) => {
    if (rec.attendance === 'A') {
      const name = rec.employeeName || rec.zeptoId;
      acc[name] = (acc[name] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const repeatAbsentees = Object.entries(absentsCounts)
    .filter(([_, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1]);

  if (repeatAbsentees.length > 0) {
    const list = repeatAbsentees.slice(0, 3).map(([name, count]) => `${name} (${count} days)`).join(', ');
    insights.push({
      type: 'warning',
      title: 'Critical Absenteeism Warnings',
      desc: `High unplanned shrinkage detected for: ${list}. These agents have missed multiple rostered shifts.`
    });
  }

  // 2. Attendance rates
  const rostered = data.filter(d => d.attendance !== 'WOFF' && d.attendance !== 'WO');
  const present = rostered.filter(d => d.attendance === 'P').length + (rostered.filter(d => d.attendance === 'HD').length * 0.5);
  
  if (rostered.length > 0) {
    const rate = present / rostered.length;
    if (rate < 0.85) {
      insights.push({
        type: 'warning',
        title: 'High Overall Shrinkage',
        desc: `Team attendance is currently at ${(rate * 100).toFixed(1)}%, which exceeds standard operations shrinkage targets (<15% absent/leave rate).`
      });
    } else if (rate >= 0.95) {
      insights.push({
        type: 'success',
        title: 'Outstanding Attendance',
        desc: `Team achieved a high attendance rate of ${(rate * 100).toFixed(1)}% in the selected period, ensuring maximum roster compliance.`
      });
    }
  }

  // 3. Login Hours Deficit
  // Find agents with actual login hours significantly below target
  const deficitRecords = data.filter(d => {
    if (d.attendance !== 'P' && d.attendance !== 'HD') return false;
    // target and actual exist
    return d.targetLoginHrs > 0 && d.actualLoginHrs < d.targetLoginHrs * 0.9;
  });

  if (deficitRecords.length > 0) {
    // Group deficit hours by agent
    const deficitByAgent = deficitRecords.reduce((acc, rec) => {
      const name = rec.employeeName || rec.zeptoId;
      const deficit = rec.targetLoginHrs - rec.actualLoginHrs;
      acc[name] = (acc[name] || 0) + deficit;
      return acc;
    }, {} as Record<string, number>);

    const topDeficit = Object.entries(deficitByAgent)
      .sort((a, b) => b[1] - a[1])[0];

    if (topDeficit) {
      const hrs = (topDeficit[1] / 3600).toFixed(1);
      insights.push({
        type: 'info',
        title: 'Login Hours Leakage',
        desc: `${topDeficit[0]} has the highest login hours deficit, falling short of targets by ${hrs} hours on active shifts. WFM checks recommended.`
      });
    }
  }

  return insights.slice(0, 3);
}
