import * as XLSX from 'xlsx';
import type { 
  DSATAudit, 
  AHTAudit, 
  SMEscalation, 
  ShrinkageRecord, 
  AgentKPI, 
  OperationsDataset 
} from '../types/data';

// Helper to normalize strings for comparison
const normalizeHeader = (name: any): string => {
  if (name === null || name === undefined) return '';
  return name.toString().toLowerCase().replace(/[^a-z0-9]/g, '');
};

// Robust date parsing
export function parseExcelDate(val: any): Date {
  if (val === null || val === undefined) return new Date();
  if (val instanceof Date) {
    if (!isNaN(val.getTime())) return val;
  }
  if (typeof val === 'number') {
    // Excel stores dates as serial numbers
    // 25569 is difference in days between Excel epoch (1900) and Unix epoch (1970)
    const date = new Date((val - 25569) * 86400 * 1000);
    return date;
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed || trimmed === '-' || trimmed.toLowerCase() === 'none') {
      return new Date();
    }
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
}

// Robust duration/timedelta parsing (returns seconds)
export function parseExcelDuration(val: any): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') {
    // Excel stores durations as fractions of a day (1.0 = 24 hours)
    return Math.round(val * 86400);
  }
  if (val instanceof Date) {
    // Time component from date object
    const hours = val.getHours();
    const minutes = val.getMinutes();
    const seconds = val.getSeconds();
    return hours * 3600 + minutes * 60 + seconds;
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed || trimmed === '-' || trimmed.toLowerCase() === 'none') return 0;
    
    // Check for HH:MM:SS format
    const parts = trimmed.split(':');
    if (parts.length === 3) {
      const hours = parseFloat(parts[0]) || 0;
      const minutes = parseFloat(parts[1]) || 0;
      const seconds = parseFloat(parts[2]) || 0;
      return Math.round(hours * 3600 + minutes * 60 + seconds);
    } else if (parts.length === 2) {
      const minutes = parseFloat(parts[0]) || 0;
      const seconds = parseFloat(parts[1]) || 0;
      return Math.round(minutes * 60 + seconds);
    }
  }
  return 0;
}

// Helper to determine the header row index and map normalized names to column indices
function mapHeaders(rows: any[][]): { headerMap: Map<string, number>; startRowIdx: number } {
  const headerMap = new Map<string, number>();
  let headerRowIdx = 0;

  // Search first 5 rows to find the header row (contains keywords like "date", "agent", "emp", etc.)
  for (let i = 0; i < Math.min(rows.length, 5); i++) {
    const row = rows[i];
    if (!row) continue;
    
    // Check if this row has substantial text and matches typical headers
    const hasKeyColumns = row.some(cell => {
      if (!cell) return false;
      const norm = normalizeHeader(cell);
      return norm.includes('date') || norm.includes('agent') || norm.includes('emp') || norm.includes('chat') || norm.includes('ticket');
    });

    if (hasKeyColumns) {
      headerRowIdx = i;
      break;
    }
  }

  const headerRow = rows[headerRowIdx] || [];
  headerRow.forEach((cell, idx) => {
    if (cell !== null && cell !== undefined) {
      const norm = normalizeHeader(cell);
      if (norm) {
        headerMap.set(norm, idx);
      }
    }
  });

  return {
    headerMap,
    startRowIdx: headerRowIdx + 1
  };
}

// Map a single row of cells into a typed object based on aliases
function mapRow<T>(row: any[], headerMap: Map<string, number>, mappings: Record<keyof T, string[]>): T {
  const result = {} as T;
  
  for (const key in mappings) {
    const aliases = mappings[key as keyof T];
    let foundIdx = -1;
    for (const alias of aliases) {
      const normAlias = normalizeHeader(alias);
      if (headerMap.has(normAlias)) {
        foundIdx = headerMap.get(normAlias)!;
        break;
      }
    }
    
    const rawVal = foundIdx !== -1 && foundIdx < row.length ? row[foundIdx] : null;
    result[key as keyof T] = rawVal as any;
  }
  
  return result;
}

export function parseExcelFile(buffer: ArrayBuffer): OperationsDataset {
  // Read spreadsheet, parsing dates as Date objects
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  
  const dsat: DSATAudit[] = [];
  const aht: AHTAudit[] = [];
  const escalations: SMEscalation[] = [];
  const shrinkage: ShrinkageRecord[] = [];
  const performance: AgentKPI[] = [];

  // Sheet name mappings in the excel workbook
  // Expected names: 'DSAT', 'AHT', 'SM Escalations', 'Shrinkage', 'Performance'
  
  // 1. Parse DSAT Sheet
  const dsatSheet = workbook.Sheets['DSAT'];
  if (dsatSheet) {
    const rows = XLSX.utils.sheet_to_json<any[]>(dsatSheet, { header: 1 });
    const { headerMap, startRowIdx } = mapHeaders(rows);
    
    const mappings: Record<keyof DSATAudit, string[]> = {
      agentId: ['agentid', 'ldapemail'],
      agentName: ['agentname', 'ldapname'],
      date: ['dsatdate', 'date'],
      ldapEmail: ['ldapemail'],
      lob: ['lob'],
      observations: ['observations'],
      ticketId: ['ticketid'],
      orderId: ['orderid'],
      refunded: ['refunded'],
      teamLeader: ['teamleader', 'supervisor'],
      issueCategory: ['issuecategory'],
      issueSubCategory: ['issuesubcategory'],
      issueSubSubCategory: ['issuesubsubcategory'],
      rebuttalStatus: ['rebuttalstatus']
    };

    for (let i = startRowIdx; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0 || !row.some(c => c !== null && c !== '')) continue;
      const raw = mapRow<DSATAudit>(row, headerMap, mappings);
      
      // Clean data
      dsat.push({
        agentId: String(raw.agentId || '').trim(),
        agentName: String(raw.agentName || raw.agentId || '').trim(),
        date: parseExcelDate(raw.date),
        ldapEmail: String(raw.ldapEmail || '').trim(),
        lob: String(raw.lob || '').trim(),
        observations: String(raw.observations || '').trim(),
        ticketId: String(raw.ticketId || '').trim(),
        orderId: String(raw.orderId || '').trim(),
        refunded: String(raw.refunded || 'No').trim(),
        teamLeader: String(raw.teamLeader || '').trim(),
        issueCategory: String(raw.issueCategory || '').trim(),
        issueSubCategory: String(raw.issueSubCategory || '').trim(),
        issueSubSubCategory: String(raw.issueSubSubCategory || '').trim(),
        rebuttalStatus: String(raw.rebuttalStatus || 'Accept').trim(),
      });
    }
  }

  // 2. Parse AHT Sheet
  const ahtSheet = workbook.Sheets['AHT'];
  if (ahtSheet) {
    const rows = XLSX.utils.sheet_to_json<any[]>(ahtSheet, { header: 1 });
    const { headerMap, startRowIdx } = mapHeaders(rows);

    const mappings: Record<keyof AHTAudit, string[]> = {
      date: ['auditdate', 'transactiondate', 'date', '66dateformat'],
      agentEmail: ['agentemailid', 'agentemail', 'emailaddress'],
      ticketId: ['kaptureosticketid', 'ticketid', 'chatid'],
      theme: ['theme'],
      wasCallingRequired: ['wascallingrequiredonchat'],
      didAgentOutcall: ['didagentoutcall'],
      exactReason: ['whatisexactreasonforhighaht', 'exactreason'],
      betterReduction: ['whatcouldhavebeendonebettertoreduseaht', 'betterreduction'],
      processSuggestion: ['whatisyoursuggestiontoreduseaht', 'processsuggestion'],
      queueName: ['queuename', 'queue'],
      ahtOpportunity: ['ahtopportunity'],
      aht: ['aht'],
      dsat: ['dsat']
    };

    for (let i = startRowIdx; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0 || !row.some(c => c !== null && c !== '')) continue;
      const raw = mapRow<AHTAudit>(row, headerMap, mappings);

      aht.push({
        date: parseExcelDate(raw.date),
        agentEmail: String(raw.agentEmail || '').trim(),
        ticketId: String(raw.ticketId || '').trim(),
        theme: String(raw.theme || '').trim(),
        wasCallingRequired: String(raw.wasCallingRequired || 'No').trim(),
        didAgentOutcall: String(raw.didAgentOutcall || 'No').trim(),
        exactReason: String(raw.exactReason || '').trim(),
        betterReduction: String(raw.betterReduction || '').trim(),
        processSuggestion: String(raw.processSuggestion || '').trim(),
        queueName: String(raw.queueName || '').trim(),
        ahtOpportunity: String(raw.ahtOpportunity || '').trim(),
        aht: isNaN(Number(raw.aht)) ? 0 : Number(raw.aht),
        dsat: isNaN(Number(raw.dsat)) ? 0 : Number(raw.dsat)
      });
    }
  }

  // 3. Parse SM Escalations Sheet
  const smSheet = workbook.Sheets['SM Escalations'];
  if (smSheet) {
    const rows = XLSX.utils.sheet_to_json<any[]>(smSheet, { header: 1 });
    const { headerMap, startRowIdx } = mapHeaders(rows);

    const mappings: Record<keyof SMEscalation, string[]> = {
      date: ['date'],
      hour: ['hour'],
      ticketId: ['ticketid'],
      assignedAdvisor: ['assignedadvisor'],
      escalationType: ['escalationtype'],
      orderId: ['orderid'],
      supportTicket: ['supportticket'],
      l3Reason: ['l3reason'],
      store: ['store'],
      source: ['source'],
      agentName: ['agentname'],
      agentEmail: ['agentemail'],
      queue: ['queue'],
      skuName: ['skuname'],
      vendor: ['vendor'],
      refundDeny: ['refunddenyyesno'],
      acpt: ['acpt'],
      l1: ['l1'],
      l2: ['l2']
    };

    for (let i = startRowIdx; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0 || !row.some(c => c !== null && c !== '')) continue;
      const raw = mapRow<SMEscalation>(row, headerMap, mappings);

      escalations.push({
        date: parseExcelDate(raw.date),
        hour: isNaN(Number(raw.hour)) ? 0 : Number(raw.hour),
        ticketId: String(raw.ticketId || '').trim(),
        assignedAdvisor: String(raw.assignedAdvisor || '').trim(),
        escalationType: String(raw.escalationType || '').trim(),
        orderId: String(raw.orderId || '').trim(),
        supportTicket: String(raw.supportTicket || '').trim(),
        l3Reason: String(raw.l3Reason || '').trim(),
        store: String(raw.store || '').trim(),
        source: String(raw.source || '').trim(),
        agentName: String(raw.agentName || '').trim(),
        agentEmail: String(raw.agentEmail || '').trim(),
        queue: String(raw.queue || '').trim(),
        skuName: String(raw.skuName || '').trim(),
        vendor: String(raw.vendor || '').trim(),
        refundDeny: String(raw.refundDeny || 'No').trim(),
        acpt: String(raw.acpt || '').trim(),
        l1: String(raw.l1 || '').trim(),
        l2: String(raw.l2 || '').trim()
      });
    }
  }

  // 4. Parse Shrinkage Sheet
  const shrinkageSheet = workbook.Sheets['Shrinkage'];
  if (shrinkageSheet) {
    const rows = XLSX.utils.sheet_to_json<any[]>(shrinkageSheet, { header: 1 });
    const { headerMap, startRowIdx } = mapHeaders(rows);

    const mappings: Record<keyof ShrinkageRecord, string[]> = {
      date: ['date'],
      empId: ['empid'],
      zeptoId: ['zeptoid', 'agentemail'],
      employeeName: ['employeename', 'employee'],
      supervisor: ['supervisor'],
      wfhWfo: ['wfhwfo'],
      queue: ['queue'],
      attendance: ['attendance'],
      actualLoginHrs: ['actualloginhrsincudingrefresher', 'actualloginhrs'],
      targetLoginHrs: ['target']
    };

    for (let i = startRowIdx; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0 || !row.some(c => c !== null && c !== '')) continue;
      const raw = mapRow<ShrinkageRecord>(row, headerMap, mappings);

      // We only want records that represent actual attendance logging
      if (!raw.employeeName && !raw.zeptoId) continue;

      shrinkage.push({
        date: parseExcelDate(raw.date),
        empId: isNaN(Number(raw.empId)) ? 0 : Number(raw.empId),
        zeptoId: String(raw.zeptoId || '').trim(),
        employeeName: String(raw.employeeName || '').trim(),
        supervisor: String(raw.supervisor || '').trim(),
        wfhWfo: String(raw.wfhWfo || '').trim(),
        queue: String(raw.queue || '').trim(),
        attendance: String(raw.attendance || 'P').trim(),
        actualLoginHrs: parseExcelDuration(raw.actualLoginHrs),
        targetLoginHrs: parseExcelDuration(raw.targetLoginHrs)
      });
    }
  }

  // 5. Parse Performance Sheet
  const performanceSheet = workbook.Sheets['Performance'];
  if (performanceSheet) {
    const rows = XLSX.utils.sheet_to_json<any[]>(performanceSheet, { header: 1 });
    const { headerMap, startRowIdx } = mapHeaders(rows);

    const mappings: Record<keyof AgentKPI, string[]> = {
      agentEmail: ['empcode', 'agentemail'],
      chatCount: ['chatcount'],
      frs: ['frs'],
      aht: ['aht'],
      waitime: ['waitime'],
      hcPresent: ['hcpresent'],
      cpa: ['cpa'],
      csat: ['csat'],
      dsat: ['dsat'],
      csatPercent: ['csatpercent', 'csat'],
      responsePercent: ['responsepercent', 'response'],
      knowmaxPercent: ['knowmaxpercent', 'knowmax'],
      sameDayRepeatPercent: ['samedayrepeatpercent', 'samedayrepeat'],
      productivity: ['productivity'],
      avgLoginHrs: ['avgloginhrs'],
      sumOfBreak: ['sumofbreak'],
      sumOfLoginHrs: ['sumofloginhrs']
    };

    for (let i = startRowIdx; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0 || !row.some(c => c !== null && c !== '')) continue;
      const raw = mapRow<AgentKPI>(row, headerMap, mappings);

      if (!raw.agentEmail) continue;

      performance.push({
        agentEmail: String(raw.agentEmail || '').trim(),
        chatCount: isNaN(Number(raw.chatCount)) ? 0 : Number(raw.chatCount),
        frs: parseExcelDuration(raw.frs),
        aht: parseExcelDuration(raw.aht),
        waitime: parseExcelDuration(raw.waitime),
        hcPresent: isNaN(Number(raw.hcPresent)) ? 0 : Number(raw.hcPresent),
        cpa: isNaN(Number(raw.cpa)) ? 0 : Number(raw.cpa),
        csat: isNaN(Number(raw.csat)) ? 0 : Number(raw.csat),
        dsat: isNaN(Number(raw.dsat)) ? 0 : Number(raw.dsat),
        csatPercent: isNaN(Number(raw.csatPercent)) ? 0 : Number(raw.csatPercent),
        responsePercent: isNaN(Number(raw.responsePercent)) ? 0 : Number(raw.responsePercent),
        knowmaxPercent: isNaN(Number(raw.knowmaxPercent)) ? 0 : Number(raw.knowmaxPercent),
        sameDayRepeatPercent: isNaN(Number(raw.sameDayRepeatPercent)) ? 0 : Number(raw.sameDayRepeatPercent),
        productivity: isNaN(Number(raw.productivity)) ? 0 : Number(raw.productivity),
        avgLoginHrs: parseExcelDuration(raw.avgLoginHrs),
        sumOfBreak: parseExcelDuration(raw.sumOfBreak),
        sumOfLoginHrs: parseExcelDuration(raw.sumOfLoginHrs)
      });
    }
  }

  return {
    dsat,
    aht,
    escalations,
    shrinkage,
    performance
  };
}
