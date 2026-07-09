import React from 'react';
import { useExcelData } from '../../context/ExcelDataContext';
import { Input } from '../ui/input';
import { Select } from '../ui/select';
import { Button } from '../ui/button';
import { Search, RotateCcw, Calendar, User } from 'lucide-react';

const toDateString = (date: Date | null): string => {
  if (!date) return '';
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const FilterBar: React.FC = () => {
  const {
    startDate,
    endDate,
    selectedAgent,
    searchQuery,
    setStartDate,
    setEndDate,
    setSelectedAgent,
    setSearchQuery,
    resetFilters,
    agents,
    dateBounds
  } = useExcelData();

  const handleAgentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedAgent(val === 'ALL' ? null : val);
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setStartDate(val ? new Date(val) : null);
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEndDate(val ? new Date(val) : null);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Check if any filters are active/dirty compared to default bounds
  const hasActiveFilters = React.useMemo(() => {
    if (selectedAgent !== null) return true;
    if (searchQuery !== '') return true;
    
    if (dateBounds) {
      const defaultStart = toDateString(dateBounds.min);
      const defaultEnd = toDateString(dateBounds.max);
      const currentStart = toDateString(startDate);
      const currentEnd = toDateString(endDate);
      if (defaultStart !== currentStart || defaultEnd !== currentEnd) return true;
    }
    return false;
  }, [startDate, endDate, selectedAgent, searchQuery, dateBounds]);

  const agentOptions = React.useMemo(() => {
    const list = [{ value: 'ALL', label: 'All Agents' }];
    agents.forEach(a => {
      list.push({ value: a.email, label: a.name });
    });
    return list;
  }, [agents]);

  return (
    <div className="flex flex-col gap-4 p-4 border rounded-lg bg-white dark:bg-slate-900 shadow-sm md:flex-row md:items-center md:justify-between">
      <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4">
        {/* Agent Filter */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <User className="w-3 h-3" /> Agent
          </label>
          <Select
            options={agentOptions}
            value={selectedAgent || 'ALL'}
            onChange={handleAgentChange}
            className="w-full h-9"
          />
        </div>

        {/* Start Date */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Calendar className="w-3 h-3" /> Start Date
          </label>
          <Input
            type="date"
            value={toDateString(startDate)}
            min={dateBounds ? toDateString(dateBounds.min) : undefined}
            max={dateBounds ? toDateString(dateBounds.max) : undefined}
            onChange={handleStartDateChange}
            className="w-full h-9 dark:color-scheme-dark"
          />
        </div>

        {/* End Date */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Calendar className="w-3 h-3" /> End Date
          </label>
          <Input
            type="date"
            value={toDateString(endDate)}
            min={dateBounds ? toDateString(dateBounds.min) : undefined}
            max={dateBounds ? toDateString(dateBounds.max) : undefined}
            onChange={handleEndDateChange}
            className="w-full h-9 dark:color-scheme-dark"
          />
        </div>

        {/* Search Query */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Search className="w-3 h-3" /> Search
          </label>
          <div className="relative">
            <Input
              type="text"
              placeholder="Search ticket, order, etc..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full h-9"
            />
          </div>
        </div>
      </div>

      {/* Reset Button */}
      {hasActiveFilters && (
        <div className="flex items-end justify-end pt-2 md:pt-0">
          <Button
            variant="outline"
            size="sm"
            onClick={resetFilters}
            className="flex items-center gap-1.5 h-9"
          >
            <RotateCcw className="w-4 h-4" /> Reset Filters
          </Button>
        </div>
      )}
    </div>
  );
};
