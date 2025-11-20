import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { StatusCard } from './components/StatusCard';
import { SITES } from './constants';
import { checkConnectivity } from './services/networkService';
import { CheckResult, ConnectivityStatus, CheckResultMap, SiteConfig } from './types';
import { Shield, Globe2, Info, Layers } from 'lucide-react';

export default function App() {
  const [results, setResults] = useState<CheckResultMap>({});
  const [isChecking, setIsChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<number | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

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

  // Initialize theme
  useEffect(() => {
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
  }, []);

  // Function to check a single site
  const handleCheckSite = useCallback(async (id: string, url: string) => {
    setResults(prev => ({
      ...prev,
      [id]: {
        siteId: id,
        status: ConnectivityStatus.PENDING,
        latency: 0,
        timestamp: Date.now()
      }
    }));

    const result = await checkConnectivity(id, url);
    
    setResults(prev => ({
      ...prev,
      [id]: result
    }));
  }, []);

  // Function to check all sites
  const handleCheckAll = useCallback(async () => {
    if (isChecking) return;
    
    setIsChecking(true);
    setLastChecked(Date.now());

    // Initialize all to pending
    const pendingState: CheckResultMap = {};
    SITES.forEach(site => {
      pendingState[site.id] = {
        siteId: site.id,
        status: ConnectivityStatus.PENDING,
        latency: 0,
        timestamp: Date.now()
      };
    });
    setResults(pendingState);

    // Execute in batches
    const batchSize = 4;
    for (let i = 0; i < SITES.length; i += batchSize) {
      const batch = SITES.slice(i, i + batchSize);
      const promises = batch.map(site => checkConnectivity(site.id, site.url));
      const batchResults = await Promise.all(promises);
      
      setResults(prev => {
        const next = { ...prev };
        batchResults.forEach(res => {
          next[res.siteId] = res;
        });
        return next;
      });
    }

    setIsChecking(false);
  }, [isChecking]);

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

  return (
    <div className="min-h-screen bg-background text-text flex flex-col transition-colors duration-300">
      <Header 
        onCheckAll={handleCheckAll} 
        isChecking={isChecking} 
        lastChecked={lastChecked}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8">
        
        {/* Overview Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <div className="bg-surface border border-border rounded-xl p-5 flex items-center gap-4 shadow-sm">
             <div className="p-3 rounded-full bg-green-500/10 text-green-600 dark:text-green-400">
               <Shield className="w-6 h-6" />
             </div>
             <div>
               <p className="text-sm text-muted">Services Online</p>
               <p className="text-2xl font-bold text-text">{stats.online} <span className="text-muted text-base font-normal">/ {SITES.length}</span></p>
             </div>
          </div>
          <div className="bg-surface border border-border rounded-xl p-5 flex items-center gap-4 shadow-sm">
             <div className="p-3 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
               <Globe2 className="w-6 h-6" />
             </div>
             <div>
               <p className="text-sm text-muted">Avg. Latency</p>
               <p className="text-2xl font-bold text-text">{avgLatency} <span className="text-sm font-normal text-muted">ms</span></p>
             </div>
          </div>
          <div className="bg-surface border border-border rounded-xl p-5 flex items-center gap-4 shadow-sm">
             <div className="p-3 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400">
               <Info className="w-6 h-6" />
             </div>
             <div>
               <p className="text-sm text-muted">Network Mode</p>
               <p className="text-lg font-bold text-text">Proxy Detection</p>
             </div>
          </div>
        </div>

        {/* Grouped Sections */}
        <div className="space-y-12">
          {categoryOrder.map(category => {
            const categorySites = groupedSites[category];
            if (!categorySites) return null;

            return (
              <div key={category}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px flex-1 bg-border"></div>
                  <h2 className="text-lg font-semibold text-muted uppercase tracking-wider flex items-center gap-2">
                    {category === 'AI' && <Layers className="w-4 h-4" />}
                    {category} Services
                  </h2>
                  <div className="h-px flex-1 bg-border"></div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {categorySites.map((site) => (
                    <StatusCard
                      key={site.id}
                      site={site}
                      result={results[site.id]}
                      onCheck={handleCheckSite}
                    />
                  ))}
                </div>
              </div>
            );
          })}
          
          {/* Render any categories not in the explicit order list */}
          {Object.keys(groupedSites).filter(cat => !categoryOrder.includes(cat)).map(category => (
             <div key={category}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px flex-1 bg-border"></div>
                  <h2 className="text-lg font-semibold text-muted uppercase tracking-wider">
                    {category}
                  </h2>
                  <div className="h-px flex-1 bg-border"></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {groupedSites[category].map((site) => (
                    <StatusCard
                      key={site.id}
                      site={site}
                      result={results[site.id]}
                      onCheck={handleCheckSite}
                    />
                  ))}
                </div>
             </div>
          ))}
        </div>

      </main>

      <footer className="py-8 border-t border-border mt-auto bg-surface/50">
        <div className="max-w-7xl mx-auto px-4 text-center text-muted text-sm">
          <p>© {new Date().getFullYear()} TongLeMa (tonglema.com). Testing from your local browser.</p>
          <p className="mt-2 opacity-60">Latency values are estimates based on HTTP headers retrieval time.</p>
        </div>
      </footer>
    </div>
  );
}