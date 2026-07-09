import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileQuestion, Home } from 'lucide-react';
import { Button } from '../../components/ui/button';

export const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center select-none animate-fade-in">
      <div className="w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-950/20 flex items-center justify-center mb-6">
        <FileQuestion className="w-8 h-8 text-indigo-550 dark:text-indigo-400" />
      </div>
      
      <h1 className="text-4xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
        404
      </h1>
      <h2 className="text-lg font-bold text-slate-700 dark:text-slate-200 mt-2">
        Page Not Found
      </h2>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-sm leading-relaxed">
        The page you are looking for doesn't exist or has been moved. Use the button below to return to the home overview.
      </p>

      <div className="mt-8">
        <Button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-xs font-semibold px-5 py-2.5 bg-indigo-600 hover:bg-indigo-750 text-white dark:bg-indigo-500 dark:hover:bg-indigo-650"
        >
          <Home className="w-3.5 h-3.5" />
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
};
