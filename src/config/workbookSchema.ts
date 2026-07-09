export type ColumnType = 'string' | 'number' | 'date' | 'duration';

export interface ColumnSchema {
  key: string;
  aliases: string[];
  type: ColumnType;
  required: boolean;
}

export interface SheetSchema {
  name: string;
  columns: ColumnSchema[];
}

export const workbookSchema: Record<string, SheetSchema> = {
  dsat: {
    name: 'DSAT',
    columns: [
      { key: 'agentId', aliases: ['agentid', 'ldapemail', 'ldapid', 'agentemail'], type: 'string', required: true },
      { key: 'agentName', aliases: ['agentname', 'ldapname', 'agent'], type: 'string', required: true },
      { key: 'date', aliases: ['dsatdate', 'date', 'auditdate'], type: 'date', required: true },
      { key: 'ldapEmail', aliases: ['ldapemail', 'email', 'agentid'], type: 'string', required: false },
      { key: 'lob', aliases: ['lob', 'queue', 'pod'], type: 'string', required: false },
      { key: 'observations', aliases: ['observations', 'observation', 'remarks', 'comments'], type: 'string', required: true },
      { key: 'ticketId', aliases: ['ticketid', 'kaptureid', 'supportticket', 'chatid'], type: 'string', required: true },
      { key: 'orderId', aliases: ['orderid', 'orderno'], type: 'string', required: false },
      { key: 'refunded', aliases: ['refunded', 'refundstatus'], type: 'string', required: false },
      { key: 'teamLeader', aliases: ['teamleader', 'supervisor', 'tl', 'manager'], type: 'string', required: false },
      { key: 'issueCategory', aliases: ['issuecategory', 'theme', 'category'], type: 'string', required: true },
      { key: 'issueSubCategory', aliases: ['issuesubcategory', 'subcategory'], type: 'string', required: false },
      { key: 'issueSubSubCategory', aliases: ['issuesubsubcategory', 'subsubcategory'], type: 'string', required: false },
      { key: 'acpt', aliases: ['acpt', 'accountability', 'responsibility'], type: 'string', required: true },
      { key: 'rebuttalStatus', aliases: ['rebuttalstatus', 'rebuttal'], type: 'string', required: false }
    ]
  },
  aht: {
    name: 'AHT',
    columns: [
      { key: 'date', aliases: ['auditdate', 'transactiondate', 'date', '66dateformat'], type: 'date', required: true },
      { key: 'agentEmail', aliases: ['agentemailid', 'agentemail', 'emailaddress', 'email', 'agentid'], type: 'string', required: true },
      { key: 'ticketId', aliases: ['kaptureosticketid', 'ticketid', 'chatid', 'supportticket'], type: 'string', required: true },
      { key: 'theme', aliases: ['theme', 'category', 'topic'], type: 'string', required: false },
      { key: 'wasCallingRequired', aliases: ['wascallingrequiredonchat', 'callingrequired'], type: 'string', required: false },
      { key: 'didAgentOutcall', aliases: ['didagentoutcall', 'outcall'], type: 'string', required: false },
      { key: 'exactReason', aliases: ['whatisexactreasonforhighaht', 'exactreason', 'highahtreason', 'reason'], type: 'string', required: true },
      { key: 'betterReduction', aliases: ['whatcouldhavebeendonebettertoreduseaht', 'betterreduction', 'coachingpoints'], type: 'string', required: false },
      { key: 'processSuggestion', aliases: ['whatisyoursuggestiontoreduseaht', 'whatisyourprocesssuggestiontoredusetheaht', 'processsuggestion'], type: 'string', required: false },
      { key: 'queueName', aliases: ['queuename', 'queue', 'lob'], type: 'string', required: false },
      { key: 'ahtOpportunity', aliases: ['ahtopportunity', 'opportunity'], type: 'string', required: false },
      { key: 'aht', aliases: ['aht', 'handle_time', 'duration'], type: 'number', required: true },
      { key: 'dsat', aliases: ['dsat', 'dsat_score'], type: 'number', required: false },
      { key: 'acpt', aliases: ['acpt', 'accountability', 'error_type'], type: 'string', required: true }
    ]
  },
  escalations: {
    name: 'SM Escalations',
    columns: [
      { key: 'date', aliases: ['date', 'createddate'], type: 'date', required: true },
      { key: 'hour', aliases: ['hour', 'timehour'], type: 'number', required: false },
      { key: 'ticketId', aliases: ['ticketid', 'chatid'], type: 'string', required: true },
      { key: 'assignedAdvisor', aliases: ['assignedadvisor', 'advisor', 'qa'], type: 'string', required: false },
      { key: 'escalationType', aliases: ['escalationtype', 'type', 'escalationlevel'], type: 'string', required: false },
      { key: 'orderId', aliases: ['orderid', 'order_no'], type: 'string', required: false },
      { key: 'supportTicket', aliases: ['supportticket', 'ticket_no'], type: 'string', required: false },
      { key: 'l3Reason', aliases: ['l3reason', 'reason', 'l3_reason'], type: 'string', required: true },
      { key: 'store', aliases: ['store', 'storename', 'location'], type: 'string', required: false },
      { key: 'source', aliases: ['source', 'channel', 'platform'], type: 'string', required: false },
      { key: 'agentName', aliases: ['agentname', 'advisorname', 'employee'], type: 'string', required: true },
      { key: 'agentEmail', aliases: ['agentemail', 'email', 'advisorid'], type: 'string', required: true },
      { key: 'queue', aliases: ['queue', 'lob', 'pod'], type: 'string', required: false },
      { key: 'skuName', aliases: ['skuname', 'productname', 'sku'], type: 'string', required: false },
      { key: 'vendor', aliases: ['vendor', 'bpo'], type: 'string', required: false },
      { key: 'refundDeny', aliases: ['refunddenyyesno', 'refunddenied'], type: 'string', required: false },
      { key: 'acpt', aliases: ['acpt', 'accountability', 'responsibility'], type: 'string', required: true },
      { key: 'l1', aliases: ['l1', 'level1', 'l1reason'], type: 'string', required: false },
      { key: 'l2', aliases: ['l2', 'level2', 'l2reason'], type: 'string', required: false }
    ]
  },
  shrinkage: {
    name: 'Shrinkage',
    columns: [
      { key: 'date', aliases: ['date', 'workdate'], type: 'date', required: true },
      { key: 'empId', aliases: ['empid', 'employeeid', 'code'], type: 'number', required: false },
      { key: 'zeptoId', aliases: ['zeptoid', 'agentemail', 'email', 'agentid'], type: 'string', required: true },
      { key: 'employeeName', aliases: ['employeename', 'employee', 'name', 'agentname'], type: 'string', required: true },
      { key: 'supervisor', aliases: ['supervisor', 'teamleader', 'tl'], type: 'string', required: false },
      { key: 'wfhWfo', aliases: ['wfhwfo', 'wfh_wfo', 'mode'], type: 'string', required: false },
      { key: 'queue', aliases: ['queue', 'lob'], type: 'string', required: false },
      { key: 'attendance', aliases: ['attendance', 'status', 'attendancestate'], type: 'string', required: true },
      { key: 'actualLoginHrs', aliases: ['actualloginhrsincudingrefresher', 'actualloginhrs', 'loginhours', 'login_time'], type: 'duration', required: false },
      { key: 'targetLoginHrs', aliases: ['target', 'targethours', 'roster_hours'], type: 'duration', required: false }
    ]
  },
  performance: {
    name: 'Performance',
    columns: [
      { key: 'agentEmail', aliases: ['empcode', 'agentemail', 'email', 'agentid'], type: 'string', required: true },
      { key: 'chatCount', aliases: ['chatcount', 'chats', 'volume'], type: 'number', required: true },
      { key: 'frs', aliases: ['frs', 'firstresponsetime'], type: 'duration', required: false },
      { key: 'aht', aliases: ['aht', 'avg_handle_time', 'handle_time'], type: 'duration', required: true },
      { key: 'waitime', aliases: ['waitime', 'avg_wait_time', 'waittime'], type: 'duration', required: false },
      { key: 'hcPresent', aliases: ['hcpresent', 'headcount', 'attendance'], type: 'number', required: false },
      { key: 'cpa', aliases: ['cpa', 'cpa_score', 'cpa_rating'], type: 'number', required: true },
      { key: 'csat', aliases: ['csat', 'csat_count'], type: 'number', required: false },
      { key: 'dsat', aliases: ['dsat', 'dsat_count'], type: 'number', required: false },
      { key: 'csatPercent', aliases: ['csatpercent', 'csat', 'csat%'], type: 'number', required: true },
      { key: 'responsePercent', aliases: ['responsepercent', 'response', 'response%'], type: 'number', required: false },
      { key: 'knowmaxPercent', aliases: ['knowmaxpercent', 'knowmax', 'knowmax%'], type: 'number', required: false },
      { key: 'sameDayRepeatPercent', aliases: ['samedayrepeatpercent', 'samedayrepeat', 'repeat%'], type: 'number', required: false },
      { key: 'productivity', aliases: ['productivity', 'utilization'], type: 'number', required: false },
      { key: 'avgLoginHrs', aliases: ['avgloginhrs', 'loginhours'], type: 'duration', required: false }
    ]
  }
};
