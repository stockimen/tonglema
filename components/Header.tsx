import React from 'react';
import { Activity, Play, RefreshCw, Sun, Moon } from 'lucide-react';

interface HeaderProps {
  onCheckAll: () => void;
  isChecking: boolean;
  lastChecked: number | null;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onCheckAll, isChecking, lastChecked, theme, toggleTheme }) => {
  return (
    <header className="w-full py-6 px-4 md:px-0 border-b border-border bg-background/80 sticky top-0 z-50 backdrop-blur-md transition-colors duration-300">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20 text-primary">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text tracking-tight flex items-center gap-2 transition-colors duration-300">
              TongLeMa
              <span className="text-xs font-normal px-2 py-0.5 bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 rounded-full">
                Live
              </span>
            </h1>
            <p className="text-sm text-muted transition-colors duration-300">Global Connectivity & Latency Dashboard</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {lastChecked && (
            <span className="text-xs text-muted hidden md:block transition-colors duration-300">
              Updated: {new Date(lastChecked).toLocaleTimeString()}
            </span>
          )}

          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-lg bg-surface border border-border text-text hover:bg-muted/10 transition-colors"
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          
          <button
            onClick={onCheckAll}
            disabled={isChecking}
            className={`
              flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium text-sm transition-all shadow-sm
              ${isChecking 
                ? 'bg-surface text-muted cursor-not-allowed border border-border' 
                : 'bg-primary hover:bg-primary/90 text-white shadow-[0_0_20px_-5px_rgba(59,130,246,0.5)]'
              }
            `}
          >
            {isChecking ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                Check Now
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};