import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ExcelDataProvider } from './context/ExcelDataContext';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { HomeDashboard } from './pages/Home';
import { DsatDashboard } from './pages/DSAT';
import { AhtDashboard } from './pages/AHT';
import { EscalationsDashboard } from './pages/Escalations';
import { ShrinkageDashboard } from './pages/Shrinkage';
import { KpiDashboard } from './pages/Performance';
import { UploadPage } from './pages/Upload';

function App() {
  return (
    <ExcelDataProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<DashboardLayout />}>
            {/* Overview / Home Dashboard */}
            <Route index element={<HomeDashboard />} />
            
            {/* Phase 2 concrete analytics views */}
            <Route path="dsat" element={<DsatDashboard />} />
            <Route path="aht" element={<AhtDashboard />} />
            <Route path="escalations" element={<EscalationsDashboard />} />
            <Route path="shrinkage" element={<ShrinkageDashboard />} />
            <Route path="kpi" element={<KpiDashboard />} />
            
            {/* Workbook Uploader and Manager */}
            <Route path="upload" element={<UploadPage />} />

            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ExcelDataProvider>
  );
}

export default App;
