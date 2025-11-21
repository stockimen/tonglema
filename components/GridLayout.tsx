
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
        border: 'border-border',
        bg: 'bg-surface',
        indicator: 'bg-muted/40',
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
        border: 'border-border',
        bg: 'bg-muted/20',
        indicator: 'bg-muted/50',
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
      return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=128`;
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
              ${isError ? 'grayscale-[50%] opacity-85' : ''}
              focus:outline-none focus:ring-2 focus:ring-primary/50
            `}
            aria-label={site.name}
            title={site.name}
          >
            {/* 图标 */}
            <div className="relative w-full h-full flex items-center justify-center p-2">
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
                        target.src = `https://www.google.com/s2/favicons?domain=${new URL(site.url).hostname}&sz=128`;
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
            <div className="absolute top-1 right-1 z-10">
              {refreshing ? (
                <RefreshCw className="w-2 h-2 text-muted animate-spin" />
              ) : (
                <div className={`w-2 h-2 rounded-full ${styles.indicator} shadow-sm ring-1 ring-background/10`} />
              )}
            </div>

            {/* 底部进度条（仅成功时显示） */}
            {status === ConnectivityStatus.SUCCESS && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black/5 dark:bg-white/5 overflow-hidden rounded-b-lg">
                <motion.div 
                  initial={false}
                  animate={{ 
                    width: `${Math.max((1000 - latency) / 1000 * 100, 0)}%`, 
                    opacity: refreshing ? 0.5 : 1 
                  }}
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
              </div>
            )}
          </motion.button>
        );
      })}
    </div>
  );
});

