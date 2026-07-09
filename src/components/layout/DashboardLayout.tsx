import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useExcelData } from '../../context/ExcelDataContext';
import { useTheme } from '../../hooks/useTheme';
import { FilterBar } from '../shared/FilterBar';
import { Button } from '../ui/button';
import { ErrorBoundary } from '../shared/ErrorBoundary';

declare const __APP_VERSION__: string;
declare const __BUILD_DATE__: string;
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
  AlertTriangle,
  Upload,
  RefreshCw,
  FileSpreadsheet
} from 'lucide-react';
import { cn } from '../../lib/utils';

export const DashboardLayout: React.FC = () => {
  const { 
    loading, 
    error, 
    sourceType, 
    fileName, 
    lastUpdated, 
    refreshData, 
    resetToDefault 
  } = useExcelData();
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
      case '/upload':
        return 'Data Sources Management';
      default:
        return 'QA & Ops Analytics';
    }
  };

  const formattedLastUpdated = React.useMemo(() => {
    if (!lastUpdated) return '';
    const dateStr = lastUpdated.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
    const timeStr = lastUpdated.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    return `${dateStr} ${timeStr}`;
  }, [lastUpdated]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r bg-white dark:bg-slate-900 shrink-0">
        <div className="flex items-center gap-2 h-16 px-6 border-b">
          <Database className="w-5 h-5 text-indigo-500" />
          <span className="font-bold text-lg tracking-tight">OpsAnalytics</span>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
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
          
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <NavLink to="/upload" className={navLinkClass}>
              <Upload className="w-4 h-4" />
              Workbook Manager
            </NavLink>
          </div>
        </nav>

        {/* Sidebar Footer / Theme Toggle */}
        <div className="p-4 border-t flex flex-col gap-2 bg-slate-50/50 dark:bg-slate-900/50 select-none">
          <div className="flex items-center justify-between">
            <div className="flex flex-col text-[10px] text-slate-450 dark:text-slate-500 font-mono">
              <span className="font-semibold text-slate-600 dark:text-slate-450">v{__APP_VERSION__} (Production)</span>
              <span>Build: {__BUILD_DATE__}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-8 w-8 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
              {isDark ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-6 py-4 gap-3 border-b bg-white dark:bg-slate-900 shrink-0">
          <div>
            <h1 className="text-lg font-semibold">{getPageTitle()}</h1>
            {!loading && !error && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-450 mt-1">
                <span className="flex items-center gap-1">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-slate-400" />
                  Source: <strong className="capitalize">{sourceType}</strong> ({fileName})
                </span>
                {lastUpdated && (
                  <span>
                    Last Updated: <strong>{formattedLastUpdated}</strong>
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {sourceType === 'uploaded' && (
              <Button
                variant="outline"
                size="sm"
                onClick={resetToDefault}
                className="text-xs h-8"
              >
                Reset Default
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={refreshData}
              className="flex items-center gap-1 text-xs h-8"
              title="Reload file from source"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </Button>
          </div>
        </header>

        {/* View Layout Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              <p className="text-sm text-slate-500 dark:text-slate-400">Loading operations workbook...</p>
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
                  <li>Verify the workbook format matches the expected sheet structure.</li>
                  <li>Click <button onClick={resetToDefault} className="underline font-bold text-red-650 hover:text-red-800">Reset Default</button> to fall back to the standard dataset.</li>
                  <li>Ensure the file is not corrupted or password-protected.</li>
                </ol>
              </div>
            </div>
          ) : (
            <>
              {/* Global Filters */}
              {location.pathname !== '/upload' && <FilterBar />}

              {/* Outlet for routes with local Suspense boundary and ErrorBoundary */}
              <div className="flex-grow">
                <React.Suspense fallback={
                  <div className="flex flex-col items-center justify-center h-48 gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                    <span className="text-xs text-slate-400">Loading dashboard...</span>
                  </div>
                }>
                  <ErrorBoundary>
                    <Outlet />
                  </ErrorBoundary>
                </React.Suspense>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};
