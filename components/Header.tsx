import React from 'react';
import { Activity, Play, RefreshCw, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  onCheckAll: () => void;
  isChecking: boolean;
  lastChecked: number | null;
}

export const Header: React.FC<HeaderProps> = ({ onCheckAll, isChecking, lastChecked }) => {
  return (
    <header className="w-full py-8 px-4 md:px-0 border-b border-border bg-background/50 sticky top-0 z-50 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-xl border border-primary/20 text-primary">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              TongLeMa
              <span className="text-xs font-normal px-2 py-0.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full">
                Live
              </span>
            </h1>
            <p className="text-sm text-muted">Global Connectivity & Latency Dashboard (通了吗)</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {lastChecked && (
            <span className="text-xs text-muted hidden md:block">
              Last update: {new Date(lastChecked).toLocaleTimeString()}
            </span>
          )}
          
          <button
            onClick={onCheckAll}
            disabled={isChecking}
            className={`
              flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium text-sm transition-all
              ${isChecking 
                ? 'bg-surface text-muted cursor-not-allowed border border-border' 
                : 'bg-primary hover:bg-primary/90 text-white shadow-[0_0_20px_-5px_rgba(59,130,246,0.5)]'
              }
            `}
          >
            {isChecking ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Scanning Network...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                Run Diagnostics
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};