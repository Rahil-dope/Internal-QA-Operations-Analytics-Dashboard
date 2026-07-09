import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ExcelDataProvider } from './context/ExcelDataContext';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { Loader2 } from 'lucide-react';

// Lazy load page views for optimized code splitting
const HomeDashboard = lazy(() => import('./pages/Home').then(m => ({ default: m.HomeDashboard })));
const DsatDashboard = lazy(() => import('./pages/DSAT').then(m => ({ default: m.DsatDashboard })));
const AhtDashboard = lazy(() => import('./pages/AHT').then(m => ({ default: m.AhtDashboard })));
const EscalationsDashboard = lazy(() => import('./pages/Escalations').then(m => ({ default: m.EscalationsDashboard })));
const ShrinkageDashboard = lazy(() => import('./pages/Shrinkage').then(m => ({ default: m.ShrinkageDashboard })));
const KpiDashboard = lazy(() => import('./pages/Performance').then(m => ({ default: m.KpiDashboard })));
const UploadPage = lazy(() => import('./pages/Upload').then(m => ({ default: m.UploadPage })));
const NotFound = lazy(() => import('./pages/NotFound').then(m => ({ default: m.NotFound })));

// Dynamic loading fallback screen
const RouteLoader = () => (
  <div className="flex flex-col items-center justify-center h-64 gap-3">
    <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
    <p className="text-xs text-slate-550 dark:text-slate-400">Loading view...</p>
  </div>
);

function App() {
  return (
    <ExcelDataProvider>
      <BrowserRouter>
        <Suspense fallback={<RouteLoader />}>
          <Routes>
            <Route path="/" element={<DashboardLayout />}>
              {/* Overview / Home Dashboard */}
              <Route index element={<HomeDashboard />} />
              
              {/* Quality details views */}
              <Route path="dsat" element={<DsatDashboard />} />
              <Route path="aht" element={<AhtDashboard />} />
              <Route path="escalations" element={<EscalationsDashboard />} />
              <Route path="shrinkage" element={<ShrinkageDashboard />} />
              <Route path="kpi" element={<KpiDashboard />} />
              
              {/* Workbook Uploader and Manager */}
              <Route path="upload" element={<UploadPage />} />

              {/* Fallback route */}
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ExcelDataProvider>
  );
}

export default App;
