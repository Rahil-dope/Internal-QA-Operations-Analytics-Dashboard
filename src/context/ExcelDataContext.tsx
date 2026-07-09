import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { ExcelDataAdapter } from '../lib/dataAdapter';
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

interface ExcelDataContextProps {
  loading: boolean;
  error: string | null;
  dataset: OperationsDataset | null;
  
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

  // Filter State
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Use the injected adapter or default to ExcelDataAdapter
  const dataAdapter = useMemo(() => adapter || new ExcelDataAdapter('/data.xlsx'), [adapter]);

  // Load data
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    
    dataAdapter.fetchData()
      .then(data => {
        if (!active) return;
        setDataset(data);
        setLoading(false);
      })
      .catch(err => {
        if (!active) return;
        console.error(err);
        setError(err.message || 'Failed to load operations data');
        setLoading(false);
      });
      
    return () => {
      active = false;
    };
  }, [dataAdapter]);

  // Compute unified list of agents
  const agents = useMemo<AgentListItem[]>(() => {
    if (!dataset) return [];
    
    const emailToName = new Map<string, string>();
    
    // Helper to add emails and names, ensuring we keep names instead of emails where possible
    const addAgent = (email: string, name: string) => {
      const cleanedEmail = email.trim().toLowerCase();
      if (!cleanedEmail) return;
      
      const cleanedName = name.trim();
      const existingName = emailToName.get(cleanedEmail);
      
      // If we don't have a name yet, or the current name is better (more characters, not an email itself)
      if (!existingName || (cleanedName && !cleanedName.includes('@') && (cleanedName.length > existingName.length || existingName.includes('@')))) {
        emailToName.set(cleanedEmail, cleanedName || cleanedEmail.split('@')[0]);
      }
    };

    // Populate from all sheets
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

  // Set default dates based on workbook bounds
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
    
    // Adjust start date to beginning of day
    const startLimit = startDate ? new Date(startDate.getTime()).setHours(0, 0, 0, 0) : -Infinity;
    // Adjust end date to end of day
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

  // Apply filters to DSAT
  const filteredDsat = useMemo(() => {
    if (!dataset) return [];
    return dataset.dsat.filter(item => {
      // Date filter
      if (!isWithinDateRange(item.date)) return false;
      // Agent filter
      if (!isAgentMatch(item.agentId, item.agentName) && !isAgentMatch(item.ldapEmail)) return false;
      
      // Search query
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

  // Apply filters to AHT
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

  // Apply filters to SM Escalations
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

  // Apply filters to Shrinkage
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

  // Apply filters to Performance (Agent KPI Summary)
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
      startDate,
      endDate,
      selectedAgent,
      searchQuery,
      setStartDate,
      setEndDate,
      setSelectedAgent,
      setSearchQuery,
      resetFilters,
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
    throw new Error('useExcelData must be used within an ExcelDataProviderWrapper');
  }
  return context;
};
