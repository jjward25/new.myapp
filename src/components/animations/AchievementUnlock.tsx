"use client";

import React, { useState, useCallback, useEffect, createContext, useContext } from 'react';
import { Award, Star } from 'lucide-react';

interface Achievement {
  id: number;
  title: string;
  subtitle: string;
  leftEmoji?: string;
  rightEmoji?: string;
}

interface AchievementContextType {
  showAchievement: (title: string, subtitle: string, leftEmoji?: string, rightEmoji?: string) => void;
}

const AchievementContext = createContext<AchievementContextType | null>(null);

export function useAchievement() {
  const context = useContext(AchievementContext);
  if (!context) {
    throw new Error('useAchievement must be used within an AchievementProvider');
  }
  return context;
}

export function AchievementProvider({ children }: { children: React.ReactNode }) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  const showAchievement = useCallback((title: string, subtitle: string, leftEmoji?: string, rightEmoji?: string) => {
    const id = Date.now();
    const newAchievement: Achievement = { id, title, subtitle, leftEmoji, rightEmoji };
    
    setAchievements(prev => [...prev, newAchievement]);
    
    // Auto-dismiss after 4 seconds
    setTimeout(() => {
      setAchievements(prev => prev.filter(a => a.id !== id));
    }, 4000);
  }, []);

  return (
    <AchievementContext.Provider value={{ showAchievement }}>
      {children}
      <AchievementContainer achievements={achievements} />
    </AchievementContext.Provider>
  );
}

function AchievementContainer({ achievements }: { achievements: Achievement[] }) {
  return (
    <div className="fixed top-4 left-0 right-0 z-[9999] flex flex-col items-center gap-2 pointer-events-none">
      {achievements.map((achievement) => (
        <AchievementBanner key={achievement.id} achievement={achievement} />
      ))}
    </div>
  );
}

function AchievementBanner({ achievement }: { achievement: Achievement }) {
  return (
    <div className="animate-in slide-in-from-top-10 duration-700 pointer-events-auto">
      <div className="bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-400 text-amber-950 px-6 py-4 rounded-xl shadow-2xl border-2 border-amber-600 max-w-md mx-4">
        <div className="flex items-start gap-4">
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 bg-amber-300 rounded-full animate-ping" />
            <div className="relative bg-amber-950 rounded-full p-2">
              <Award className="h-6 w-6 text-amber-400" />
            </div>
          </div>
          <div className="flex-1 space-y-1 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide opacity-80">Achievement Unlocked!</p>
            <p className="font-bold text-lg leading-tight flex items-center gap-2 flex-wrap">
              {achievement.leftEmoji && <span>{achievement.leftEmoji}</span>}
              <span>{achievement.title}</span>
              {achievement.rightEmoji && <span>{achievement.rightEmoji}</span>}
            </p>
            <p className="text-sm opacity-80">{achievement.subtitle}</p>
            <div className="flex gap-1 mt-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Star
                  key={i}
                  className="h-4 w-4 fill-amber-950 animate-in zoom-in-50 duration-300"
                  style={{ animationDelay: `${i * 100}ms` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Standalone component for simple usage without context - Full screen centered overlay
export function AchievementUnlockStandalone({ 
  show, 
  title, 
  subtitle,
  leftEmoji,
  rightEmoji,
  level,
  onClose 
}: { 
  show: boolean; 
  title: string; 
  subtitle: string;
  leftEmoji?: string;
  rightEmoji?: string;
  level?: number;
  onClose?: () => void;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [displayData, setDisplayData] = useState({ title, subtitle, leftEmoji, rightEmoji, level });

  useEffect(() => {
    if (show && !isVisible) {
      // Capture the data when animation starts
      setDisplayData({ title, subtitle, leftEmoji, rightEmoji, level });
      setIsVisible(true);
      
      // Set timer to hide after 4 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
        if (onClose) onClose();
      }, 4000);
      
      return () => clearTimeout(timer);
    }
  }, [show, isVisible, title, subtitle, leftEmoji, rightEmoji, level, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none">
      {/* Semi-transparent backdrop */}
      <div className="absolute inset-0 bg-black/50 animate-in fade-in duration-300" />
      
      {/* Centered achievement banner */}
      <div className="relative animate-in zoom-in-75 duration-700 pointer-events-auto">
        {/* Glow effect behind the banner */}
        <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-400 rounded-2xl blur-xl opacity-60 animate-pulse" />
        
        <div className="relative bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-400 text-amber-950 px-8 py-6 rounded-2xl shadow-2xl border-4 border-amber-600 max-w-lg mx-4">
          <div className="flex items-center gap-5">
            <div className="relative flex-shrink-0">
              {/* Outer pulsing rings */}
              <div className="absolute inset-0 bg-amber-300 rounded-full animate-ping opacity-40" style={{ transform: 'scale(1.5)' }} />
              <div className="absolute inset-0 bg-amber-400 rounded-full animate-ping opacity-30" style={{ animationDelay: '0.2s', transform: 'scale(2)' }} />
              <div className="relative bg-amber-950 rounded-full p-4 shadow-lg">
                <Award className="h-10 w-10 text-amber-400" />
              </div>
            </div>
            <div className="flex-1 space-y-2 min-w-0">
              <p className="text-sm font-bold uppercase tracking-widest opacity-90 animate-in fade-in duration-500">
                Achievement Unlocked!
              </p>
              <p className="font-bold text-2xl leading-tight flex items-center gap-2 flex-wrap animate-in slide-in-from-right-4 duration-500" style={{ animationDelay: '0.2s' }}>
                {displayData.leftEmoji && <span className="text-3xl">{displayData.leftEmoji}</span>}
                <span>{displayData.title}</span>
                {displayData.level !== undefined && displayData.level > 0 && <span className="text-amber-800">[Level {displayData.level}]</span>}
                {displayData.rightEmoji && <span className="text-3xl">{displayData.rightEmoji}</span>}
              </p>
              <p className="text-base opacity-80 animate-in fade-in duration-500" style={{ animationDelay: '0.4s' }}>
                {displayData.subtitle}
              </p>
              <div className="flex gap-2 mt-3">
                {Array.from({ length: Math.min(displayData.level || 3, 5) }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-6 w-6 fill-amber-950 text-amber-950 animate-in zoom-in-50 duration-300"
                    style={{ animationDelay: `${0.5 + i * 0.1}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Sparkle effects around the banner */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-3 h-3 bg-amber-300 rounded-full animate-ping"
            style={{
              top: `${30 + Math.cos((i / 12) * Math.PI * 2) * 25}%`,
              left: `${50 + Math.sin((i / 12) * Math.PI * 2) * 30}%`,
              animationDelay: `${i * 0.1}s`,
              animationDuration: '1.5s'
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default AchievementProvider;

