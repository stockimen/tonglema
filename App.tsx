import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { StatusCard } from './components/StatusCard';
import { SITES } from './constants';
import { checkConnectivity } from './services/networkService';
import { CheckResult, ConnectivityStatus, CheckResultMap } from './types';
import { motion } from 'framer-motion';
import { Shield, Globe2, Info } from 'lucide-react';

export default function App() {
  const [results, setResults] = useState<CheckResultMap>({});
  const [isChecking, setIsChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<number | null>(null);

  // Function to check a single site
  const handleCheckSite = useCallback(async (id: string, url: string) => {
    // Set status to pending immediately
    setResults(prev => ({
      ...prev,
      [id]: {
        siteId: id,
        status: ConnectivityStatus.PENDING,
        latency: 0,
        timestamp: Date.now()
      }
    }));

    // Perform check
    const result = await checkConnectivity(id, url);
    
    // Update state
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

    // Initialize all to pending first for visual feedback
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

    // Execute in batches of 4 to avoid browser limit/choking but still fast
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

  return (
    <div className="min-h-screen bg-background text-text flex flex-col">
      <Header 
        onCheckAll={handleCheckAll} 
        isChecking={isChecking} 
        lastChecked={lastChecked} 
      />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8">
        
        {/* Overview Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-surface border border-border rounded-xl p-5 flex items-center gap-4">
             <div className="p-3 rounded-full bg-green-500/10 text-green-400">
               <Shield className="w-6 h-6" />
             </div>
             <div>
               <p className="text-sm text-muted">Services Online</p>
               <p className="text-2xl font-bold text-white">{stats.online} <span className="text-muted text-base font-normal">/ {SITES.length}</span></p>
             </div>
          </div>
          <div className="bg-surface border border-border rounded-xl p-5 flex items-center gap-4">
             <div className="p-3 rounded-full bg-blue-500/10 text-blue-400">
               <Globe2 className="w-6 h-6" />
             </div>
             <div>
               <p className="text-sm text-muted">Avg. Latency</p>
               <p className="text-2xl font-bold text-white">{avgLatency} <span className="text-sm font-normal text-muted">ms</span></p>
             </div>
          </div>
          <div className="bg-surface border border-border rounded-xl p-5 flex items-center gap-4">
             <div className="p-3 rounded-full bg-purple-500/10 text-purple-400">
               <Info className="w-6 h-6" />
             </div>
             <div>
               <p className="text-sm text-muted">Network Mode</p>
               <p className="text-lg font-bold text-white">Proxy Detection</p>
             </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {SITES.map((site) => (
            <StatusCard
              key={site.id}
              site={site}
              result={results[site.id]}
              onCheck={handleCheckSite}
            />
          ))}
        </div>
      </main>

      <footer className="py-8 border-t border-border mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-muted text-sm">
          <p>© {new Date().getFullYear()} TongLeMa (tonglema.com). Testing from your local browser.</p>
          <p className="mt-2 opacity-60">Latency values are estimates based on HTTP headers retrieval time.</p>
        </div>
      </footer>
    </div>
  );
}