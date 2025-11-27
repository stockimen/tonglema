
import React, { useMemo, memo } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { CheckResult, ConnectivityStatus, SiteConfig, Language } from '../types';

interface GridLayoutProps {
  sites: SiteConfig[];
  results: Record<string, CheckResult>;
  onCheck: (site: SiteConfig) => void;
  isRefreshing: (siteId: string) => boolean;
  showColorMode: boolean;
}

/**
 * 获取状态样式，与 StatusCard 保持一致
 */
const getStatusStyles = (status: ConnectivityStatus, latency: number, showColorMode: boolean) => {
  switch (status) {
    case ConnectivityStatus.IDLE:
      return {
        border: 'border-border dark:border-zinc-700',
        bg: 'bg-surface dark:bg-zinc-800/50',
        indicator: 'bg-muted/40 dark:bg-zinc-600',
      };
    case ConnectivityStatus.PENDING:
      return {
        border: 'border-primary/40',
        bg: 'bg-surface',
        indicator: 'bg-primary animate-pulse',
      };
    case ConnectivityStatus.TIMEOUT:
      return {
        border: 'border-warning/50',
        bg: 'bg-surface',
        indicator: 'bg-warning',
      };
    case ConnectivityStatus.ERROR:
      return {
        border: 'border-border dark:border-zinc-700/80',
        bg: 'bg-muted/20 dark:bg-zinc-800/70 dark:border-zinc-700',
        indicator: 'bg-muted/50 dark:bg-zinc-600',
      };
    case ConnectivityStatus.SUCCESS:
      // 如果开启了颜色模式，根据延迟显示不同颜色
      if (showColorMode) {
        if (latency < 200) {
          return {
            border: 'border-green-500/40',
            bg: 'bg-surface',
            indicator: 'bg-green-500',
          };
        }
        if (latency < 500) {
          return {
            border: 'border-green-400/40',
            bg: 'bg-surface',
            indicator: 'bg-green-400',
          };
        }
        if (latency < 800) {
          return {
            border: 'border-yellow-500/40',
            bg: 'bg-surface',
            indicator: 'bg-yellow-500',
          };
        }
        if (latency < 1000) {
          return {
            border: 'border-orange-500/40',
            bg: 'bg-surface',
            indicator: 'bg-orange-500',
          };
        }
        return {
          border: 'border-red-500/40',
          bg: 'bg-surface',
          indicator: 'bg-red-500',
        };
      }
      // 默认统一绿色
      return {
        border: 'border-success/40',
        bg: 'bg-surface',
        indicator: 'bg-success',
      };
    default:
      return { border: 'border-border', bg: 'bg-surface', indicator: 'bg-muted/40' };
  }
};

export const GridLayout: React.FC<GridLayoutProps> = memo(({ 
  sites, 
  results, 
  onCheck, 
  isRefreshing,
  showColorMode 
}) => {
  const getIconUrl = (site: SiteConfig): string => {
    if (site.iconUrl) return site.iconUrl;
    try {
      const urlObj = new URL(site.url);
      return `https://www.faviconextractor.com/favicon/${urlObj.hostname}`;
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(3rem, 1fr))' }}>
      {sites.map((site) => {
        const result = results[site.id];
        const status = result?.status || ConnectivityStatus.IDLE;
        const latency = result?.latency || 0;
        const refreshing = isRefreshing(site.id);
        const styles = getStatusStyles(status, latency, showColorMode);
        const isError = status === ConnectivityStatus.ERROR;
        const iconUrl = getIconUrl(site);

        return (
          <motion.button
            key={site.id}
            onClick={() => onCheck(site)}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`
              relative aspect-square rounded-lg border ${styles.border} ${styles.bg}
              transition-all duration-300 flex items-center justify-center
              group overflow-hidden
              ${isError ? 'grayscale-[50%] opacity-85 dark:opacity-70 dark:bg-zinc-800/80 dark:border-zinc-700/60' : ''}
              focus:outline-none focus:ring-2 focus:ring-primary/50
            `}
            aria-label={site.name}
            title={site.name}
          >
            {/* 水位填充效果（仅成功时显示） */}
            {status === ConnectivityStatus.SUCCESS && (() => {
              // 计算填充高度：延迟越低，填充越高 (0ms = 100%, 1000ms = 0%)
              const fillHeight = Math.max((1000 - latency) / 1000 * 100, 0);
              
              // 根据 showColorMode 和延迟确定颜色
              let fillColor = '';
              if (showColorMode) {
                // 多颜色模式：根据延迟使用不同颜色
                if (latency < 200) {
                  fillColor = 'from-green-500 to-green-400';
                } else if (latency < 500) {
                  fillColor = 'from-green-400 to-green-300';
                } else if (latency < 800) {
                  fillColor = 'from-yellow-500 to-yellow-400';
                } else if (latency < 1000) {
                  fillColor = 'from-orange-500 to-orange-400';
                } else {
                  fillColor = 'from-red-500 to-red-400';
                }
              } else {
                // 单色模式：使用绿色系，延迟越低颜色越深
                if (latency < 100) {
                  fillColor = 'from-emerald-600 to-emerald-500';
                } else if (latency < 200) {
                  fillColor = 'from-emerald-500 to-emerald-400';
                } else if (latency < 400) {
                  fillColor = 'from-emerald-400 to-emerald-300';
                } else if (latency < 600) {
                  fillColor = 'from-emerald-300 to-emerald-200';
                } else if (latency < 800) {
                  fillColor = 'from-emerald-200 to-emerald-100';
                } else {
                  fillColor = 'from-emerald-100 to-emerald-50';
                }
              }
              
              return (
                <motion.div
                  initial={false}
                  animate={{
                    height: `${fillHeight}%`,
                    opacity: refreshing ? 0.6 : 0.75
                  }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t ${fillColor} rounded-b-lg z-20 mix-blend-multiply dark:mix-blend-screen`}
                  style={{ 
                    borderTopLeftRadius: fillHeight > 90 ? '0.5rem' : '0',
                    borderTopRightRadius: fillHeight > 90 ? '0.5rem' : '0'
                  }}
                />
              );
            })()}

            {/* 图标 */}
            <div className="relative w-full h-full flex items-center justify-center p-2 z-10">
              {iconUrl ? (
                <img 
                  src={iconUrl} 
                  alt={`${site.name} icon`} 
                  className="w-full h-full object-contain rounded-sm"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (!site.iconUrl && target.src.includes('google.com')) {
                      target.style.display = 'none';
                    } else if (site.iconUrl && target.src === site.iconUrl) {
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
              ) : (
                <div className="w-4 h-4 rounded bg-muted/20"></div>
              )}
            </div>

            {/* 状态指示器 - 右上角 */}
            <div className="absolute top-1 right-1 z-20">
              {refreshing ? (
                <RefreshCw className="w-2 h-2 text-muted animate-spin" />
              ) : (
                <div className={`w-2 h-2 rounded-full ${styles.indicator} shadow-sm ring-1 ring-background/10`} />
              )}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
});

