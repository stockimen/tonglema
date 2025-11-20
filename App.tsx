
import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { StatusCard } from './components/StatusCard';
import { SITES, TRANSLATIONS } from './constants';
import { checkConnectivity } from './services/networkService';
import { CheckResult, ConnectivityStatus, CheckResultMap, SiteConfig, Language } from './types';
import { Shield, Globe2, Info, Layers, Lock, Github } from 'lucide-react';

export default function App() {
  const [results, setResults] = useState<CheckResultMap>({});
  const [isChecking, setIsChecking] = useState(false);
  // Track which sites are currently refreshing to avoid clearing their data (prevent flicker)
  const [refreshingIds, setRefreshingIds] = useState<Set<string>>(new Set());
  
  // Initialize lastChecked from localStorage
  const [lastChecked, setLastChecked] = useState<number | null>(() => {
    const saved = localStorage.getItem('lastChecked');
    return saved ? parseInt(saved, 10) : null;
  });

  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  
  // Initialize refreshInterval from localStorage
  const [refreshInterval, setRefreshInterval] = useState<number>(() => {
    const saved = localStorage.getItem('refreshInterval');
    return saved ? parseInt(saved, 10) : 0;
  }); 

  const [lang, setLang] = useState<Language>('en');

  // Initialize theme and language
  useEffect(() => {
    // Theme initialization
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme) {
      setTheme(savedTheme);
      if (savedTheme === 'dark') document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
    } else if (systemPrefersDark) {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    } else {
      setTheme('light');
      document.documentElement.classList.remove('dark');
    }

    // Language initialization
    const savedLang = localStorage.getItem('lang') as Language | null;
    if (savedLang) {
      setLang(savedLang);
    } else {
      const browserLang = navigator.language || 'en';
      if (browserLang.toLowerCase().startsWith('zh')) {
        setLang('zh');
      } else {
        setLang('en');
      }
    }
  }, []);

  // Persist settings to localStorage
  useEffect(() => {
    localStorage.setItem('refreshInterval', refreshInterval.toString());
  }, [refreshInterval]);

  useEffect(() => {
    if (lastChecked) {
      localStorage.setItem('lastChecked', lastChecked.toString());
    }
  }, [lastChecked]);

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
    if (isChecking) return;
    
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

    setIsChecking(false);
    setRefreshingIds(new Set()); // Ensure cleanup
  }, [isChecking]);

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

  // Calculate overview stats
  const stats = Object.values(results).reduce<{ online: number; offline: number; avgLatency: number; count: number }>((acc, curr) => {
    if (curr.status === ConnectivityStatus.SUCCESS) acc.online++;
    if (curr.status === ConnectivityStatus.ERROR || curr.status === ConnectivityStatus.TIMEOUT) acc.offline++;
    if (curr.latency > 0) {
      acc.avgLatency += curr.latency;
      acc.count++;
    }
    return acc;
  }, { online: 0, offline: 0, avgLatency: 0, count: 0 });
  
  const avgLatency = stats.count > 0 ? Math.round(stats.avgLatency / stats.count) : 0;

  // Group sites by category
  const groupedSites = SITES.reduce<Record<string, SiteConfig[]>>((acc, site) => {
    if (!acc[site.category]) acc[site.category] = [];
    acc[site.category].push(site);
    return acc;
  }, {});

  // Define category order
  const categoryOrder = ['AI', 'Search', 'Social', 'Media', 'Dev'];
  const t = TRANSLATIONS[lang];

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
      />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 space-y-10">
        
        {/* Overview Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-surface/50 backdrop-blur-sm border border-border rounded-2xl p-6 flex items-center gap-5 shadow-sm hover:shadow-md transition-shadow">
             <div className="p-3.5 rounded-xl bg-green-500/10 text-green-600 dark:text-green-400 ring-1 ring-green-500/20">
               <Shield className="w-7 h-7" />
             </div>
             <div>
               <p className="text-sm font-medium text-muted uppercase tracking-wider">{t.services_online}</p>
               <div className="flex items-baseline gap-2">
                 <p className="text-3xl font-bold text-text">{stats.online}</p>
                 <span className="text-muted text-sm">/ {SITES.length}</span>
               </div>
             </div>
          </div>
          <div className="bg-surface/50 backdrop-blur-sm border border-border rounded-2xl p-6 flex items-center gap-5 shadow-sm hover:shadow-md transition-shadow">
             <div className="p-3.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/20">
               <Globe2 className="w-7 h-7" />
             </div>
             <div>
               <p className="text-sm font-medium text-muted uppercase tracking-wider">{t.avg_latency}</p>
               <div className="flex items-baseline gap-2">
                 <p className="text-3xl font-bold text-text">{avgLatency}</p>
                 <span className="text-sm font-medium text-muted">ms</span>
               </div>
             </div>
          </div>
          <div className="bg-surface/50 backdrop-blur-sm border border-border rounded-2xl p-6 flex items-center gap-5 shadow-sm hover:shadow-md transition-shadow">
             <div className="p-3.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 ring-1 ring-purple-500/20">
               <Info className="w-7 h-7" />
             </div>
             <div>
               <p className="text-sm font-medium text-muted uppercase tracking-wider">{t.network_mode}</p>
               <div className="flex items-baseline gap-2">
                 <p className="text-lg font-bold text-text">{t.browser_proxy}</p>
               </div>
             </div>
          </div>
        </div>

        {/* Grouped Sections */}
        <div className="space-y-10">
          {categoryOrder.map(category => {
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
                    />
                  ))}
                </div>
              </div>
            );
          })}
          
          {/* Render any categories not in the explicit order list */}
          {Object.keys(groupedSites).filter(cat => !categoryOrder.includes(cat)).map(category => (
             <div key={category} className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex items-center gap-3 mb-5">
                   <h2 className="text-lg font-bold text-text flex items-center gap-2 bg-surface/50 px-3 py-1 rounded-lg border border-border/50 backdrop-blur-sm">
                    {t.categories[category as keyof typeof t.categories] || category}
                  </h2>
                  <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent"></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {groupedSites[category].map((site) => (
                    <StatusCard
                      key={site.id}
                      site={site}
                      result={results[site.id]}
                      onCheck={handleCheckSite}
                      lang={lang}
                      isRefreshing={refreshingIds.has(site.id)}
                    />
                  ))}
                </div>
             </div>
          ))}
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
