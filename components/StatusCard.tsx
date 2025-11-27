
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
  showColorMode?: boolean;
}

export const StatusCard: React.FC<StatusCardProps> = memo(({ site, result, onCheck, lang, isRefreshing = false, showColorMode = false }) => {
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
          indicator: 'bg-muted/40',
          glow: '',
          text: 'text-muted'
        };
      case ConnectivityStatus.PENDING:
        return {
          border: 'border-primary/40',
          bg: 'bg-surface',
          indicator: 'bg-primary animate-pulse',
          glow: '',
          text: 'text-primary'
        };
      case ConnectivityStatus.TIMEOUT:
        return {
          border: 'border-warning/50',
          bg: 'bg-surface',
          indicator: 'bg-warning',
          glow: '',
          text: 'text-warning'
        };
      case ConnectivityStatus.ERROR:
        return {
          border: 'border-border',
          bg: 'bg-muted/20',
          indicator: 'bg-muted/50',
          glow: '',
          text: 'text-muted/70'
        };
      case ConnectivityStatus.SUCCESS:
        // 如果开启了颜色模式，根据延迟显示不同颜色
        if (showColorMode) {
          if (latency < 200) {
            return {
              border: 'border-green-500/40',
              bg: 'bg-surface',
              indicator: 'bg-green-500',
              glow: '',
              text: 'text-green-600 dark:text-green-400'
            };
          }
          if (latency < 500) {
            return {
              border: 'border-green-400/40',
          bg: 'bg-surface',
              indicator: 'bg-green-400',
              glow: '',
              text: 'text-green-500 dark:text-green-300'
            };
          }
          if (latency < 800) {
            return {
              border: 'border-yellow-500/40',
          bg: 'bg-surface',
          indicator: 'bg-yellow-500',
              glow: '',
          text: 'text-yellow-600 dark:text-yellow-400'
        };
          }
          if (latency < 1000) {
            return {
              border: 'border-orange-500/40',
              bg: 'bg-surface',
              indicator: 'bg-orange-500',
              glow: '',
              text: 'text-orange-600 dark:text-orange-400'
            };
          }
          return {
            border: 'border-red-500/40',
            bg: 'bg-surface',
            indicator: 'bg-red-500',
            glow: '',
            text: 'text-red-600 dark:text-red-400'
          };
        }
        // 默认统一绿色
        return {
          border: 'border-success/40',
          bg: 'bg-surface',
          indicator: 'bg-success',
          glow: '',
          text: 'text-success'
        };
      default:
        return { border: 'border-border', bg: 'bg-surface', indicator: 'bg-muted/40', glow: '', text: 'text-muted' };
    }
  };

  const styles = getStatusStyles();

  const displayIconUrl = useMemo(() => {
    if (site.iconUrl) return site.iconUrl;
    try {
      const urlObj = new URL(site.url);
      return `https://www.faviconextractor.com/favicon/${urlObj.hostname}`;
    } catch (e) {
      return '';
    }
  }, [site.url, site.iconUrl]);

  // 反转逻辑：延迟越低（越快），进度条越满
  // 0ms = 100%, 500ms = 50%, 1000ms+ = 0%
  const latencyPercent = Math.max((1000 - latency) / 1000 * 100, 0);

  // Status Indicator logic:
  // If refreshing, show spinner in status dot area.
  // Else show standard dot.
  const renderStatusIndicator = () => {
    if (isRefreshing) {
       return <RefreshCw className={`w-2 h-2 text-muted animate-spin`} />;
    }
    return <div className={`w-2 h-2 rounded-full ${styles.indicator} shadow-sm ring-1 ring-background/10`} />;
  };

  const isError = status === ConnectivityStatus.ERROR;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ duration: 0.2 }}
      className={`
        relative group overflow-hidden
        rounded-xl border ${styles.border} ${styles.bg} ${styles.glow}
        transition-all duration-300 flex flex-col h-[96px]
        z-10
        ${isError ? 'grayscale-[50%] opacity-85' : ''}
      `}
    >
      {/* Content Wrapper: z-30 + pointer-events-none to sit above button (z-20) but let clicks pass through */}
      <div className="flex-1 p-3 flex items-start justify-between relative z-30 pointer-events-none">
        {/* Left Side: Icon + Text. flex-1 and min-w-0 allows truncation to work properly without pushing right side */}
        <div className="flex items-start gap-2.5 flex-1 min-w-0 pr-2">
          {/* Icon Container - shrink-0 to prevent squishing */}
          <div className="relative p-1.5 rounded-lg bg-background/50 border border-border/50 shadow-sm backdrop-blur-sm group-hover:scale-110 transition-transform duration-300 shrink-0">
            <img 
              src={displayIconUrl} 
              alt={`${displayName} icon`} 
              className="w-6 h-6 object-contain rounded-sm"
              onError={(e) => {
                // Fallback to Google's service if custom icon fails, or hide if google fails
                const target = e.target as HTMLImageElement;
                if (!site.iconUrl && target.src.includes('google.com')) {
                   target.style.display = 'none';
                } else if (site.iconUrl && target.src === site.iconUrl) {
                   // If custom icon failed, try google fallback
                   try {
                     target.src = `https://www.faviconextractor.com/favicon/${new URL(site.url).hostname}`;
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
            <h3 className="font-semibold text-sm text-text leading-tight line-clamp-1">{displayName}</h3>
            <a 
              href={site.url} 
              target="_blank" 
              rel="noopener noreferrer" 
              // Added pointer-events-auto to re-enable clicks on the link
              className="text-[11px] text-muted/60 hover:text-primary truncate w-full mt-0.5 flex items-center gap-1 relative pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {site.url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
              <ExternalLink className="w-3 h-3 opacity-50 shrink-0" />
            </a>
          </div>
        </div>

        {/* Status Badge Top Right - shrink-0 to prevent being squished by long text */}
        <div className="flex flex-col items-end gap-0.5 shrink-0">
          {renderStatusIndicator()}
          {status === ConnectivityStatus.SUCCESS && (
            <span className={`text-[11px] font-mono font-semibold ${styles.text} ${isRefreshing ? 'opacity-50' : ''}`}>
              {latency}ms
            </span>
          )}
        </div>
      </div>

      {/* Middle Status/Action Area - z-30 + pointer-events-none */}
      <div className="px-3 pb-2 relative z-30 pointer-events-none">
         {(status === ConnectivityStatus.PENDING || (status === ConnectivityStatus.IDLE && isRefreshing)) && (
           <div className="flex items-center gap-1.5 text-[11px] text-primary animate-pulse">
             <RefreshCw className="w-2.5 h-2.5 animate-spin" />
             <span>{t.status_pinging}</span>
           </div>
         )}
         
         {status === ConnectivityStatus.ERROR && !isRefreshing && (
           <div className="flex items-center gap-1.5 text-[11px] text-muted/80">
             <WifiOff className="w-2.5 h-2.5" />
             <span>{t.status_unreachable}</span>
           </div>
         )}
         {status === ConnectivityStatus.TIMEOUT && !isRefreshing && (
           <div className="flex items-center gap-1.5 text-[11px] text-warning">
             <AlertCircle className="w-2.5 h-2.5" />
             <span>{t.status_timeout}</span>
           </div>
         )}
         
         {(status === ConnectivityStatus.ERROR || status === ConnectivityStatus.TIMEOUT) && isRefreshing && (
            <div className="flex items-center gap-1.5 text-[11px] text-muted animate-pulse">
               <RefreshCw className="w-2.5 h-2.5 animate-spin" />
               <span>{t.status_pinging}</span>
            </div>
         )}

         {status === ConnectivityStatus.IDLE && !isRefreshing && (
           <div className="text-[11px] text-muted/50">{t.status_waiting}</div>
         )}
      </div>

      {/* Latency Bar (Bottom) */}
      <div className="h-0.5 w-full bg-black/5 dark:bg-white/5 mt-auto relative overflow-hidden rounded-b-xl">
        {status === ConnectivityStatus.SUCCESS && (
          <motion.div 
            initial={false}
            animate={{ width: `${latencyPercent}%`, opacity: isRefreshing ? 0.5 : 1 }}
            transition={{ duration: 0.5 }}
            className={`h-full ${
              showColorMode
                ? latency < 200 
                  ? 'bg-green-500' 
                  : latency < 500 
                  ? 'bg-green-400' 
                  : latency < 800 
                  ? 'bg-yellow-500' 
                  : latency < 1000
                  ? 'bg-orange-500'
                  : 'bg-red-500'
                : 'bg-success'
            }`}
          />
        )}
      </div>

      {/* Click Overlay - z-20 (Must be lower than content z-30) */}
      <button
        onClick={() => onCheck(site)}
        className="absolute inset-0 w-full h-full z-20 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-xl"
        aria-label={`Check connectivity for ${displayName}`}
      />
    </motion.div>
  );
});
