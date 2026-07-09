import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { ExcelDataAdapter } from '../lib/dataAdapter';
import { loadWorkbookFromDB, saveWorkbookToDB, clearWorkbookFromDB } from '../lib/db';
import { parseExcelFile, validateWorkbook } from '../lib/excelParser';
import type { OperationsDataAdapter } from '../lib/dataAdapter';
import type { 
  OperationsDataset, 
  DSATAudit, 
  AHTAudit, 
  SMEscalation, 
  ShrinkageRecord, 
  AgentKPI 
} from '../types/data';

interface AgentListItem {
  email: string;
  name: string;
}

export type SourceType = 'default' | 'uploaded';

interface ExcelDataContextProps {
  loading: boolean;
  error: string | null;
  dataset: OperationsDataset | null;
  
  // Metadata
  sourceType: SourceType;
  fileName: string;
  lastUpdated: Date | null;
  
  // Global Filters
  startDate: Date | null;
  endDate: Date | null;
  selectedAgent: string | null; // email ID
  searchQuery: string;
  
  // Setters
  setStartDate: (date: Date | null) => void;
  setEndDate: (date: Date | null) => void;
  setSelectedAgent: (agent: string | null) => void;
  setSearchQuery: (query: string) => void;
  resetFilters: () => void;
  
  // Operations
  uploadWorkbook: (file: File) => Promise<boolean>;
  resetToDefault: () => Promise<void>;
  refreshData: () => Promise<void>;
  
  // Filtered Datasets
  filteredDsat: DSATAudit[];
  filteredAht: AHTAudit[];
  filteredEscalations: SMEscalation[];
  filteredShrinkage: ShrinkageRecord[];
  filteredPerformance: AgentKPI[];
  
  // Helpers
  agents: AgentListItem[];
  supervisors: string[];
  dateBounds: { min: Date; max: Date } | null;
}

const ExcelDataContext = createContext<ExcelDataContextProps | undefined>(undefined);

export const ExcelDataProvider: React.FC<{ children: React.ReactNode; adapter?: OperationsDataAdapter }> = ({ 
  children, 
  adapter 
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [dataset, setDataset] = useState<OperationsDataset | null>(null);

  // Metadata State
  const [sourceType, setSourceType] = useState<SourceType>('default');
  const [fileName, setFileName] = useState<string>('data.xlsx');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Filter State (persistent in localStorage)
  const [startDate, setStartDateState] = useState<Date | null>(() => {
    const saved = localStorage.getItem('filter_startDate');
    return saved ? new Date(saved) : null;
  });
  const [endDate, setEndDateState] = useState<Date | null>(() => {
    const saved = localStorage.getItem('filter_endDate');
    return saved ? new Date(saved) : null;
  });
  const [selectedAgent, setSelectedAgentState] = useState<string | null>(() => {
    return localStorage.getItem('filter_selectedAgent');
  });
  const [searchQuery, setSearchQueryState] = useState<string>(() => {
    return localStorage.getItem('filter_searchQuery') || '';
  });

  const setStartDate = React.useCallback((date: Date | null) => {
    setStartDateState(date);
    if (date) {
      localStorage.setItem('filter_startDate', date.toISOString());
    } else {
      localStorage.removeItem('filter_startDate');
    }
  }, []);

  const setEndDate = React.useCallback((date: Date | null) => {
    setEndDateState(date);
    if (date) {
      localStorage.setItem('filter_endDate', date.toISOString());
    } else {
      localStorage.removeItem('filter_endDate');
    }
  }, []);

  const setSelectedAgent = React.useCallback((agent: string | null) => {
    setSelectedAgentState(agent);
    if (agent) {
      localStorage.setItem('filter_selectedAgent', agent);
    } else {
      localStorage.removeItem('filter_selectedAgent');
    }
  }, []);

  const setSearchQuery = React.useCallback((query: string) => {
    setSearchQueryState(query);
    localStorage.setItem('filter_searchQuery', query);
  }, []);

  // Use the injected adapter or default to ExcelDataAdapter
  const defaultAdapter = useMemo(() => adapter || new ExcelDataAdapter('/data.xlsx'), [adapter]);

  // Load workbook (from IndexedDB if present, else fallback to public URL)
  const loadActiveWorkbook = async (forceRefresh: boolean = false) => {
    setLoading(true);
    setError(null);
    
    try {
      if (!forceRefresh) {
        // Try loading custom workbook from IndexedDB
        const storedBuffer = await loadWorkbookFromDB();
        if (storedBuffer) {
          // Retrieve metadata from local storage
          const metaStr = localStorage.getItem('workbook_meta');
          let name = 'uploaded_data.xlsx';
          let updated = new Date();
          
          if (metaStr) {
            try {
              const meta = JSON.parse(metaStr);
              name = meta.name || name;
              updated = meta.timestamp ? new Date(meta.timestamp) : updated;
            } catch (e) {
              console.error('Error parsing workbook metadata:', e);
            }
          }
          
          // Validate stored buffer
          const report = validateWorkbook(storedBuffer);
          if (report.valid) {
            const data = parseExcelFile(storedBuffer);
            setDataset(data);
            setSourceType('uploaded');
            setFileName(name);
            setLastUpdated(updated);
            setLoading(false);
            return;
          } else {
            console.warn('Persisted workbook in IndexedDB failed validation. Reverting to default.');
            await clearWorkbookFromDB();
            localStorage.removeItem('workbook_meta');
          }
        }
      }
      
      // Fallback: Fetch default /data.xlsx
      const data = await defaultAdapter.fetchData();
      setDataset(data);
      setSourceType('default');
      setFileName('data.xlsx');
      setLastUpdated(new Date());
      setLoading(false);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load operations workbook');
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadActiveWorkbook();
  }, [defaultAdapter]);

  // Expose upload action
  const uploadWorkbook = async (file: File): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const buffer = await file.arrayBuffer();
      
      // Validate
      const report = validateWorkbook(buffer);
      if (!report.valid) {
        throw new Error('Workbook failed schema validation. Check upload report for details.');
      }
      
      // Save to IndexedDB
      await saveWorkbookToDB(buffer);
      
      // Save metadata
      const timestamp = new Date();
      localStorage.setItem('workbook_meta', JSON.stringify({
        type: 'uploaded',
        name: file.name,
        timestamp: timestamp.toISOString()
      }));
      
      // Parse and set state
      const data = parseExcelFile(buffer);
      setDataset(data);
      setSourceType('uploaded');
      setFileName(file.name);
      setLastUpdated(timestamp);
      
      // Reset filter bounds to match the new file
      setStartDate(null);
      setEndDate(null);
      setSelectedAgent(null);
      setSearchQuery('');
      
      setLoading(false);
      return true;
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to upload and parse the workbook.');
      setLoading(false);
      return false;
    }
  };

  // Expose reset to default action
  const resetToDefault = async (): Promise<void> => {
    setLoading(true);
    try {
      await clearWorkbookFromDB();
      localStorage.removeItem('workbook_meta');
      
      // Reset filters
      setStartDate(null);
      setEndDate(null);
      setSelectedAgent(null);
      setSearchQuery('');
      
      await loadActiveWorkbook(true);
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Failed to clear custom database');
      setLoading(false);
    }
  };

  // Expose refresh data action
  const refreshData = async (): Promise<void> => {
    await loadActiveWorkbook(sourceType === 'default');
  };

  // Compute unified list of agents
  const agents = useMemo<AgentListItem[]>(() => {
    if (!dataset) return [];
    
    const emailToName = new Map<string, string>();
    const addAgent = (email: string, name: string) => {
      const cleanedEmail = email.trim().toLowerCase();
      if (!cleanedEmail) return;
      
      const cleanedName = name.trim();
      const existingName = emailToName.get(cleanedEmail);
      
      if (!existingName || (cleanedName && !cleanedName.includes('@') && (cleanedName.length > existingName.length || existingName.includes('@')))) {
        emailToName.set(cleanedEmail, cleanedName || cleanedEmail.split('@')[0]);
      }
    };

    dataset.dsat.forEach(d => addAgent(d.agentId, d.agentName));
    dataset.aht.forEach(a => addAgent(a.agentEmail, a.agentEmail.split('@')[0]));
    dataset.escalations.forEach(e => addAgent(e.agentEmail, e.agentName));
    dataset.shrinkage.forEach(s => addAgent(s.zeptoId, s.employeeName));
    dataset.performance.forEach(p => addAgent(p.agentEmail, p.agentEmail.split('@')[0]));

    return Array.from(emailToName.entries()).map(([email, name]) => ({
      email,
      name: name || email.split('@')[0]
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [dataset]);

  // Compute unified list of supervisors
  const supervisors = useMemo<string[]>(() => {
    if (!dataset) return [];
    
    const sups = new Set<string>();
    dataset.dsat.forEach(d => {
      if (d.teamLeader) sups.add(d.teamLeader);
    });
    dataset.shrinkage.forEach(s => {
      if (s.supervisor) sups.add(s.supervisor);
    });
    
    return Array.from(sups).filter(Boolean).sort();
  }, [dataset]);

  // Compute absolute date bounds across all sheets
  const dateBounds = useMemo(() => {
    if (!dataset) return null;
    
    const dates: number[] = [];
    
    dataset.dsat.forEach(d => dates.push(d.date.getTime()));
    dataset.aht.forEach(a => dates.push(a.date.getTime()));
    dataset.escalations.forEach(e => dates.push(e.date.getTime()));
    dataset.shrinkage.forEach(s => dates.push(s.date.getTime()));
    
    if (dates.length === 0) return null;
    
    return {
      min: new Date(Math.min(...dates)),
      max: new Date(Math.max(...dates))
    };
  }, [dataset]);

  // Sync default filter dates when bounds change
  useEffect(() => {
    if (dateBounds && !startDate && !endDate) {
      setStartDate(dateBounds.min);
      setEndDate(dateBounds.max);
    }
  }, [dateBounds, startDate, endDate]);

  const resetFilters = () => {
    if (dateBounds) {
      setStartDate(dateBounds.min);
      setEndDate(dateBounds.max);
    } else {
      setStartDate(null);
      setEndDate(null);
    }
    setSelectedAgent(null);
    setSearchQuery('');
  };

  // Helper date filtering function
  const isWithinDateRange = (date: Date) => {
    if (!startDate && !endDate) return true;
    
    const cellTime = date.getTime();
    const startLimit = startDate ? new Date(startDate.getTime()).setHours(0, 0, 0, 0) : -Infinity;
    const endLimit = endDate ? new Date(endDate.getTime()).setHours(23, 59, 59, 999) : Infinity;
    
    return cellTime >= startLimit && cellTime <= endLimit;
  };

  // Helper agent filtering function
  const isAgentMatch = (rowEmail: string, rowName?: string) => {
    if (!selectedAgent) return true;
    const target = selectedAgent.toLowerCase();
    const isEmailMatch = rowEmail.toLowerCase() === target;
    const isNameMatch = rowName ? rowName.toLowerCase() === target : false;
    return isEmailMatch || isNameMatch;
  };

  // Filtered DSAT
  const filteredDsat = useMemo(() => {
    if (!dataset) return [];
    return dataset.dsat.filter(item => {
      if (!isWithinDateRange(item.date)) return false;
      if (!isAgentMatch(item.agentId, item.agentName) && !isAgentMatch(item.ldapEmail)) return false;
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          item.agentId.toLowerCase().includes(query) ||
          item.agentName.toLowerCase().includes(query) ||
          item.ticketId.toLowerCase().includes(query) ||
          item.orderId.toLowerCase().includes(query) ||
          item.lob.toLowerCase().includes(query) ||
          item.teamLeader.toLowerCase().includes(query) ||
          item.issueCategory.toLowerCase().includes(query) ||
          item.issueSubCategory.toLowerCase().includes(query) ||
          item.observations.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [dataset, startDate, endDate, selectedAgent, searchQuery]);

  // Filtered AHT
  const filteredAht = useMemo(() => {
    if (!dataset) return [];
    return dataset.aht.filter(item => {
      if (!isWithinDateRange(item.date)) return false;
      if (!isAgentMatch(item.agentEmail)) return false;
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          item.agentEmail.toLowerCase().includes(query) ||
          item.ticketId.toLowerCase().includes(query) ||
          item.theme.toLowerCase().includes(query) ||
          item.queueName.toLowerCase().includes(query) ||
          item.exactReason.toLowerCase().includes(query) ||
          item.processSuggestion.toLowerCase().includes(query) ||
          item.ahtOpportunity.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [dataset, startDate, endDate, selectedAgent, searchQuery]);

  // Filtered SM Escalations
  const filteredEscalations = useMemo(() => {
    if (!dataset) return [];
    return dataset.escalations.filter(item => {
      if (!isWithinDateRange(item.date)) return false;
      if (!isAgentMatch(item.agentEmail, item.agentName) && !isAgentMatch(item.assignedAdvisor)) return false;
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          item.agentEmail.toLowerCase().includes(query) ||
          item.agentName.toLowerCase().includes(query) ||
          item.assignedAdvisor.toLowerCase().includes(query) ||
          item.ticketId.toLowerCase().includes(query) ||
          item.orderId.toLowerCase().includes(query) ||
          item.supportTicket.toLowerCase().includes(query) ||
          item.l3Reason.toLowerCase().includes(query) ||
          item.store.toLowerCase().includes(query) ||
          item.source.toLowerCase().includes(query) ||
          item.queue.toLowerCase().includes(query) ||
          item.skuName.toLowerCase().includes(query) ||
          item.vendor.toLowerCase().includes(query) ||
          item.l1.toLowerCase().includes(query) ||
          item.l2.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [dataset, startDate, endDate, selectedAgent, searchQuery]);

  // Filtered Shrinkage
  const filteredShrinkage = useMemo(() => {
    if (!dataset) return [];
    return dataset.shrinkage.filter(item => {
      if (!isWithinDateRange(item.date)) return false;
      if (!isAgentMatch(item.zeptoId, item.employeeName)) return false;
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          item.zeptoId.toLowerCase().includes(query) ||
          item.employeeName.toLowerCase().includes(query) ||
          item.supervisor.toLowerCase().includes(query) ||
          item.queue.toLowerCase().includes(query) ||
          item.attendance.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [dataset, startDate, endDate, selectedAgent, searchQuery]);

  // Filtered Performance
  const filteredPerformance = useMemo(() => {
    if (!dataset) return [];
    return dataset.performance.filter(item => {
      if (!isAgentMatch(item.agentEmail)) return false;
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return item.agentEmail.toLowerCase().includes(query);
      }
      return true;
    });
  }, [dataset, selectedAgent, searchQuery]);

  return (
    <ExcelDataContext.Provider value={{
      loading,
      error,
      dataset,
      sourceType,
      fileName,
      lastUpdated,
      startDate,
      endDate,
      selectedAgent,
      searchQuery,
      setStartDate,
      setEndDate,
      setSelectedAgent,
      setSearchQuery,
      resetFilters,
      uploadWorkbook,
      resetToDefault,
      refreshData,
      filteredDsat,
      filteredAht,
      filteredEscalations,
      filteredShrinkage,
      filteredPerformance,
      agents,
      supervisors,
      dateBounds
    }}>
      {children}
    </ExcelDataContext.Provider>
  );
};

export const useExcelData = () => {
  const context = useContext(ExcelDataContext);
  if (context === undefined) {
    throw new Error('useExcelData must be used within an ExcelDataProvider');
  }
  return context;
};
