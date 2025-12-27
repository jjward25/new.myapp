"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Check } from 'lucide-react';

// Custom event types
interface AnimationEvent {
  type: 'success' | 'achievement' | 'particles';
  message?: string;
  level?: number;
}

// Global function to trigger animations
export function triggerSuccessAnimation(message: string = 'Complete!') {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('global-animation', {
      detail: { type: 'success', message }
    }));
  }
}

export function triggerAchievementAnimation(message: string, level?: number) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('global-animation', {
      detail: { type: 'achievement', message, level }
    }));
  }
}

export function triggerParticleAnimation() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('global-animation', {
      detail: { type: 'particles' }
    }));
  }
}

// Success checkmark content
function SuccessCheckmarkContent({ message }: { message: string }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none">
      <div className="absolute inset-0 bg-black/40 animate-in fade-in duration-300" />
      <div className="relative flex flex-col items-center gap-4 animate-in zoom-in-50 duration-500">
        <div className="relative">
          <div 
            className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-40"
            style={{ transform: 'scale(1.5)' }}
          />
          <div 
            className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-30"
            style={{ animationDelay: '0.2s', transform: 'scale(2)' }}
          />
          <div className="relative bg-gradient-to-br from-green-400 to-emerald-600 rounded-full p-6 shadow-2xl shadow-green-500/50">
            <Check 
              className="h-16 w-16 text-white animate-in zoom-in-0 duration-500" 
              strokeWidth={3} 
              style={{ animationDelay: '0.3s' }}
            />
          </div>
        </div>
        {message && (
          <p className="text-2xl font-bold text-white drop-shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '0.4s' }}>
            {message}
          </p>
        )}
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white rounded-full animate-ping"
              style={{
                top: `${50 + Math.cos((i / 8) * Math.PI * 2) * 40}%`,
                left: `${50 + Math.sin((i / 8) * Math.PI * 2) * 40}%`,
                animationDelay: `${i * 0.1}s`,
                animationDuration: '1s'
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Achievement content
function AchievementContent({ message, level }: { message: string; level?: number }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none">
      <div className="absolute inset-0 bg-black/50 animate-in fade-in duration-300" />
      <div className="relative animate-in zoom-in-75 slide-in-from-bottom-8 duration-700">
        <div 
          className="absolute inset-0 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 rounded-2xl blur-xl opacity-60 animate-pulse"
          style={{ transform: 'scale(1.1)' }}
        />
        <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-4 border-amber-400 rounded-2xl px-12 py-8 shadow-2xl">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-500 px-6 py-1 rounded-full">
            <span className="text-sm font-bold text-black uppercase tracking-wider">Achievement Unlocked!</span>
          </div>
          <div className="flex items-center gap-6 mt-4">
            <div className="text-6xl animate-bounce">🏆</div>
            <div className="flex flex-col">
              <p className="text-2xl font-bold text-white text-center">
                {message}
              </p>
              {level !== undefined && (
                <p className="text-lg text-amber-400 font-semibold text-center mt-1">
                  [Level {level}]
                </p>
              )}
            </div>
            <div className="text-6xl animate-bounce" style={{ animationDelay: '0.2s' }}>🏆</div>
          </div>
        </div>
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-3 h-3 bg-amber-400 rounded-full animate-ping"
              style={{
                top: `${50 + Math.cos((i / 12) * Math.PI * 2) * 60}%`,
                left: `${50 + Math.sin((i / 12) * Math.PI * 2) * 60}%`,
                animationDelay: `${i * 0.15}s`,
                animationDuration: '1.5s'
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Particle content
function ParticleContent() {
  const particles = Array.from({ length: 40 }).map((_, i) => ({
    id: i,
    angle: (i / 40) * Math.PI * 2 + Math.random() * 0.5,
    distance: 150 + Math.random() * 150,
    size: 8 + Math.random() * 12,
    color: ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6'][Math.floor(Math.random() * 6)],
    delay: Math.random() * 0.3,
  }));

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none">
      <div className="absolute inset-0 bg-black/30 animate-in fade-in duration-200" />
      <div className="relative w-[300px] h-[300px]">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white rounded-full animate-ping opacity-50" />
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute top-1/2 left-1/2 rounded-full"
            style={{
              width: particle.size,
              height: particle.size,
              backgroundColor: particle.color,
              animation: `particleBurst 1.5s ease-out ${particle.delay}s forwards`,
              '--tx': `${Math.cos(particle.angle) * particle.distance}px`,
              '--ty': `${Math.sin(particle.angle) * particle.distance}px`,
            } as React.CSSProperties}
          />
        ))}
      </div>
      <style jsx>{`
        @keyframes particleBurst {
          0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(0);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

// Global animation provider - add this to your layout
export default function GlobalAnimationProvider({ children }: { children: React.ReactNode }) {
  const [activeAnimation, setActiveAnimation] = useState<AnimationEvent | null>(null);

  const handleAnimation = useCallback((event: Event) => {
    const customEvent = event as CustomEvent<AnimationEvent>;
    setActiveAnimation(customEvent.detail);
    
    // Auto-hide after duration
    const duration = customEvent.detail.type === 'particles' ? 1500 : 
                     customEvent.detail.type === 'achievement' ? 4000 : 3000;
    
    setTimeout(() => {
      setActiveAnimation(null);
    }, duration);
  }, []);

  useEffect(() => {
    window.addEventListener('global-animation', handleAnimation);
    return () => window.removeEventListener('global-animation', handleAnimation);
  }, [handleAnimation]);

  return (
    <>
      {children}
      {activeAnimation?.type === 'success' && (
        <SuccessCheckmarkContent message={activeAnimation.message || 'Complete!'} />
      )}
      {activeAnimation?.type === 'achievement' && (
        <AchievementContent message={activeAnimation.message || ''} level={activeAnimation.level} />
      )}
      {activeAnimation?.type === 'particles' && (
        <ParticleContent />
      )}
    </>
  );
}

