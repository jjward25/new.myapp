"use client";

import React, { useState, useCallback, useEffect } from 'react';

interface ParticleExplosionProps {
  children: React.ReactNode;
  onAction?: () => void;
  particleCount?: number;
  colors?: string[];
}

export default function ParticleExplosion({ 
  children, 
  onAction,
  particleCount = 20,
  colors = ['from-yellow-400 to-orange-500', 'from-cyan-400 to-blue-500', 'from-pink-400 to-purple-500']
}: ParticleExplosionProps) {
  const [particles, setParticles] = useState<{ id: number; colorClass: string }[]>([]);
  const [isExploding, setIsExploding] = useState(false);

  const triggerExplosion = useCallback(() => {
    if (isExploding) return;
    
    setIsExploding(true);
    const newParticles = Array.from({ length: particleCount }, (_, i) => ({
      id: Date.now() + i,
      colorClass: colors[i % colors.length]
    }));
    setParticles(newParticles);
    
    // Execute the action
    if (onAction) {
      onAction();
    }
    
    // Clear particles after animation
    setTimeout(() => {
      setParticles([]);
      setIsExploding(false);
    }, 1500);
  }, [isExploding, onAction, particleCount, colors]);

  return (
    <div className="relative inline-block">
      {/* Full-screen particles container */}
      {particles.length > 0 && (
        <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
          {particles.map((particle, i) => (
            <div
              key={particle.id}
              className={`absolute left-1/2 top-1/2 w-4 h-4 bg-gradient-to-br ${particle.colorClass} rounded-full shadow-lg`}
              style={{
                animation: 'particle-explode 1.5s ease-out forwards',
                '--particle-angle': `${(i / particles.length) * 360}deg`,
              } as React.CSSProperties}
            />
          ))}
          <style jsx>{`
            @keyframes particle-explode {
              0% {
                transform: translate(-50%, -50%) rotate(var(--particle-angle)) translateX(0) scale(2);
                opacity: 1;
              }
              100% {
                transform: translate(-50%, -50%) rotate(var(--particle-angle)) translateX(250px) scale(0);
                opacity: 0;
              }
            }
          `}</style>
        </div>
      )}
      
      {/* Clickable children */}
      <div onClick={triggerExplosion} className="cursor-pointer">
        {children}
      </div>
    </div>
  );
}

// Standalone full-screen particle explosion component
export function ParticleExplosionStandalone({ 
  show,
  onComplete
}: { 
  show: boolean;
  onComplete?: () => void;
}) {
  const [particles, setParticles] = useState<{ id: number; angle: number; colorIndex: number; delay: number; size: number }[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  const colors = [
    'from-yellow-400 to-orange-500',
    'from-cyan-400 to-blue-500', 
    'from-pink-400 to-purple-500',
    'from-green-400 to-emerald-500',
    'from-red-400 to-rose-500',
    'from-amber-400 to-yellow-500'
  ];

  useEffect(() => {
    if (show && !isVisible) {
      setIsVisible(true);
      
      // Create varied particles
      const newParticles = Array.from({ length: 40 }, (_, i) => ({
        id: Date.now() + i,
        angle: (i / 40) * 360 + (Math.random() * 20 - 10), // Slight randomness
        colorIndex: i % colors.length,
        delay: Math.random() * 0.2,
        size: 3 + Math.random() * 3
      }));
      setParticles(newParticles);
      
      // Clear after animation
      setTimeout(() => {
        setParticles([]);
        setIsVisible(false);
        if (onComplete) onComplete();
      }, 1500);
    }
  }, [show, isVisible, onComplete, colors.length]);

  if (!isVisible || particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {/* Optional backdrop flash */}
      <div className="absolute inset-0 bg-white/10 animate-in fade-in duration-100" />
      
      {/* Particle burst from center */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className={`absolute left-1/2 top-1/2 bg-gradient-to-br ${colors[particle.colorIndex]} rounded-full shadow-lg`}
          style={{
            width: `${particle.size * 4}px`,
            height: `${particle.size * 4}px`,
            animation: 'particle-burst-full 1.5s ease-out forwards',
            animationDelay: `${particle.delay}s`,
            '--burst-angle': `${particle.angle}deg`,
          } as React.CSSProperties}
        />
      ))}
      
      {/* Center flash */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="w-20 h-20 bg-white rounded-full animate-ping opacity-50" />
      </div>
      
      <style jsx>{`
        @keyframes particle-burst-full {
          0% {
            transform: translate(-50%, -50%) rotate(var(--burst-angle)) translateX(0) scale(2);
            opacity: 1;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) rotate(var(--burst-angle)) translateX(300px) scale(0);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

// Hook for triggering particle explosions
export function useParticleExplosion() {
  const [particles, setParticles] = useState<{ id: number; angle: number; colorIndex: number; size: number }[]>([]);

  const colors = [
    'from-yellow-400 to-orange-500',
    'from-cyan-400 to-blue-500', 
    'from-pink-400 to-purple-500',
    'from-green-400 to-emerald-500',
    'from-red-400 to-rose-500'
  ];

  const explode = useCallback(() => {
    const newParticles = Array.from({ length: 40 }, (_, i) => ({
      id: Date.now() + i,
      angle: (i / 40) * 360 + (Math.random() * 15 - 7.5),
      colorIndex: i % colors.length,
      size: 3 + Math.random() * 3
    }));
    setParticles(newParticles);
    setTimeout(() => setParticles([]), 1500);
  }, [colors.length]);

  const ParticleContainer = () => (
    particles.length > 0 ? (
      <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
        {/* Quick flash */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="w-16 h-16 bg-white rounded-full animate-ping opacity-40" />
        </div>
        
        {particles.map((particle) => (
          <div
            key={particle.id}
            className={`absolute left-1/2 top-1/2 bg-gradient-to-br ${colors[particle.colorIndex]} rounded-full shadow-lg`}
            style={{
              width: `${particle.size * 4}px`,
              height: `${particle.size * 4}px`,
              animation: 'particle-burst 1.5s ease-out forwards',
              '--burst-angle': `${particle.angle}deg`,
            } as React.CSSProperties}
          />
        ))}
        <style jsx>{`
          @keyframes particle-burst {
            0% {
              transform: translate(-50%, -50%) rotate(var(--burst-angle)) translateX(0) scale(2);
              opacity: 1;
            }
            50% {
              opacity: 1;
            }
            100% {
              transform: translate(-50%, -50%) rotate(var(--burst-angle)) translateX(280px) scale(0);
              opacity: 0;
            }
          }
        `}</style>
      </div>
    ) : null
  );

  return { explode, ParticleContainer };
}
