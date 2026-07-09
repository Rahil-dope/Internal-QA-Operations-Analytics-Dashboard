import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ExcelDataProvider } from './context/ExcelDataContext';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { HomeDashboard } from './pages/Home';
import { Phase2Placeholder } from './pages/Phase2Placeholder';

function App() {
  return (
    <ExcelDataProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<DashboardLayout />}>
            {/* Overview / Home Dashboard */}
            <Route index element={<HomeDashboard />} />
            
            {/* Phase 2 Placeholder Views */}
            <Route 
              path="dsat" 
              element={
                <Phase2Placeholder 
                  title="DSAT Analysis" 
                  description="Detailed auditing logs and root-cause failure breakdown for customer dissatisfaction events."
                  plannedFeatures={[
                    "Failed audit categorization breakdown (Product vs Policy vs Agent)",
                    "Historical agent failure ratios and trend overlay",
                    "LOB queue fail-rate correlation charts",
                    "Rebuttal validation and outcome tracking"
                  ]}
                />
              } 
            />
            <Route 
              path="aht" 
              element={
                <Phase2Placeholder 
                  title="AHT Opportunities" 
                  description="Detailed Average Handling Time audits and workflow opportunity highlights."
                  plannedFeatures={[
                    "Outcall requirements vs actual performance comparison",
                    "Drilldown charts for high AHT opportunities and reason groupings",
                    "Advisor recommendation frequency text clouds",
                    "Queue-wise AHT audit distribution"
                  ]}
                />
              } 
            />
            <Route 
              path="escalations" 
              element={
                <Phase2Placeholder 
                  title="Social Media Escalations" 
                  description="Customer escalation tickets raised through social media channels."
                  plannedFeatures={[
                    "Escalation severity breakdown (E1, E2, E3 levels)",
                    "Social channel distribution matrices (Twitter/X, Instagram, etc.)",
                    "Store location and SKU refund compliance metrics",
                    "Root cause classification tree (L1, L2, L3 reasons)"
                  ]}
                />
              } 
            />
            <Route 
              path="shrinkage" 
              element={
                <Phase2Placeholder 
                  title="Attendance & Shrinkage" 
                  description="Workforce attendance tracking, planned leaves, and login deficit analysis."
                  plannedFeatures={[
                    "Real-time login deficit tracker vs operations targets",
                    "Unplanned shrinkage vs planned leave trends",
                    "Daily attendance calendar view per agent",
                    "Location-based WFH vs WFO roster compliance"
                  ]}
                />
              } 
            />
            <Route 
              path="kpi" 
              element={
                <Phase2Placeholder 
                  title="Agent KPI Summary" 
                  description="Monthly baseline overview of agent efficiency, speed, productivity, and CSAT scores."
                  plannedFeatures={[
                    "Chat volume vs Average AHT correlation scatter charts",
                    "CSAT % and CPA performance quadrant mapping",
                    "Custom date-range KPI calculation engine",
                    "Multi-agent side-by-side performance cards"
                  ]}
                />
              } 
            />

            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ExcelDataProvider>
  );
}

export default App;
