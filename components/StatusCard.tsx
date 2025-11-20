
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, WifiOff, AlertCircle, ExternalLink } from 'lucide-react';
import { CheckResult, ConnectivityStatus, SiteConfig, Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface StatusCardProps {
  site: SiteConfig;
  result?: CheckResult;
  onCheck: (id: string, url: string) => void;
  lang: Language;
}

export const StatusCard: React.FC<StatusCardProps> = ({ site, result, onCheck, lang }) => {
  const status = result?.status || ConnectivityStatus.IDLE;
  const latency = result?.latency || 0;
  const t = TRANSLATIONS[lang];

  // Determine display name
  const displayName = (lang === 'zh' && site.name_zh) ? site.name_zh : site.name;

  const getStatusStyles = () => {
    switch (status) {
      case ConnectivityStatus.IDLE:
        return {
          border: 'border-border',
          bg: 'bg-surface',
          indicator: 'bg-muted/30',
          glow: '',
          text: 'text-muted'
        };
      case ConnectivityStatus.PENDING:
        return {
          border: 'border-primary/30',
          bg: 'bg-surface',
          indicator: 'bg-primary animate-pulse',
          glow: 'shadow-[0_0_15px_-3px_rgba(59,130,246,0.1)]',
          text: 'text-primary'
        };
      case ConnectivityStatus.TIMEOUT:
        return {
          border: 'border-warning/50',
          bg: 'bg-warning/5',
          indicator: 'bg-warning',
          glow: 'shadow-[0_0_15px_-3px_rgba(234,179,8,0.15)]',
          text: 'text-yellow-600 dark:text-yellow-400'
        };
      case ConnectivityStatus.ERROR:
        return {
          border: 'border-danger/50',
          bg: 'bg-danger/5',
          indicator: 'bg-danger',
          glow: 'shadow-[0_0_15px_-3px_rgba(239,68,68,0.2)]',
          text: 'text-danger'
        };
      case ConnectivityStatus.SUCCESS:
        if (latency < 200) return {
          border: 'border-green-500/30',
          bg: 'bg-surface',
          indicator: 'bg-success',
          glow: 'shadow-[0_0_20px_-5px_rgba(34,197,94,0.15)]',
          text: 'text-success'
        };
        if (latency < 800) return {
          border: 'border-yellow-500/30',
          bg: 'bg-surface',
          indicator: 'bg-yellow-500',
          glow: 'shadow-[0_0_15px_-3px_rgba(234,179,8,0.1)]',
          text: 'text-yellow-600 dark:text-yellow-400'
        };
        return {
          border: 'border-orange-500/30',
          bg: 'bg-surface',
          indicator: 'bg-orange-500',
          glow: 'shadow-[0_0_15px_-3px_rgba(249,115,22,0.1)]',
          text: 'text-orange-600 dark:text-orange-400'
        };
      default:
        return { border: 'border-border', bg: 'bg-surface', indicator: 'bg-muted', glow: '', text: 'text-muted' };
    }
  };

  const styles = getStatusStyles();

  const faviconUrl = useMemo(() => {
    try {
      const urlObj = new URL(site.url);
      return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=128`;
    } catch (e) {
      return '';
    }
  }, [site.url]);

  const latencyPercent = Math.min((latency / 1000) * 100, 100);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ duration: 0.2 }}
      className={`
        relative group overflow-hidden
        rounded-2xl border ${styles.border} ${styles.bg} ${styles.glow}
        transition-all duration-300 flex flex-col h-[120px]
      `}
    >
      <div className="flex-1 p-4 flex items-start justify-between relative z-10">
        <div className="flex items-start gap-3">
          {/* Icon Container */}
          <div className="relative p-2 rounded-xl bg-background/50 border border-border/50 shadow-sm backdrop-blur-sm group-hover:scale-110 transition-transform duration-300">
            <img 
              src={faviconUrl} 
              alt={`${displayName} icon`} 
              className="w-8 h-8 object-contain rounded-sm"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
          
          {/* Text Info */}
          <div className="flex flex-col">
            <h3 className="font-bold text-base text-text leading-tight line-clamp-1">{displayName}</h3>
            <a 
              href={site.url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-[10px] text-muted/60 hover:text-primary truncate max-w-[100px] mt-1 flex items-center gap-0.5"
              onClick={(e) => e.stopPropagation()}
            >
              {site.url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
              <ExternalLink className="w-2 h-2 opacity-50" />
            </a>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex flex-col items-end gap-1">
          <div className={`w-2.5 h-2.5 rounded-full ${styles.indicator} shadow-sm ring-2 ring-background/10`} />
          {status === ConnectivityStatus.SUCCESS && (
            <span className={`text-xs font-mono font-bold ${styles.text}`}>
              {latency}ms
            </span>
          )}
        </div>
      </div>

      {/* Middle Status/Action Area */}
      <div className="px-4 pb-3 relative z-10">
         {status === ConnectivityStatus.PENDING && (
           <div className="flex items-center gap-2 text-xs text-primary animate-pulse">
             <RefreshCw className="w-3 h-3 animate-spin" />
             <span>{t.status_pinging}</span>
           </div>
         )}
         {status === ConnectivityStatus.ERROR && (
           <div className="flex items-center gap-2 text-xs text-danger">
             <WifiOff className="w-3 h-3" />
             <span>{t.status_unreachable}</span>
           </div>
         )}
         {status === ConnectivityStatus.TIMEOUT && (
           <div className="flex items-center gap-2 text-xs text-yellow-600 dark:text-yellow-500">
             <AlertCircle className="w-3 h-3" />
             <span>{t.status_timeout}</span>
           </div>
         )}
         {status === ConnectivityStatus.IDLE && (
           <div className="text-xs text-muted/50">{t.status_waiting}</div>
         )}
      </div>

      {/* Latency Bar (Bottom) */}
      <div className="h-1 w-full bg-black/5 dark:bg-white/5 mt-auto relative">
        {status === ConnectivityStatus.SUCCESS && (
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${latencyPercent}%` }}
            className={`h-full ${latency < 200 ? 'bg-green-500' : latency < 500 ? 'bg-green-400' : latency < 1000 ? 'bg-yellow-500' : 'bg-orange-500'}`}
          />
        )}
      </div>

      {/* Click Overlay */}
      <button
        onClick={() => onCheck(site.id, site.url)}
        className="absolute inset-0 w-full h-full z-20 cursor-pointer outline-none"
        aria-label={`${t.check_again} ${displayName}`}
      />
      
      {/* Background decorative elements */}
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent dark:from-white/5 pointer-events-none rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
    </motion.div>
  );
};
