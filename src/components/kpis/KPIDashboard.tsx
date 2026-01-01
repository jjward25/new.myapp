"use client";

import React, { useState, useEffect, useCallback } from 'react';

interface KPIData {
  p0Completed: { thisWeek: number; lastWeek: number };
  cardioMiles: { thisWeek: number; lastWeek: number; goal: number };
  eventsThisWeek: number;
  openTasks: number;
}

// Global function to trigger KPI refresh from anywhere
export function refreshKPIs() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('kpi-refresh'));
  }
}

const WoWIndicator: React.FC<{ current: number; previous: number }> = ({ current, previous }) => {
  const delta = current - previous;
  
  if (delta === 0) {
    return <span className="text-xs text-gray-400 ml-1">—</span>;
  }
  
  const isPositive = delta > 0;
  
  // Format delta: round to 2 decimal places and remove trailing zeros
  const formatDelta = (num: number) => {
    const rounded = Math.round(Math.abs(num) * 100) / 100;
    return rounded % 1 === 0 ? rounded.toString() : rounded.toFixed(2).replace(/\.?0+$/, '');
  };
  
  return (
    <span className={`text-xs ml-1 flex items-center ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
      {isPositive ? (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      )}
      {formatDelta(delta)}
    </span>
  );
};

const KPIDashboard: React.FC = () => {
  const [data, setData] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchKPIs = useCallback(async () => {
    try {
      const response = await fetch('/api/kpis');
      if (!response.ok) throw new Error('Failed to fetch KPIs');
      const kpiData = await response.json();
      setData(kpiData);
    } catch (error) {
      console.error('Error fetching KPIs:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchKPIs();
  }, [fetchKPIs]);

  // Listen for refresh events
  useEffect(() => {
    const handleRefresh = () => {
      fetchKPIs();
    };

    window.addEventListener('kpi-refresh', handleRefresh);
    return () => window.removeEventListener('kpi-refresh', handleRefresh);
  }, [fetchKPIs]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-slate-800/50 rounded-lg p-4 animate-pulse h-20" />
        ))}
      </div>
    );
  }

  if (!data) return null;

  const milesPercentage = Math.min((data.cardioMiles.thisWeek / data.cardioMiles.goal) * 100, 100);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full mb-6">
      {/* P0s Completed */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-4 border border-cyan-800/50 hover:border-cyan-600/50 transition-colors">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-cyan-400 uppercase tracking-wide font-medium">P0s Done</span>
          <WoWIndicator current={data.p0Completed.thisWeek} previous={data.p0Completed.lastWeek} />
        </div>
        <div className="flex items-baseline">
          <span className="text-2xl font-bold text-white">{data.p0Completed.thisWeek}</span>
          <span className="text-xs text-gray-400 ml-1">this week</span>
        </div>
      </div>

      {/* Cardio Miles */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-4 border border-cyan-800/50 hover:border-cyan-600/50 transition-colors">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-cyan-400 uppercase tracking-wide font-medium">Miles Run</span>
          <WoWIndicator current={data.cardioMiles.thisWeek} previous={data.cardioMiles.lastWeek} />
        </div>
        <div className="flex items-baseline mb-2">
          <span className="text-2xl font-bold text-white">{data.cardioMiles.thisWeek.toFixed(1)}</span>
          <span className="text-xs text-gray-400 ml-1">/ {data.cardioMiles.goal} mi</span>
        </div>
        {/* Progress meter */}
        <div className="w-full bg-slate-700 rounded-full h-1.5">
          <div 
            className={`h-1.5 rounded-full transition-all duration-500 ${
              milesPercentage >= 100 ? 'bg-emerald-500' : milesPercentage >= 50 ? 'bg-cyan-500' : 'bg-amber-500'
            }`}
            style={{ width: `${milesPercentage}%` }}
          />
        </div>
      </div>

      {/* Events This Week */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-4 border border-cyan-800/50 hover:border-cyan-600/50 transition-colors">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-cyan-400 uppercase tracking-wide font-medium">Events</span>
          <svg className="w-4 h-4 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <div className="flex items-baseline">
          <span className="text-2xl font-bold text-white">{data.eventsThisWeek}</span>
          <span className="text-xs text-gray-400 ml-1">this week</span>
        </div>
      </div>

      {/* Open Tasks */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-4 border border-cyan-800/50 hover:border-cyan-600/50 transition-colors">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-cyan-400 uppercase tracking-wide font-medium">Open Tasks</span>
          <svg className="w-4 h-4 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <div className="flex items-baseline">
          <span className="text-2xl font-bold text-white">{data.openTasks}</span>
          <span className="text-xs text-gray-400 ml-1">pending</span>
        </div>
      </div>
    </div>
  );
};

export default KPIDashboard;

