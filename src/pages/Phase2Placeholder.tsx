import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Settings, Info } from 'lucide-react';

interface Phase2PlaceholderProps {
  title: string;
  description: string;
  plannedFeatures: string[];
}

export const Phase2Placeholder: React.FC<Phase2PlaceholderProps> = ({ 
  title, 
  description, 
  plannedFeatures 
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 max-w-2xl mx-auto">
      <Card className="w-full text-center border-dashed border-2">
        <CardHeader className="flex flex-col items-center justify-center gap-2">
          <div className="p-3 bg-indigo-50 rounded-full dark:bg-indigo-950 text-indigo-500">
            <Settings className="w-8 h-8 animate-spin" style={{ animationDuration: '6s' }} />
          </div>
          <CardTitle className="mt-2">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4 text-left">
          <div className="flex items-start gap-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800 text-sm text-slate-500 dark:text-slate-400">
            <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
            <p>
              This analytics view is scheduled for implementation in <strong>Phase 2</strong> of the dashboard rollout. Currently, you can filter this data globally using the top filter bar, which will apply dynamically when this page is implemented.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-slate-850 dark:text-slate-200">Planned Analytics & Features:</h4>
            <ul className="list-disc pl-5 space-y-1.5 text-sm text-slate-600 dark:text-slate-400">
              {plannedFeatures.map((feature, idx) => (
                <li key={idx}>{feature}</li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
