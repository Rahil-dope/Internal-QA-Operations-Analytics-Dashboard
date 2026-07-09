export interface DSATAudit {
  agentId: string; // Agentid
  agentName: string; // Agentname
  date: Date; // Dsat Date
  ldapEmail: string; // Ldap Email
  lob: string; // Lob
  observations: string; // Observations
  ticketId: string; // Ticket Id
  orderId: string; // Order Id
  refunded: string; // Refunded
  teamLeader: string; // Teamleader
  issueCategory: string; // Issue Category
  issueSubCategory: string; // Issue Sub Category
  issueSubSubCategory: string; // Issue Sub Sub Category
  rebuttalStatus: string; // Rebuttal Status
  acpt: string; // ACPT Accountability
}

export interface AHTAudit {
  date: Date; // Audit Date
  agentEmail: string; // Agent Email ID
  ticketId: string; // Kapture /OS Ticket ID
  theme: string; // Theme
  wasCallingRequired: string; // Was the Calling Required on Chat?
  didAgentOutcall: string; // Did the agent outcall?
  exactReason: string; // What is the exact reason for high AHT
  betterReduction: string; // What could have been done better to reduse AHT
  processSuggestion: string; // What is your Process Suggestion to reduse the AHT
  queueName: string; // Queue Name
  ahtOpportunity: string; // AHT Opportunity
  aht: number; // AHT
  dsat: number; // DSAT
  acpt: string; // ACPT Accountability
}

export interface SMEscalation {
  date: Date; // Date
  hour: number; // Hour
  ticketId: string; // Ticket Id
  assignedAdvisor: string; // Assigned advisor
  escalationType: string; // Escalation type
  orderId: string; // Order Id
  supportTicket: string; // Support Ticket
  l3Reason: string; // L3 Reason
  store: string; // Store
  source: string; // Source
  agentName: string; // Agent Name
  agentEmail: string; // Agent Email
  queue: string; // Queue
  skuName: string; // SKU Name
  vendor: string; // Vendor
  refundDeny: string; // Refund Deny Yes /No
  acpt: string; // ACPT
  l1: string; // L1
  l2: string; // L2
}

export interface ShrinkageRecord {
  date: Date; // Date
  empId: number; // Emp ID
  zeptoId: string; // Zepto ID
  employeeName: string; // Employee Name
  supervisor: string; // SUPERVISOR
  wfhWfo: string; // WFH/WFO
  queue: string; // Queue
  attendance: string; // Attendance ('P', 'A', 'PL', 'WOFF', 'HD')
  actualLoginHrs: number; // Actual Login Hrs(incuding refresher) in seconds
  targetLoginHrs: number; // Target in seconds
}

export interface AgentKPI {
  agentEmail: string; // Emp Code
  chatCount: number; // Chat Count
  frs: number; // FRS in seconds
  aht: number; // AHT in seconds
  waitime: number; // Waitime in seconds
  hcPresent: number; // HC Present
  cpa: number; // CPA
  csat: number; // CSAT
  dsat: number; // DSAT
  csatPercent: number; // Csat % (decimal, e.g. 0.51 = 51%)
  responsePercent: number; // Response % (decimal)
  knowmaxPercent: number; // Knowmax% (decimal)
  sameDayRepeatPercent: number; // Same day Repeat % (decimal)
  productivity: number; // Productivity
  avgLoginHrs: number; // AVG Login Hrs in seconds
  sumOfBreak?: number; // Sum of Break in seconds
  sumOfLoginHrs?: number; // Sum of Login Hrs in seconds
}

export interface OperationsDataset {
  dsat: DSATAudit[];
  aht: AHTAudit[];
  escalations: SMEscalation[];
  shrinkage: ShrinkageRecord[];
  performance: AgentKPI[];
}
