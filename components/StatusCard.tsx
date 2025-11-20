import React from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, WifiOff, Wifi, AlertCircle } from 'lucide-react';
import { CheckResult, ConnectivityStatus, SiteConfig } from '../types';

interface StatusCardProps {
  site: SiteConfig;
  result?: CheckResult;
  onCheck: (id: string, url: string) => void;
}

const getStatusColor = (status: ConnectivityStatus, latency: number) => {
  switch (status) {
    case ConnectivityStatus.IDLE:
      return 'border-border bg-surface text-muted';
    case ConnectivityStatus.PENDING:
      return 'border-blue-500/30 bg-blue-500/5 text-blue-600 dark:text-blue-400';
    case ConnectivityStatus.TIMEOUT:
      return 'border-warning/50 bg-warning/10 text-yellow-600 dark:text-yellow-400';
    case ConnectivityStatus.ERROR:
      return 'border-danger/50 bg-danger/10 text-red-600 dark:text-red-400';
    case ConnectivityStatus.SUCCESS:
      if (latency < 200) return 'border-green-500/50 bg-green-500/10 text-green-600 dark:text-green-400';
      if (latency < 800) return 'border-yellow-500/50 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400';
      return 'border-orange-500/50 bg-orange-500/10 text-orange-600 dark:text-orange-400';
    default:
      return 'border-border bg-surface';
  }
};

const getStatusLabel = (status: ConnectivityStatus, latency: number) => {
  switch (status) {
    case ConnectivityStatus.IDLE: return 'Waiting...';
    case ConnectivityStatus.PENDING: return 'Pinging...';
    case ConnectivityStatus.TIMEOUT: return 'Timeout';
    case ConnectivityStatus.ERROR: return 'Unreachable';
    case ConnectivityStatus.SUCCESS: return `${latency}ms`;
  }
};

export const StatusCard: React.FC<StatusCardProps> = ({ site, result, onCheck }) => {
  const status = result?.status || ConnectivityStatus.IDLE;
  const latency = result?.latency || 0;

  const colorClass = getStatusColor(status, latency);
  const Icon = site.icon;

  // Determine which status icon to show
  const StatusIcon = () => {
    if (status === ConnectivityStatus.PENDING) return <RefreshCw className="w-4 h-4 animate-spin" />;
    if (status === ConnectivityStatus.ERROR) return <WifiOff className="w-4 h-4" />;
    if (status === ConnectivityStatus.TIMEOUT) return <AlertCircle className="w-4 h-4" />;
    if (status === ConnectivityStatus.SUCCESS) return <Wifi className="w-4 h-4" />;
    return <div className="w-4 h-4" />;
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className={`relative group p-4 rounded-xl border ${colorClass} shadow-sm hover:shadow-md transition-all duration-300 flex flex-col gap-3`}
    >
      <div className="flex justify-between items-start">
        <div className="p-2 rounded-lg bg-black/5 dark:bg-black/20">
          <Icon className="w-6 h-6" />
        </div>
        <div className={`text-xs font-mono font-medium px-2 py-1 rounded-full bg-black/5 dark:bg-black/20 flex items-center gap-1.5 min-w-[80px] justify-center`}>
           <StatusIcon />
           <span>{getStatusLabel(status, latency)}</span>
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-lg tracking-tight text-text">{site.name}</h3>
        <p className="text-xs text-muted truncate opacity-70">{site.url.replace('https://', '')}</p>
      </div>

      {/* Interactive Overlay for manual recheck */}
      <button
        onClick={() => onCheck(site.id, site.url)}
        className="absolute inset-0 w-full h-full opacity-0 group-hover:opacity-100 transition-opacity bg-black/5 dark:bg-white/5 rounded-xl cursor-pointer focus:outline-none focus:ring-2 ring-primary/50"
        title="Click to re-check"
        aria-label={`Check status for ${site.name}`}
      />
      
      {/* Progress Bar for Latency Visual */}
      {status === ConnectivityStatus.SUCCESS && (
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-200 dark:bg-gray-800 rounded-b-xl overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${Math.min((latency / 2000) * 100, 100)}%` }}
            className={`h-full ${latency < 200 ? 'bg-green-500' : latency < 800 ? 'bg-yellow-500' : 'bg-orange-500'}`}
          />
        </div>
      )}
    </motion.div>
  );
};