import React, { useState, useRef, useMemo } from 'react';
import { useExcelData } from '../../context/ExcelDataContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { validateWorkbook } from '../../lib/excelParser';
import type { ValidationReport } from '../../lib/excelParser';
import { workbookSchema } from '../../config/workbookSchema';
import { 
  Upload as UploadIcon, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  RotateCcw, 
  AlertCircle,
  FileCheck
} from 'lucide-react';
import { cn } from '../../lib/utils';

export const UploadPage: React.FC = () => {
  const { 
    sourceType, 
    fileName, 
    dataset, 
    agents,
    uploadWorkbook, 
    resetToDefault, 
    refreshData 
  } = useExcelData();

  const [validationReport, setValidationReport] = useState<ValidationReport | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'validating' | 'saving' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = async (file: File) => {
    if (!file.name.endsWith('.xlsx')) {
      setUploadStatus('error');
      setErrorMsg('Invalid file format. Please upload only Excel workbooks (.xlsx).');
      setValidationReport(null);
      return;
    }

    setUploadStatus('validating');
    setErrorMsg(null);

    try {
      const buffer = await file.arrayBuffer();
      const report = validateWorkbook(buffer);
      setValidationReport(report);

      if (!report.valid) {
        setUploadStatus('error');
        setErrorMsg('Workbook schema validation failed. Please check the missing columns listed below.');
        return;
      }

      setUploadStatus('saving');
      const success = await uploadWorkbook(file);
      if (success) {
        setUploadStatus('success');
      } else {
        setUploadStatus('error');
        setErrorMsg('Failed to save the workbook to IndexedDB storage.');
      }
    } catch (err: any) {
      console.error(err);
      setUploadStatus('error');
      setErrorMsg(err.message || 'An error occurred during file upload processing.');
      setValidationReport(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  // Compile missing column information for validation reports
  const formattedValidationErrors = useMemo(() => {
    if (!validationReport) return [];
    
    return validationReport.sheets.map(sheet => {
      const schema = Object.values(workbookSchema).find(s => s.name === sheet.name);
      const requiredMissing = sheet.missingColumns;
      
      return {
        name: sheet.name,
        exists: sheet.exists,
        empty: sheet.empty,
        isValid: sheet.exists && !sheet.empty && requiredMissing.length === 0,
        missingRequired: requiredMissing.map(key => {
          const colSchema = schema?.columns.find(c => c.key === key);
          return colSchema ? `${colSchema.aliases[0].toUpperCase()} (${key})` : key;
        })
      };
    });
  }, [validationReport]);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Upload Console */}
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Upload Excel Workbook</CardTitle>
            <CardDescription className="text-xs">
              Upload a custom operational workbook to update dashboards instantly. Saved locally in your browser.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div 
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={onButtonClick}
              className={cn(
                "flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-10 cursor-pointer transition-colors min-h-[220px]",
                dragActive ? "border-indigo-500 bg-indigo-50/10" : "border-slate-350 dark:border-slate-800 hover:bg-slate-100/10"
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".xlsx"
                onChange={handleChange}
              />
              
              <UploadIcon className="w-10 h-10 text-slate-400 mb-3" />
              <p className="text-sm font-semibold mb-1">Drag and drop your spreadsheet here</p>
              <p className="text-xs text-slate-550 mb-3">or click to browse from files</p>
              <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-500 rounded font-medium">
                Supports ONLY .xlsx Excel workbooks
              </span>
            </div>

            {/* Upload status messages */}
            {uploadStatus !== 'idle' && (
              <div className="space-y-3">
                {uploadStatus === 'validating' && (
                  <div className="p-3 bg-slate-50 border rounded text-xs flex items-center gap-2 text-slate-650 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400">
                    <RefreshCw className="w-4 h-4 animate-spin text-indigo-500 shrink-0" />
                    <span>Validating workbook sheets and column mappings...</span>
                  </div>
                )}
                {uploadStatus === 'saving' && (
                  <div className="p-3 bg-slate-50 border rounded text-xs flex items-center gap-2 text-slate-650 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400">
                    <RefreshCw className="w-4 h-4 animate-spin text-emerald-500 shrink-0" />
                    <span>Saving data to browser IndexedDB storage...</span>
                  </div>
                )}
                {uploadStatus === 'success' && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs flex items-center gap-2 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900/50 dark:text-emerald-400">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    <div>
                      <span className="font-bold">Workbook Loaded Successfully!</span>
                      <p className="text-[10px] text-emerald-650 mt-0.5">The dashboard metrics have been updated instantly.</p>
                    </div>
                  </div>
                )}
                {uploadStatus === 'error' && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded text-xs flex flex-col gap-1 text-red-800 dark:bg-red-950/20 dark:border-red-900/50 dark:text-red-400">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-5 h-5 text-red-500 shrink-0" />
                      <span className="font-bold">Workbook Rejected</span>
                    </div>
                    {errorMsg && <p className="text-[10px] text-red-650 mt-1">{errorMsg}</p>}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Validation Report Details */}
        {formattedValidationErrors.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Workbook Validation Details</CardTitle>
              <CardDescription className="text-xs">Granular schema verification results</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {formattedValidationErrors.map(sheet => (
                  <div key={sheet.name} className={cn(
                    "p-3 rounded-lg border text-xs flex flex-col gap-2 bg-slate-50/50 dark:bg-slate-900/30",
                    sheet.isValid 
                      ? "border-emerald-250 dark:border-emerald-950/50" 
                      : "border-red-250 dark:border-red-950/50"
                  )}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold">{sheet.name} Sheet</span>
                      {sheet.isValid ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                    
                    {!sheet.exists && (
                      <span className="text-[10px] text-red-500">Sheet does not exist in workbook.</span>
                    )}
                    {sheet.exists && sheet.empty && (
                      <span className="text-[10px] text-red-500">Sheet contains no records or rows.</span>
                    )}
                    {sheet.exists && !sheet.empty && sheet.missingRequired.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[10px] text-red-600 font-semibold flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" /> Missing columns:
                        </span>
                        <ul className="list-disc pl-4 text-[9px] text-red-500/90 space-y-0.5">
                          {sheet.missingRequired.map(col => (
                            <li key={col}>{col}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {sheet.isValid && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400">All required fields mapped successfully.</span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Right Column: Data Summary & Source Metadata */}
      <div className="space-y-6">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Active Data Summary</CardTitle>
            <CardDescription className="text-xs">Statistics of the active dataset in memory</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center gap-3 p-3 bg-indigo-50/30 rounded-lg border border-indigo-100 dark:bg-indigo-950/20 dark:border-indigo-900/50">
              <FileCheck className="w-5 h-5 text-indigo-500" />
              <div>
                <span className="text-[10px] text-slate-450 uppercase font-semibold">Active Source</span>
                <div className="text-sm font-bold capitalize mt-0.5">{sourceType} Data</div>
                <div className="text-[10px] text-slate-500 mt-0.5 truncate">{fileName}</div>
              </div>
            </div>

            {dataset && (
              <div className="space-y-3 text-xs border-t pt-4">
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-550 dark:text-slate-400">Validated Sheets</span>
                  <span className="font-bold">5 / 5</span>
                </div>
                <div className="flex justify-between items-center py-1 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-slate-550 dark:text-slate-400">Active Agents</span>
                  <span className="font-bold">{agents.length}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-slate-550 dark:text-slate-400">DSAT Audits</span>
                  <span className="font-bold">{dataset.dsat.length}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-slate-550 dark:text-slate-400">AHT Audits</span>
                  <span className="font-bold">{dataset.aht.length}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-slate-550 dark:text-slate-400">SM Escalations</span>
                  <span className="font-bold">{dataset.escalations.length}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-slate-550 dark:text-slate-400">Roster Attendance</span>
                  <span className="font-bold">{dataset.shrinkage.length}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-slate-550 dark:text-slate-400">KPI Performance Records</span>
                  <span className="font-bold">{dataset.performance.length}</span>
                </div>
              </div>
            )}

            <div className="flex gap-2 border-t pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshData}
                className="flex-1 text-xs gap-1 h-8"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </Button>
              {sourceType === 'uploaded' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetToDefault}
                  className="flex-1 text-xs gap-1 text-red-500 h-8 hover:bg-red-50 dark:hover:bg-red-950/20"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Revert Default
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
