# OpsAnalytics - QA & Operations Analytics Dashboard

A production-ready internal QA and Operations Analytics Dashboard built using React, TypeScript, Vite, Tailwind CSS, and Recharts. This application automatically loads and parses an Excel workbook (`final review file.xlsx`) served as a static asset, providing dynamic operations overview statistics.

Designed for internal use by a single operations team. It runs entirely client-side (no auth, no backend, no multi-tenancy).

---

## Getting Started

### Prerequisites

Make sure you have Node.js (version 18+ recommended) and npm installed.

### Installation

1. Clone or download the repository into your workspace.
2. Ensure the Excel workbook `final review file.xlsx` is placed in the `public/` directory and renamed to `data.xlsx` (this is done automatically during setup but double-check if updating data).
3. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```

### Running Locally

To start the Vite development server:
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production Build

To compile the TypeScript project and generate the production-ready build:
```bash
npm run build
```
This runs typechecking and outputs static files into the `dist/` folder.

---

## Project Folder Structure

The project follows a clean, modular structure:

```
├── public/                 # Static assets served at the root
│   ├── data.xlsx           # The Excel data source (automatically fetched)
│   ├── favicon.svg         # Tab favicon
│   └── icons.svg           # Vector icons
├── src/
│   ├── components/         # Reusable presentation components
│   │   ├── layout/         # Shell containers (DashboardLayout)
│   │   ├── shared/         # ChartCard wrappers, DataTable, FilterBar
│   │   └── ui/             # Radix & CVA primitives (Card, Button, Input, Select, Table)
│   ├── context/            # React global state (ExcelDataContext)
│   ├── hooks/              # Custom React hooks (useTheme)
│   ├── lib/                # Shared utilities and parsing layer
│   │   ├── dataAdapter.ts  # Decoupled data adapter patterns (API, CSV, Excel)
│   │   ├── excelParser.ts  # Excel parsing, type coercion, cleaning
│   │   └── utils.ts        # Helper formatters (duration, percent, cn)
│   ├── pages/              # View screens
│   │   ├── Home/           # Overview Dashboard containing summary, charts, rankings, insights
│   │   ├── DSAT/           # Detailed DSAT audits dashboard
│   │   ├── AHT/            # Detailed AHT audits dashboard
│   │   ├── Escalations/    # Detailed SM Escalations dashboard
│   │   ├── Shrinkage/      # Detailed Shrinkage and Heatmap dashboard
│   │   ├── Performance/    # Detailed Agent KPI rankings dashboard
│   │   └── Upload/         # Workbook Manager page
│   ├── types/              # Global TypeScript interfaces
│   │   └── data.ts         # Excel schema interfaces
│   ├── App.tsx             # Main routing shell and provider hookup
│   ├── index.css           # Tailwind v4 import & HSL CSS variable styling
│   └── main.tsx            # StrictMode rendering hook
├── package.json            # Script definitions and package dependencies
├── tsconfig.json           # Compiler rules (strict TypeScript enabled)
└── README.md               # Product documentation (This file)
```

---

## Data Source Upload & Local Management

The dashboard supports two levels of data loading:
1. **Default Data**: Reads `/public/data.xlsx` served by the application on startup.
2. **User Uploaded Data**: Managers can upload their own `.xlsx` workbook using the **Workbook Manager** page.

### Upload Workflow
- Navigate to the **Workbook Manager** link in the sidebar or top bar actions.
- Drag & Drop an `.xlsx` workbook or browse to select a file.
- The uploader automatically runs a verification report. It checks:
  - Presence of required sheets: `DSAT`, `AHT`, `SM Escalations`, `Shrinkage`, and `Performance`.
  - Required columns within each sheet, utilizing case-insensitive aliases.
  - Presence of data (rejects empty workbooks).
- **Validation Report**: If the file fails verification, the page displays a granular checklist showing exactly which sheets were valid and which required columns were missing (e.g. `✗ Performance: Missing CPA`).
- **Binary Persistence**: If valid, the workbook is parsed immediately, updating all dashboard pages. The workbook binary `ArrayBuffer` is saved into **IndexedDB** in the browser.
- **Auto-load**: When the page is reloaded, the application checks IndexedDB. If an uploaded workbook is found, it loads it automatically; otherwise, it falls back to the default data.

### Data Actions
- **Refresh Data**: Located in the top header, this reloads the workbook from its source (re-fetches if default, re-reads if custom) to sync with any changes.
- **Reset Default**: Appears in the top header if custom data is loaded. Clears the browser's IndexedDB and falls back immediately to the default `/public/data.xlsx` dataset.
- **Summary Statistics**: A successful upload displays counts of sheets, unique active agents, and records mapped per sheet so managers can verify imports at a glance.

---

## Excel File Schema Documentation

The workbook `data.xlsx` expects five worksheets. The dynamic parser maps column names case-insensitively and ignores special characters to handle inconsistent headers.

### 1. DSAT (`DSAT` Sheet)
Logs of Customer Dissatisfaction events from audits.
- **Date Column**: `Dsat Date` or `Date` (datetime)
- **Agent Email**: `Agentid` or `Ldap Email` (string)
- **Agent Name**: `Agentname` or `Ldap Name` (string)
- **Other Key Fields**: `Ticket Id`, `Order Id`, `Lob`, `Observations`, `Refunded`, `Teamleader`, `Issue Category`, `Rebuttal Status`.

### 2. AHT (`AHT` Sheet)
Audit logs evaluating high Average Handling Time (AHT).
- **Date Column**: `Audit Date` or `Transaction Date` (datetime)
- **Agent Email**: `Agent Email ID` or `Email Address` (string)
- **Other Key Fields**: `Kapture /OS Ticket ID`, `Theme`, `What is the exact reason for high AHT`, `What is your Process Suggestion to reduse the AHT`, `AHTOpportunity`, `AHT` (number), `DSAT` (number).

### 3. SM Escalations (`SM Escalations` Sheet)
Logs of tickets escalated via Social Media channels.
- **Date Column**: `Date` (datetime)
- **Agent Email**: `Agent Email` (string)
- **Other Key Fields**: `Ticket Id`, `Hour`, `Assigned advisor`, `Escalation type` (e.g. E2), `L3 Reason` (e.g. Melted), `Store`, `Source` (e.g. Twitter), `Refund Deny Yes /No`, `L1`, `L2`.

### 4. Shrinkage (`Shrinkage` Sheet)
Roster attendance tracking and login hours logs. Headers are automatically detected on **Row 2 (index 1)**.
- **Date Column**: `Date` (datetime)
- **Agent Email**: `Zepto ID` (string)
- **Agent Name**: `Employee Name` (string)
- **Other Key Fields**: `SUPERVISOR`, `Attendance` (`P` for present, `A` for absent, `PL` for planned leave, `WOFF` for weekly off, `HD` for half day), `Actual Login Hrs(incuding refresher)` (duration), `Target` (duration).

### 5. Performance (`Performance` Sheet)
Agent monthly summary KPIs.
- **Agent Email**: `Emp Code` (string)
- **Key Fields**: `Chat Count`, `FRS`, `AHT`, `CPA`, `CSAT`, `DSAT`, `Csat %` (decimal), `Response %`, `AVG Login Hrs`.

---

## Extensibility Guides

### How to Add New Sheets in the Future

The data layer is built to automatically detect new tables. To add a new sheet (e.g. `CSAT Surveys`):

1. **Update Data Types**:
   Open `src/types/data.ts` and define an interface for the new rows:
   ```typescript
   export interface CSATAudit {
     date: Date;
     agentEmail: string;
     score: number;
     comments: string;
   }
   ```
   Add it to the `OperationsDataset` interface.

2. **Add Header Mappings**:
   Open `src/lib/excelParser.ts`. Inside `parseExcelFile()`, add the mappings for your sheet:
   ```typescript
   const csatSheet = workbook.Sheets['CSAT Surveys'];
   if (csatSheet) {
     const rows = XLSX.utils.sheet_to_json<any[]>(csatSheet, { header: 1 });
     const { headerMap, startRowIdx } = mapHeaders(rows);
     
     const mappings: Record<keyof CSATAudit, string[]> = {
       date: ['date', 'surveydate'],
       agentEmail: ['agentemail', 'email'],
       score: ['score', 'rating'],
       comments: ['comments', 'feedback']
     };
     // Map rows...
   }
   ```

3. **Expose in Context**:
   Open `src/context/ExcelDataContext.tsx` and add a new state for the filtered rows. Implement the date, agent, and search filter logic in the matching `useMemo` block.

---

### How to Replace the Data Source (API / Google Sheets)

The data layer follows an **Adapter Design Pattern**. Currently, the app utilizes `ExcelDataAdapter` which implements `OperationsDataAdapter`.

To swap the Excel source with a Google Sheets API or a REST Backend:

1. **Implement the Adapter**:
   Create a new file `src/lib/apiAdapter.ts` (or add to `dataAdapter.ts`):
   ```typescript
   import { OperationsDataAdapter } from './dataAdapter';
   import { OperationsDataset } from '../types/data';

   export class ApiDataAdapter implements OperationsDataAdapter {
     private apiEndpoint: string;

     constructor(endpoint: string) {
       this.apiEndpoint = endpoint;
     }

     async fetchData(): Promise<OperationsDataset> {
       const response = await fetch(this.apiEndpoint);
       if (!response.ok) throw new Error('API fetch failed');
       const data = await response.json();
       
       // Clean dates and parse types from JSON
       return {
         dsat: data.dsat.map((d: any) => ({ ...d, date: new Date(d.date) })),
         aht: data.aht.map((a: any) => ({ ...a, date: new Date(a.date) })),
         escalations: data.escalations.map((e: any) => ({ ...e, date: new Date(e.date) })),
         shrinkage: data.shrinkage.map((s: any) => ({ ...s, date: new Date(s.date) })),
         performance: data.performance
       };
     }
   }
   ```

2. **Register the New Adapter**:
   Open `src/App.tsx` and instantiate the provider with your new adapter:
   ```typescript
   import { ApiDataAdapter } from './lib/apiAdapter';
   
   const apiAdapter = new ApiDataAdapter('https://api.operations.internal/v1/metrics');
   
   function App() {
     return (
       <ExcelDataProvider adapter={apiAdapter}>
         {/* router */}
       </ExcelDataProvider>
     );
   }
   ```
No page components or layout files need to be changed. The dashboard UI will load data seamlessly from the API.

---

## Deployment Instructions

Since this is a client-only static SPA (Single Page Application), it can be deployed to any static host with zero cost and zero setup.

### Option A: Internal Nginx / IIS Server (Recommended for On-Premise)

1. Run the build command:
   ```bash
   npm run build
   ```
2. Copy the contents of the `dist/` directory directly to your web server's root folder (e.g., `/var/www/html` for Nginx or `inetpub/wwwroot` for IIS).
3. Configure your web server to redirect all requests to `index.html` (supporting React Router browser history):
   - **Nginx configuration**:
     ```nginx
     location / {
         try_files $uri $uri/ /index.html;
     }
     ```
   - **IIS configuration**: Install the "URL Rewrite" module and add a `web.config` file to the root.

### Option B: Cloud Hosting (Vercel, Netlify, AWS S3)

1. Deploy the `dist/` directory.
2. Set up single page application routing redirects:
   - For Vercel: Add a `vercel.json` with a rewrite rule.
   - For Netlify: Add a `_redirects` file: `/* /index.html 200`.
   - For AWS S3: Set the index document and error document both to `index.html`.

---

## Future Improvements

While this dashboard is fully feature-complete and presentation-ready, the following architectural upgrades can be implemented in future phases:

1. **Live Sheets/API Synchronization**:
   Implement a live database or Google Sheets API adapter to query operational audits automatically without manual Excel uploads.
2. **Text Sentiment & Observation Clustering**:
   Use client-side natural language processing (e.g. TF-IDF or tokenization scripts) to run keyword clustering on raw observation cells, providing a semantic tag cloud.
3. **Slack / MS Teams Webhook Alerts**:
   Configure the modular insights engine to fire webhook notifications directly to operations team chat rooms when critical anomalies (e.g. absentee hotspots or low outcall compliance) are detected.
4. **Downloadable Chart Snapshots**:
   Add canvas-render actions to download charts as high-resolution PNG images.
