
import React, { useMemo, memo } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, WifiOff, AlertCircle, ExternalLink } from 'lucide-react';
import { CheckResult, ConnectivityStatus, SiteConfig, Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface StatusCardProps {
  site: SiteConfig;
  result?: CheckResult;
  onCheck: (site: SiteConfig) => void;
  lang: Language;
  isRefreshing?: boolean;
}

export const StatusCard: React.FC<StatusCardProps> = memo(({ site, result, onCheck, lang, isRefreshing = false }) => {
  const status = result?.status || ConnectivityStatus.IDLE;
  const latency = result?.latency || 0;
  const t = useMemo(() => TRANSLATIONS[lang], [lang]);

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

  const displayIconUrl = useMemo(() => {
    if (site.iconUrl) return site.iconUrl;
    try {
      const urlObj = new URL(site.url);
      return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=128`;
    } catch (e) {
      return '';
    }
  }, [site.url, site.iconUrl]);

  const latencyPercent = Math.min((latency / 1000) * 100, 100);

  // Status Indicator logic:
  // If refreshing, show spinner in status dot area.
  // Else show standard dot.
  const renderStatusIndicator = () => {
    if (isRefreshing) {
       return <RefreshCw className={`w-2.5 h-2.5 text-muted animate-spin`} />;
    }
    return <div className={`w-2.5 h-2.5 rounded-full ${styles.indicator} shadow-sm ring-2 ring-background/10`} />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ duration: 0.2 }}
      className={`
        relative group overflow-hidden
        rounded-2xl border ${styles.border} ${styles.bg} ${styles.glow}
        transition-all duration-300 flex flex-col h-[120px]
        z-10
      `}
    >
      {/* Content Wrapper: z-30 + pointer-events-none to sit above button (z-20) but let clicks pass through */}
      <div className="flex-1 p-4 flex items-start justify-between relative z-30 pointer-events-none">
        {/* Left Side: Icon + Text. flex-1 and min-w-0 allows truncation to work properly without pushing right side */}
        <div className="flex items-start gap-3 flex-1 min-w-0 pr-2">
          {/* Icon Container - shrink-0 to prevent squishing */}
          <div className="relative p-2 rounded-xl bg-background/50 border border-border/50 shadow-sm backdrop-blur-sm group-hover:scale-110 transition-transform duration-300 shrink-0">
            <img 
              src={displayIconUrl} 
              alt={`${displayName} icon`} 
              className="w-8 h-8 object-contain rounded-sm"
              onError={(e) => {
                // Fallback to Google's service if custom icon fails, or hide if google fails
                const target = e.target as HTMLImageElement;
                if (!site.iconUrl && target.src.includes('google.com')) {
                   target.style.display = 'none';
                } else if (site.iconUrl && target.src === site.iconUrl) {
                   // If custom icon failed, try google fallback
                   try {
                     target.src = `https://www.google.com/s2/favicons?domain=${new URL(site.url).hostname}&sz=128`;
                   } catch {
                     target.style.display = 'none';
                   }
                } else {
                   target.style.display = 'none';
                }
              }}
            />
          </div>
          
          {/* Text Info - min-w-0 to allow text truncation */}
          <div className="flex flex-col min-w-0 w-full">
            <h3 className="font-bold text-base text-text leading-tight line-clamp-1">{displayName}</h3>
            <a 
              href={site.url} 
              target="_blank" 
              rel="noopener noreferrer" 
              // Added pointer-events-auto to re-enable clicks on the link
              className="text-xs text-muted/60 hover:text-primary truncate w-full mt-1 flex items-center gap-1 relative pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {site.url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
              <ExternalLink className="w-3.5 h-3.5 opacity-50 shrink-0" />
            </a>
          </div>
        </div>

        {/* Status Badge Top Right - shrink-0 to prevent being squished by long text */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          {renderStatusIndicator()}
          {status === ConnectivityStatus.SUCCESS && (
            <span className={`text-xs font-mono font-bold ${styles.text} ${isRefreshing ? 'opacity-50' : ''}`}>
              {latency}ms
            </span>
          )}
        </div>
      </div>

      {/* Middle Status/Action Area - z-30 + pointer-events-none */}
      <div className="px-4 pb-3 relative z-30 pointer-events-none">
         {(status === ConnectivityStatus.PENDING || (status === ConnectivityStatus.IDLE && isRefreshing)) && (
           <div className="flex items-center gap-2 text-xs text-primary animate-pulse">
             <RefreshCw className="w-3 h-3 animate-spin" />
             <span>{t.status_pinging}</span>
           </div>
         )}
         
         {status === ConnectivityStatus.ERROR && !isRefreshing && (
           <div className="flex items-center gap-2 text-xs text-danger">
             <WifiOff className="w-3 h-3" />
             <span>{t.status_unreachable}</span>
           </div>
         )}
         {status === ConnectivityStatus.TIMEOUT && !isRefreshing && (
           <div className="flex items-center gap-2 text-xs text-yellow-600 dark:text-yellow-500">
             <AlertCircle className="w-3 h-3" />
             <span>{t.status_timeout}</span>
           </div>
         )}
         
         {(status === ConnectivityStatus.ERROR || status === ConnectivityStatus.TIMEOUT) && isRefreshing && (
            <div className="flex items-center gap-2 text-xs text-muted animate-pulse">
               <RefreshCw className="w-3 h-3 animate-spin" />
               <span>{t.status_pinging}</span>
            </div>
         )}

         {status === ConnectivityStatus.IDLE && !isRefreshing && (
           <div className="text-xs text-muted/50">{t.status_waiting}</div>
         )}
      </div>

      {/* Latency Bar (Bottom) */}
      <div className="h-1 w-full bg-black/5 dark:bg-white/5 mt-auto relative overflow-hidden rounded-b-2xl">
        {status === ConnectivityStatus.SUCCESS && (
          <motion.div 
            initial={false}
            animate={{ width: `${latencyPercent}%`, opacity: isRefreshing ? 0.5 : 1 }}
            transition={{ duration: 0.5 }}
            className={`h-full ${latency < 200 ? 'bg-green-500' : latency < 500 ? 'bg-green-400' : latency < 1000 ? 'bg-yellow-500' : 'bg-orange-500'}`}
          />
        )}
      </div>

      {/* Click Overlay - z-20 (Must be lower than content z-30) */}
      <button
        onClick={() => onCheck(site)}
        className="absolute inset-0 w-full h-full z-20 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-2xl"
        aria-label={`Check connectivity for ${displayName}`}
      />
    </motion.div>
  );
});
