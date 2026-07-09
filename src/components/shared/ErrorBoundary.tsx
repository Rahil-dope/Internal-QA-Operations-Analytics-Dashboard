import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Database } from 'lucide-react';
import { Button } from '../ui/button';
import { useExcelData } from '../../context/ExcelDataContext';

interface InnerProps {
  children: ReactNode;
  resetToDefault: () => Promise<void>;
  sourceType: 'default' | 'uploaded';
}

interface InnerState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  isResetting: boolean;
}

class ErrorBoundaryInner extends Component<InnerProps, InnerState> {
  constructor(props: InnerProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isResetting: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<InnerState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = async () => {
    this.setState({ isResetting: true });
    try {
      await this.props.resetToDefault();
      this.setState({ hasError: false, error: null, errorInfo: null });
      // Force reload to clean up all app state
      window.location.href = '/';
    } catch (e) {
      console.error('Failed to reset to default workbook:', e);
      alert('Failed to reset workbook. Please try refreshing or clear your browser data.');
    } finally {
      this.setState({ isResetting: false });
    }
  };

  render() {
    if (this.state.hasError) {
      const isUploaded = this.props.sourceType === 'uploaded';
      return (
        <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg min-h-[300px] text-center max-w-2xl mx-auto my-12 shadow-sm animate-fade-in">
          <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/20 flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50 tracking-tight">
            Dashboard View Error
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-md leading-relaxed">
            Something went wrong while rendering this analytics page. This might occur due to mismatching column values or date formats in the uploaded spreadsheet.
          </p>

          {this.state.error && (
            <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-950 border rounded text-[11px] text-red-650 dark:text-red-400 font-mono text-left max-w-full overflow-x-auto max-h-32 select-text">
              <strong>Error:</strong> {this.state.error.message}
              {this.state.error.stack && (
                <div className="mt-1 text-[10px] text-slate-400 dark:text-slate-500 overflow-hidden text-ellipsis whitespace-nowrap">
                  {this.state.error.stack.split('\n')[1]}
                </div>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
            <Button
              onClick={this.handleReload}
              variant="outline"
              size="sm"
              className="flex items-center gap-1.5 text-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reload Dashboard
            </Button>

            {isUploaded && (
              <Button
                onClick={this.handleReset}
                variant="destructive"
                size="sm"
                className="flex items-center gap-1.5 text-xs bg-red-650 hover:bg-red-750 text-white"
                disabled={this.state.isResetting}
              >
                <Database className="w-3.5 h-3.5" />
                {this.state.isResetting ? 'Resetting...' : 'Reset Default Data'}
              </Button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrap the class component to safely inject Context props
export const ErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { resetToDefault, sourceType } = useExcelData();
  
  return (
    <ErrorBoundaryInner 
      resetToDefault={resetToDefault} 
      sourceType={sourceType}
    >
      {children}
    </ErrorBoundaryInner>
  );
};
