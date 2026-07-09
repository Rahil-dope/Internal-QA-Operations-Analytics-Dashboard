import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useExcelData } from '../../context/ExcelDataContext';
import { useTheme } from '../../hooks/useTheme';
import { FilterBar } from '../shared/FilterBar';
import { Button } from '../ui/button';
import { 
  LayoutDashboard, 
  FileWarning, 
  Clock, 
  Share2, 
  UserX, 
  UserCheck, 
  Sun, 
  Moon, 
  Database,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { cn } from '../../lib/utils';

export const DashboardLayout: React.FC = () => {
  const { loading, error } = useExcelData();
  const { toggleTheme, isDark } = useTheme();
  const location = useLocation();

  // Helper to determine active link styling
  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
      isActive
        ? "bg-slate-900 text-white dark:bg-slate-50 dark:text-slate-950"
        : "text-slate-650 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-50"
    );

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return 'Overview Dashboard';
      case '/dsat':
        return 'DSAT Analysis';
      case '/aht':
        return 'AHT Opportunities';
      case '/escalations':
        return 'Social Media Escalations';
      case '/shrinkage':
        return 'Attendance & Shrinkage';
      case '/kpi':
        return 'Agent KPI Summary';
      default:
        return 'QA & Ops Analytics';
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r bg-white dark:bg-slate-900">
        <div className="flex items-center gap-2 h-16 px-6 border-b">
          <Database className="w-5 h-5 text-indigo-500" />
          <span className="font-bold text-lg tracking-tight">OpsAnalytics</span>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1">
          <NavLink to="/" className={navLinkClass}>
            <LayoutDashboard className="w-4 h-4" />
            Overview Dashboard
          </NavLink>
          <NavLink to="/dsat" className={navLinkClass}>
            <FileWarning className="w-4 h-4" />
            DSAT Audits
          </NavLink>
          <NavLink to="/aht" className={navLinkClass}>
            <Clock className="w-4 h-4" />
            AHT Audits
          </NavLink>
          <NavLink to="/escalations" className={navLinkClass}>
            <Share2 className="w-4 h-4" />
            SM Escalations
          </NavLink>
          <NavLink to="/shrinkage" className={navLinkClass}>
            <UserX className="w-4 h-4" />
            Shrinkage
          </NavLink>
          <NavLink to="/kpi" className={navLinkClass}>
            <UserCheck className="w-4 h-4" />
            Agent KPI Summary
          </NavLink>
        </nav>

        {/* Sidebar Footer / Theme Toggle */}
        <div className="p-4 border-t flex items-center justify-between">
          <span className="text-xs text-slate-400">v1.0.0 (Phase 1)</span>
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {isDark ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4" />}
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between h-16 px-6 border-b bg-white dark:bg-slate-900">
          <h1 className="text-lg font-semibold">{getPageTitle()}</h1>
          <div className="flex items-center gap-4">
            <span className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-full dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              Source: Local Excel
            </span>
          </div>
        </header>

        {/* View Layout Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              <p className="text-sm text-slate-500 dark:text-slate-400">Loading operations workbook from `/public/data.xlsx`...</p>
            </div>
          ) : error ? (
            <div className="p-6 max-w-xl mx-auto mt-12 border border-red-200 bg-red-50 rounded-lg dark:bg-red-950/20 dark:border-red-900/50 flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-red-500 shrink-0" />
                <div>
                  <h3 className="font-semibold text-red-800 dark:text-red-400">Error Loading Workbook</h3>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
                </div>
              </div>
              <div className="text-xs text-red-700 dark:text-red-400 space-y-1.5 border-t border-red-200 dark:border-red-900/50 pt-3">
                <p className="font-bold">Troubleshooting steps:</p>
                <ol className="list-decimal pl-4 space-y-1">
                  <li>Verify `final review file.xlsx` was copied to `public/data.xlsx`.</li>
                  <li>Check if the file is locked or corrupted.</li>
                  <li>Ensure the dev server is running and you have access to the file root.</li>
                </ol>
              </div>
            </div>
          ) : (
            <>
              {/* Global Filters */}
              <FilterBar />

              {/* Outlet for routes */}
              <div className="flex-grow">
                <Outlet />
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};
