import * as XLSX from 'xlsx';
import { workbookSchema } from '../config/workbookSchema';
import type { SheetSchema } from '../config/workbookSchema';
import type { 
  DSATAudit, 
  AHTAudit, 
  SMEscalation, 
  ShrinkageRecord, 
  AgentKPI, 
  OperationsDataset 
} from '../types/data';



// Robust date parsing
export function parseExcelDate(val: any): Date {
  if (val === null || val === undefined) return new Date();
  if (val instanceof Date) {
    if (!isNaN(val.getTime())) return val;
  }
  if (typeof val === 'number') {
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
    return Math.round(val * 86400);
  }
  if (val instanceof Date) {
    const hours = val.getHours();
    const minutes = val.getMinutes();
    const seconds = val.getSeconds();
    return hours * 3600 + minutes * 60 + seconds;
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed || trimmed === '-' || trimmed.toLowerCase() === 'none') return 0;
    
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

// Helper to calculate Levenshtein distance between two strings
function getLevenshteinDistance(s1: string, s2: string): number {
  const len1 = s1.length;
  const len2 = s2.length;
  const matrix: number[][] = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }
  return matrix[len1][len2];
}

// Calculate similarity ratio between 0.0 and 1.0
export function getSimilarity(s1: string, s2: string): number {
  const dist = getLevenshteinDistance(s1, s2);
  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 1.0;
  return 1.0 - dist / maxLen;
}

// Robust header normalization
export function normalizeHeader(name: any): string {
  if (name === null || name === undefined) return '';
  return name
    .toString()
    .toLowerCase()
    .replace(/[\s_\-\[\]\(\)\{\}\?\!\.\,\;\:\'\"\`]/g, '') // remove spaces, underscores, hyphens, brackets, punctuation
    .replace(/[^a-z0-9]/g, ''); // fallback to ensure pure alphanumeric
}

// Helper to determine the header row index and map schema keys directly to column indices
function mapHeaders(
  rows: any[][], 
  schema: SheetSchema
): { 
  headerMap: Map<string, number>; 
  startRowIdx: number; 
  warnings: string[];
  mappings: Array<{ original: string; mappedTo: string; type: 'exact' | 'alias' | 'fuzzy' }>;
} {
  const headerMap = new Map<string, number>();
  const warnings: string[] = [];
  const mappings: Array<{ original: string; mappedTo: string; type: 'exact' | 'alias' | 'fuzzy' }> = [];
  
  let headerRowIdx = 0;
  let maxMatches = -1;

  // Compile all valid aliases in schema (including normalized keys)
  const allAliases = new Set<string>();
  schema.columns.forEach(col => {
    allAliases.add(normalizeHeader(col.key));
    col.aliases.forEach(alias => allAliases.add(normalizeHeader(alias)));
  });

  // Search first 5 rows to find the row with the most matching aliases
  for (let i = 0; i < Math.min(rows.length, 5); i++) {
    const row = rows[i];
    if (!row) continue;
    
    let matches = 0;
    row.forEach(cell => {
      if (cell !== null && cell !== undefined) {
        const norm = normalizeHeader(cell);
        if (norm && allAliases.has(norm)) {
          matches++;
        }
      }
    });

    if (matches > maxMatches) {
      maxMatches = matches;
      headerRowIdx = i;
    }
  }

  const headerRow = rows[headerRowIdx] || [];
  const matchedIndices = new Set<number>();

  // Map columns by priorities:
  // 1. Exact match with key
  // 2. Exact match with alias
  // 3. Fuzzy match with key/alias (similarity >= 0.85)

  schema.columns.forEach(col => {
    const normKey = normalizeHeader(col.key);
    const normAliases = col.aliases.map(a => normalizeHeader(a));
    
    // Step 1: Exact key match
    let foundIdx = -1;
    for (let idx = 0; idx < headerRow.length; idx++) {
      if (matchedIndices.has(idx)) continue;
      const cell = headerRow[idx];
      if (cell !== null && cell !== undefined) {
        const normCell = normalizeHeader(cell);
        if (normCell === normKey) {
          foundIdx = idx;
          headerMap.set(col.key, idx);
          matchedIndices.add(idx);
          mappings.push({ original: String(cell), mappedTo: col.key, type: 'exact' });
          break;
        }
      }
    }
    if (foundIdx !== -1) return;

    // Step 2: Exact alias match
    for (let idx = 0; idx < headerRow.length; idx++) {
      if (matchedIndices.has(idx)) continue;
      const cell = headerRow[idx];
      if (cell !== null && cell !== undefined) {
        const normCell = normalizeHeader(cell);
        if (normAliases.includes(normCell)) {
          foundIdx = idx;
          headerMap.set(col.key, idx);
          matchedIndices.add(idx);
          mappings.push({ original: String(cell), mappedTo: col.key, type: 'alias' });
          warnings.push(`Mapped alias: "${cell}" -> "${col.key}"`);
          break;
        }
      }
    }
    if (foundIdx !== -1) return;

    // Step 3: Fuzzy similarity match
    let bestSimilarity = -1;
    let bestIdx = -1;
    let bestCellVal = '';

    for (let idx = 0; idx < headerRow.length; idx++) {
      if (matchedIndices.has(idx)) continue;
      const cell = headerRow[idx];
      if (cell !== null && cell !== undefined) {
        const normCell = normalizeHeader(cell);
        
        // Compare with key similarity
        const keySim = getSimilarity(normCell, normKey);
        if (keySim >= 0.85 && keySim > bestSimilarity) {
          bestSimilarity = keySim;
          bestIdx = idx;
          bestCellVal = String(cell);
        }

        // Compare with aliases similarity
        for (const alias of normAliases) {
          const aliasSim = getSimilarity(normCell, alias);
          if (aliasSim >= 0.85 && aliasSim > bestSimilarity) {
            bestSimilarity = aliasSim;
            bestIdx = idx;
            bestCellVal = String(cell);
          }
        }
      }
    }

    if (bestIdx !== -1) {
      headerMap.set(col.key, bestIdx);
      matchedIndices.add(bestIdx);
      mappings.push({ original: bestCellVal, mappedTo: col.key, type: 'fuzzy' });
      warnings.push(`Mapped fuzzy: "${bestCellVal}" -> "${col.key}" (similarity ${(bestSimilarity * 100).toFixed(0)}%)`);
    }
  });

  // Step 4: Warn about unused columns
  headerRow.forEach((cell, idx) => {
    if (cell !== null && cell !== undefined && !matchedIndices.has(idx)) {
      const cellStr = String(cell).trim();
      if (cellStr) {
        warnings.push(`Unused column in sheet: "${cellStr}"`);
      }
    }
  });

  // Developer logging in Dev environment
  const isDev = !!(import.meta.env && import.meta.env.DEV);
  if (isDev && mappings.length > 0) {
    console.log(`\n[Dev Mapping] Sheet: ${schema.name}`);
    console.log(`--------------------------------------------------------------------------------`);
    console.log(`${"Original Header".padEnd(45)} | ${"Internal Field".padEnd(20)} | Type`);
    console.log(`--------------------------------------------------------------------------------`);
    mappings.forEach(m => {
      console.log(`${m.original.substring(0, 44).padEnd(45)} | ${m.mappedTo.padEnd(20)} | ${m.type}`);
    });
    if (warnings.length > 0) {
      console.log(`Warnings (${warnings.length}):`);
      warnings.forEach(w => console.log(`  - ${w}`));
    }
    console.log(`--------------------------------------------------------------------------------\n`);
  }

  return {
    headerMap,
    startRowIdx: headerRowIdx + 1,
    warnings,
    mappings
  };
}

// Map a single row of cells into a typed object based on index mapping in headerMap
function mapRowBySchema<T>(row: any[], headerMap: Map<string, number>, schema: SheetSchema): T {
  const result = {} as T;
  schema.columns.forEach(col => {
    const foundIdx = headerMap.has(col.key) ? headerMap.get(col.key)! : -1;
    const rawVal = foundIdx !== -1 && foundIdx < row.length ? row[foundIdx] : null;
    result[col.key as keyof T] = rawVal as any;
  });
  return result;
}

export interface SheetValidationReport {
  name: string;
  exists: boolean;
  empty: boolean;
  missingColumns: string[];
  validColumns: string[];
  warnings: string[];
}

export interface ValidationReport {
  valid: boolean;
  sheets: SheetValidationReport[];
}

// Validate the uploaded workbook against our workbook schema config
export function validateWorkbook(buffer: ArrayBuffer): ValidationReport {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const report: ValidationReport = { valid: true, sheets: [] };

  for (const sheetKey in workbookSchema) {
    const schema = workbookSchema[sheetKey];
    const sheet = workbook.Sheets[schema.name];
    
    if (!sheet) {
      report.valid = false;
      report.sheets.push({
        name: schema.name,
        exists: false,
        empty: true,
        missingColumns: schema.columns.filter(c => c.required).map(c => c.key),
        validColumns: [],
        warnings: []
      });
      continue;
    }

    const rows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });
    if (rows.length <= 1) {
      report.valid = false;
      report.sheets.push({
        name: schema.name,
        exists: true,
        empty: true,
        missingColumns: schema.columns.filter(c => c.required).map(c => c.key),
        validColumns: [],
        warnings: []
      });
      continue;
    }

    const { headerMap, warnings } = mapHeaders(rows, schema);

    const missingColumns: string[] = [];
    const validColumns: string[] = [];

    schema.columns.forEach(col => {
      if (headerMap.has(col.key)) {
        validColumns.push(col.key);
      } else if (col.required) {
        missingColumns.push(col.key);
        report.valid = false;
      }
    });

    report.sheets.push({
      name: schema.name,
      exists: true,
      empty: false,
      missingColumns,
      validColumns,
      warnings
    });
  }

  return report;
}

export function parseExcelFile(buffer: ArrayBuffer): OperationsDataset {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  
  const dsat: DSATAudit[] = [];
  const aht: AHTAudit[] = [];
  const escalations: SMEscalation[] = [];
  const shrinkage: ShrinkageRecord[] = [];
  const performance: AgentKPI[] = [];
  
  // 1. Parse DSAT Sheet
  const dsatSchema = workbookSchema.dsat;
  const dsatSheet = workbook.Sheets[dsatSchema.name];
  if (dsatSheet) {
    const rows = XLSX.utils.sheet_to_json<any[]>(dsatSheet, { header: 1 });
    const { headerMap, startRowIdx } = mapHeaders(rows, dsatSchema);

    for (let i = startRowIdx; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0 || !row.some(c => c !== null && c !== '')) continue;
      const raw = mapRowBySchema<any>(row, headerMap, dsatSchema);
      
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
        acpt: String(raw.acpt || '').trim(),
      });
    }
  }

  // 2. Parse AHT Sheet
  const ahtSchema = workbookSchema.aht;
  const ahtSheet = workbook.Sheets[ahtSchema.name];
  if (ahtSheet) {
    const rows = XLSX.utils.sheet_to_json<any[]>(ahtSheet, { header: 1 });
    const { headerMap, startRowIdx } = mapHeaders(rows, ahtSchema);

    for (let i = startRowIdx; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0 || !row.some(c => c !== null && c !== '')) continue;
      const raw = mapRowBySchema<any>(row, headerMap, ahtSchema);

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
        dsat: isNaN(Number(raw.dsat)) ? 0 : Number(raw.dsat),
        acpt: String(raw.acpt || '').trim()
      });
    }
  }

  // 3. Parse SM Escalations Sheet
  const escalationsSchema = workbookSchema.escalations;
  const smSheet = workbook.Sheets[escalationsSchema.name];
  if (smSheet) {
    const rows = XLSX.utils.sheet_to_json<any[]>(smSheet, { header: 1 });
    const { headerMap, startRowIdx } = mapHeaders(rows, escalationsSchema);

    for (let i = startRowIdx; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0 || !row.some(c => c !== null && c !== '')) continue;
      const raw = mapRowBySchema<any>(row, headerMap, escalationsSchema);

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
  const shrinkageSchema = workbookSchema.shrinkage;
  const shrinkageSheet = workbook.Sheets[shrinkageSchema.name];
  if (shrinkageSheet) {
    const rows = XLSX.utils.sheet_to_json<any[]>(shrinkageSheet, { header: 1 });
    const { headerMap, startRowIdx } = mapHeaders(rows, shrinkageSchema);

    for (let i = startRowIdx; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0 || !row.some(c => c !== null && c !== '')) continue;
      const raw = mapRowBySchema<any>(row, headerMap, shrinkageSchema);

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
  const performanceSchema = workbookSchema.performance;
  const performanceSheet = workbook.Sheets[performanceSchema.name];
  if (performanceSheet) {
    const rows = XLSX.utils.sheet_to_json<any[]>(performanceSheet, { header: 1 });
    const { headerMap, startRowIdx } = mapHeaders(rows, performanceSchema);

    for (let i = startRowIdx; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0 || !row.some(c => c !== null && c !== '')) continue;
      const raw = mapRowBySchema<any>(row, headerMap, performanceSchema);

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
        avgLoginHrs: parseExcelDuration(raw.avgLoginHrs)
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
