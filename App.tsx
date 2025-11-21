
import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Header } from './components/Header';
import { StatusCard } from './components/StatusCard';
import { SITES, TRANSLATIONS } from './constants';
import { checkConnectivity } from './services/networkService';
import { CheckResult, ConnectivityStatus, CheckResultMap, SiteConfig, Language } from './types';
import { Shield, Globe2, Info, Layers, Lock, Github } from 'lucide-react';

// 将常量移到组件外部，避免每次渲染都重新创建
const CATEGORY_ORDER = ['AI', 'Search', 'Social', 'Media', 'Dev'];

export default function App() {
  const [results, setResults] = useState<CheckResultMap>({});
  const [isChecking, setIsChecking] = useState(false);
  // Track which sites are currently refreshing to avoid clearing their data (prevent flicker)
  const [refreshingIds, setRefreshingIds] = useState<Set<string>>(new Set());
  // 使用 ref 跟踪检查状态，避免 handleCheckAll 依赖变化
  const isCheckingRef = useRef(false);
  
  // Initialize lastChecked from localStorage
  const [lastChecked, setLastChecked] = useState<number | null>(() => {
    const saved = localStorage.getItem('lastChecked');
    return saved ? parseInt(saved, 10) : null;
  });

  // Initialize theme from localStorage or system preference
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return savedTheme || (systemPrefersDark ? 'dark' : 'light');
    }
    return 'dark';
  });
  
  // Initialize refreshInterval from localStorage
  const [refreshInterval, setRefreshInterval] = useState<number>(() => {
    const saved = localStorage.getItem('refreshInterval');
    return saved ? parseInt(saved, 10) : 0;
  }); 

  // Initialize language from localStorage or browser preference
  const [lang, setLang] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('lang') as Language | null;
      if (savedLang) {
        return savedLang;
      } else {
        const browserLang = navigator.language || 'en';
        return browserLang.toLowerCase().startsWith('zh') ? 'zh' : 'en';
      }
    }
    return 'en';
  });

  // Initialize color mode from localStorage
  const [showColorMode, setShowColorMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('showColorMode');
      return saved ? saved === 'true' : false;
    }
    return false;
  });

  // Sync theme state with DOM (主题已在 HTML 脚本中设置，这里确保状态同步)
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const currentTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
    
    // 确保状态与 DOM 一致
    setTheme(currentTheme);
    
    // 确保 DOM 类与状态一致（双重保险）
    if (currentTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // SEO: Update Document Title and Meta Tags when language changes
  useEffect(() => {
    const t = TRANSLATIONS[lang];
    if (t.meta) {
      document.title = t.meta.title;
      
      const updateMeta = (name: string, content: string) => {
        let element = document.querySelector(`meta[name="${name}"]`);
        if (element) {
          element.setAttribute('content', content);
        }
      };

      updateMeta('description', t.meta.description);
      updateMeta('keywords', t.meta.keywords);
      
      // Also update OG tags
      const updateOgMeta = (property: string, content: string) => {
        let element = document.querySelector(`meta[property="${property}"]`);
        if (element) {
          element.setAttribute('content', content);
        }
      };

      updateOgMeta('og:title', t.meta.title);
      updateOgMeta('og:description', t.meta.description);
    }
  }, [lang]);

  // Persist settings to localStorage
  useEffect(() => {
    localStorage.setItem('refreshInterval', refreshInterval.toString());
  }, [refreshInterval]);

  useEffect(() => {
    if (lastChecked) {
      localStorage.setItem('lastChecked', lastChecked.toString());
    }
  }, [lastChecked]);

  useEffect(() => {
    localStorage.setItem('showColorMode', showColorMode.toString());
  }, [showColorMode]);

  // Toggle Language
  const toggleLang = useCallback(() => {
    setLang(prev => {
      const next = prev === 'en' ? 'zh' : 'en';
      localStorage.setItem('lang', next);
      return next;
    });
  }, []);

  // Theme toggle handler
  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', newTheme);
  }, [theme]);

  // Function to check a single site
  const handleCheckSite = useCallback(async (site: SiteConfig) => {
    // Mark as refreshing
    setRefreshingIds(prev => new Set(prev).add(site.id));

    // Only set status to PENDING if we don't have a result yet (first load)
    // This preserves the old color/result while refreshing, preventing flicker
    setResults(prev => {
      if (!prev[site.id]) {
        return {
          ...prev,
          [site.id]: {
            siteId: site.id,
            status: ConnectivityStatus.PENDING,
            latency: 0,
            timestamp: Date.now()
          }
        };
      }
      return prev;
    });

    const result = await checkConnectivity(site);
    
    setResults(prev => ({
      ...prev,
      [site.id]: result
    }));

    // Remove from refreshing
    setRefreshingIds(prev => {
      const next = new Set(prev);
      next.delete(site.id);
      return next;
    });
  }, []);

  // Function to check all sites
  const handleCheckAll = useCallback(async () => {
    if (isCheckingRef.current) return;
    
    isCheckingRef.current = true;
    setIsChecking(true);
    setLastChecked(Date.now());

    // Mark all as refreshing
    setRefreshingIds(new Set(SITES.map(s => s.id)));

    // Initialize IDLE/Missing sites to PENDING visual state
    setResults(prev => {
      const next = { ...prev };
      SITES.forEach(site => {
        // Only mark as pending if not already existing to avoid flashing
        if (!next[site.id]) {
           next[site.id] = {
            siteId: site.id,
            status: ConnectivityStatus.PENDING,
            latency: 0,
            timestamp: Date.now()
          };
        }
      });
      return next;
    });

    // Execute in batches
    const batchSize = 6; 
    for (let i = 0; i < SITES.length; i += batchSize) {
      const batch = SITES.slice(i, i + batchSize);
      const promises = batch.map(site => checkConnectivity(site));
      const batchResults = await Promise.all(promises);
      
      setResults(prev => {
        const next = { ...prev };
        batchResults.forEach(res => {
          next[res.siteId] = res;
        });
        return next;
      });

      // Remove completed batch from refreshing
      setRefreshingIds(prev => {
        const next = new Set(prev);
        batch.forEach(s => next.delete(s.id));
        return next;
      });
    }

    isCheckingRef.current = false;
    setIsChecking(false);
    setRefreshingIds(new Set()); // Ensure cleanup
  }, []);

  // Auto Refresh Effect
  useEffect(() => {
    if (refreshInterval === 0) return;

    const id = setInterval(() => {
      handleCheckAll();
    }, refreshInterval);

    return () => clearInterval(id);
  }, [refreshInterval, handleCheckAll]);

  // Run check on mount
  useEffect(() => {
    handleCheckAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 使用 useMemo 缓存统计计算结果，只在 results 变化时重新计算
  const stats = useMemo(() => {
    return Object.values(results).reduce<{ online: number; offline: number; avgLatency: number; count: number }>((acc, curr: CheckResult) => {
      if (curr.status === ConnectivityStatus.SUCCESS) acc.online++;
      if (curr.status === ConnectivityStatus.ERROR || curr.status === ConnectivityStatus.TIMEOUT) acc.offline++;
      if (curr.latency > 0) {
        acc.avgLatency += curr.latency;
        acc.count++;
      }
      return acc;
    }, { online: 0, offline: 0, avgLatency: 0, count: 0 });
  }, [results]);
  
  const avgLatency = useMemo(() => {
    return stats.count > 0 ? Math.round(stats.avgLatency / stats.count) : 0;
  }, [stats]);

  // 使用 useMemo 缓存分组结果，SITES 是常量，只在首次渲染时计算
  const groupedSites = useMemo(() => {
    return SITES.reduce<Record<string, SiteConfig[]>>((acc, site) => {
      if (!acc[site.category]) acc[site.category] = [];
      acc[site.category].push(site);
      return acc;
    }, {});
  }, []);

  // 使用 useMemo 缓存翻译对象
  const t = useMemo(() => TRANSLATIONS[lang], [lang]);

  return (
    <div className="min-h-screen bg-background text-text flex flex-col transition-colors duration-500">
      <Header 
        onCheckAll={handleCheckAll} 
        isChecking={isChecking} 
        lastChecked={lastChecked}
        theme={theme}
        toggleTheme={toggleTheme}
        refreshInterval={refreshInterval}
        setRefreshInterval={setRefreshInterval}
        lang={lang}
        toggleLang={toggleLang}
        showColorMode={showColorMode}
        setShowColorMode={setShowColorMode}
      />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 space-y-10">
        
        {/* Overview Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-surface border border-border rounded-xl p-4 flex items-center gap-4 transition-colors">
             <div className="p-2 rounded-lg bg-background/50 border border-border/50">
               <Shield className="w-5 h-5 text-success" />
             </div>
             <div>
               <p className="text-xs font-medium text-muted uppercase tracking-wider">{t.services_online}</p>
               <div className="flex items-baseline gap-2">
                 <p className="text-2xl font-bold text-text">{stats.online}</p>
                 <span className="text-muted text-xs">/ {SITES.length}</span>
               </div>
             </div>
          </div>
          <div className="bg-surface border border-border rounded-xl p-4 flex items-center gap-4 transition-colors">
             <div className="p-2 rounded-lg bg-background/50 border border-border/50">
               <Globe2 className="w-5 h-5 text-primary" />
             </div>
             <div>
               <p className="text-xs font-medium text-muted uppercase tracking-wider">{t.avg_latency}</p>
               <div className="flex items-baseline gap-2">
                 <p className="text-2xl font-bold text-text">{avgLatency}</p>
                 <span className="text-xs font-medium text-muted">ms</span>
               </div>
             </div>
          </div>
          <div className="bg-surface border border-border rounded-xl p-4 flex items-center gap-4 transition-colors">
             <div className="p-2 rounded-lg bg-background/50 border border-border/50">
               <Info className="w-5 h-5 text-muted" />
             </div>
             <div>
               <p className="text-xs font-medium text-muted uppercase tracking-wider">{t.network_mode}</p>
               <div className="flex items-baseline gap-2">
                 <p className="text-base font-bold text-text">{t.browser_proxy}</p>
               </div>
             </div>
          </div>
        </div>

        {/* Color Legend */}
        <div className="bg-surface border border-border rounded-xl p-3">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            {/* Unreachable */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-muted/20 border border-border grayscale-[50%] opacity-85 flex items-center justify-center shrink-0">
                <div className="w-2 h-2 rounded-full bg-muted/50"></div>
              </div>
              <div>
                <p className="text-[11px] font-medium text-text leading-tight">{t.legend_unreachable}</p>
                <p className="text-[10px] text-muted/70 leading-tight">{t.legend_unreachable_desc}</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 rounded-full bg-black/5 dark:bg-white/5 overflow-hidden shrink-0">
                <div className="h-full w-full bg-success"></div>
              </div>
              <div>
                <p className="text-[11px] font-medium text-text leading-tight">{t.legend_progress_bar}</p>
                <p className="text-[10px] text-muted/70 leading-tight">{t.legend_progress_bar_desc}</p>
              </div>
            </div>

            {/* Color Mode Colors (only show when enabled) */}
            {showColorMode && (
              <>
                <div className="h-6 w-px bg-border/50"></div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded border border-green-500/40 bg-surface flex items-center justify-center shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                    </div>
                    <div>
                      <p className="text-[11px] font-medium text-green-600 dark:text-green-400 leading-tight">{t.legend_fast}</p>
                      <p className="text-[10px] text-muted/70 leading-tight">&lt; 200ms</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded border border-green-400/40 bg-surface flex items-center justify-center shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
                    </div>
                    <div>
                      <p className="text-[11px] font-medium text-green-500 dark:text-green-300 leading-tight">{t.legend_medium}</p>
                      <p className="text-[10px] text-muted/70 leading-tight">200-500ms</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded border border-yellow-500/40 bg-surface flex items-center justify-center shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div>
                    </div>
                    <div>
                      <p className="text-[11px] font-medium text-yellow-600 dark:text-yellow-400 leading-tight">{t.legend_slow}</p>
                      <p className="text-[10px] text-muted/70 leading-tight">500-800ms</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded border border-orange-500/40 bg-surface flex items-center justify-center shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                    </div>
                    <div>
                      <p className="text-[11px] font-medium text-orange-600 dark:text-orange-400 leading-tight">{t.legend_very_slow}</p>
                      <p className="text-[10px] text-muted/70 leading-tight">&gt; 800ms</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Grouped Sections */}
        <div className="space-y-10">
          {CATEGORY_ORDER.map(category => {
            const categorySites = groupedSites[category];
            if (!categorySites) return null;

            // Translate Category Name
            const displayCategory = t.categories[category as keyof typeof t.categories] || category;

            return (
              <div key={category} className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex items-center gap-3 mb-5">
                  <h2 className="text-lg font-bold text-text flex items-center gap-2 bg-surface/50 px-3 py-1 rounded-lg border border-border/50 backdrop-blur-sm">
                    {category === 'AI' && <Layers className="w-4 h-4 text-primary" />}
                    {displayCategory}
                    <span className="text-xs font-normal text-muted/70 ml-1">({categorySites.length})</span>
                  </h2>
                  <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent"></div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {categorySites.map((site) => (
                    <StatusCard
                      key={site.id}
                      site={site}
                      result={results[site.id]}
                      onCheck={handleCheckSite}
                      lang={lang}
                      isRefreshing={refreshingIds.has(site.id)}
                      showColorMode={showColorMode}
                    />
                  ))}
                </div>
              </div>
            );
          })}
          
          {/* Render any categories not in the explicit order list */}
          {Object.keys(groupedSites).filter(cat => !CATEGORY_ORDER.includes(cat)).map(category => {
            const categorySites = groupedSites[category];
            return (
             <div key={category} className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex items-center gap-3 mb-5">
                   <h2 className="text-lg font-bold text-text flex items-center gap-2 bg-surface/50 px-3 py-1 rounded-lg border border-border/50 backdrop-blur-sm">
                    {t.categories[category as keyof typeof t.categories] || category}
                    <span className="text-xs font-normal text-muted/70 ml-1">({categorySites.length})</span>
                  </h2>
                  <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent"></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {categorySites.map((site) => (
                    <StatusCard
                      key={site.id}
                      site={site}
                      result={results[site.id]}
                      onCheck={handleCheckSite}
                      lang={lang}
                      isRefreshing={refreshingIds.has(site.id)}
                      showColorMode={showColorMode}
                    />
                  ))}
                </div>
             </div>
            );
          })}
        </div>

      </main>

      <footer className="py-10 border-t border-border mt-auto bg-surface/30 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 text-center flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-surface border border-border shadow-sm">
             <Lock className="w-3 h-3 text-success" />
             <span className="text-[10px] font-semibold text-muted uppercase tracking-widest">{t.privacy_badge}</span>
          </div>
          
          <p className="text-xs text-muted/80 max-w-2xl mx-auto leading-relaxed">
            {t.footer_text}
          </p>
          
          <div className="h-px w-12 bg-border/50 my-2"></div>

          <div className="flex flex-col items-center gap-1.5">
            <p className="text-[10px] text-muted/40">
              © 2023-2025 <span className="font-medium text-muted/60 hover:text-primary transition-colors cursor-default">Magicx.dev</span>
            </p>
            <a 
              href="https://github.com/simonxmau/tonglema" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[10px] text-muted/40 hover:text-text transition-colors"
            >
              <Github className="w-3 h-3 opacity-60" />
              <span>github.com/simonxmau/tonglema</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
