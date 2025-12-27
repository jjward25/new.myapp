"use client";

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Check } from 'lucide-react';

interface SuccessCheckmarkProps {
  show: boolean;
  onComplete?: () => void;
  duration?: number;
  message?: string;
}

export default function SuccessCheckmark({ 
  show, 
  onComplete, 
  duration = 3000,
  message = 'Complete!'
}: SuccessCheckmarkProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        if (onComplete) onComplete();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, onComplete]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none">
      {/* Semi-transparent backdrop */}
      <div className="absolute inset-0 bg-black/40 animate-in fade-in duration-300" />
      
      {/* Centered content */}
      <div className="relative flex flex-col items-center gap-4 animate-in zoom-in-50 duration-500">
        {/* Outer ring animation */}
        <div className="relative">
          {/* Expanding ring 1 */}
          <div 
            className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-40"
            style={{ transform: 'scale(1.5)' }}
          />
          {/* Expanding ring 2 */}
          <div 
            className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-30"
            style={{ animationDelay: '0.2s', transform: 'scale(2)' }}
          />
          {/* Main circle */}
          <div className="relative bg-gradient-to-br from-green-400 to-emerald-600 rounded-full p-6 shadow-2xl shadow-green-500/50">
            <Check 
              className="h-16 w-16 text-white animate-in zoom-in-0 duration-500" 
              strokeWidth={3} 
              style={{ animationDelay: '0.3s' }}
            />
          </div>
        </div>
        
        {/* Success message */}
        {message && (
          <p className="text-2xl font-bold text-white drop-shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '0.4s' }}>
            {message}
          </p>
        )}
        
        {/* Sparkle effects */}
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

// Animation content component
function SuccessCheckmarkContent({ message }: { message: string }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none">
      {/* Semi-transparent backdrop */}
      <div className="absolute inset-0 bg-black/40 animate-in fade-in duration-300" />
      
      {/* Centered content */}
      <div className="relative flex flex-col items-center gap-4 animate-in zoom-in-50 duration-500">
        {/* Outer ring animation */}
        <div className="relative">
          {/* Expanding ring 1 */}
          <div 
            className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-40"
            style={{ transform: 'scale(1.5)' }}
          />
          {/* Expanding ring 2 */}
          <div 
            className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-30"
            style={{ animationDelay: '0.2s', transform: 'scale(2)' }}
          />
          {/* Main circle */}
          <div className="relative bg-gradient-to-br from-green-400 to-emerald-600 rounded-full p-6 shadow-2xl shadow-green-500/50">
            <Check 
              className="h-16 w-16 text-white animate-in zoom-in-0 duration-500" 
              strokeWidth={3} 
              style={{ animationDelay: '0.3s' }}
            />
          </div>
        </div>
        
        {/* Success message */}
        {message && (
          <p className="text-2xl font-bold text-white drop-shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '0.4s' }}>
            {message}
          </p>
        )}
        
        {/* Sparkle effects */}
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

// Standalone version that uses portal to survive parent unmounts
export function SuccessCheckmarkStandalone({ 
  show, 
  message = 'Complete!',
  onClose 
}: { 
  show: boolean; 
  message?: string;
  onClose?: () => void;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);
  const displayMessage = useRef(message);
  const hasTriggered = useRef(false);

  // Setup portal container
  useEffect(() => {
    setPortalContainer(document.body);
  }, []);

  useEffect(() => {
    // Only trigger once when show becomes true
    if (show && !hasTriggered.current) {
      hasTriggered.current = true;
      displayMessage.current = message;
      setIsVisible(true);
      
      // Set timer to hide after 3 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
        hasTriggered.current = false;
        if (onClose) onClose();
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [show, message, onClose]);

  // Reset trigger flag when show goes back to false
  useEffect(() => {
    if (!show) {
      hasTriggered.current = false;
    }
  }, [show]);

  if (!isVisible || !portalContainer) return null;

  // Use createPortal to render to document.body, surviving component unmounts
  return createPortal(
    <SuccessCheckmarkContent message={displayMessage.current} />,
    portalContainer
  );
}
