'use client';

import { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowIndicator(false);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setShowIndicator(true);
    };

    // Set initial state
    const initialOnline = navigator.onLine;
    setIsOnline(initialOnline);
    if (!initialOnline) {
      setShowIndicator(true);
    }

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) {
    return null;
  }

  return (
    <div 
      className={cn(
        'fixed top-4 right-4 z-50 bg-red-100/95 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg shadow-lg backdrop-blur-md transition-all duration-300 ease-in-out',
        'flex items-center space-x-3 max-w-sm',
        showIndicator ? 'animate-slide-in-right opacity-100' : 'opacity-0 translate-x-full',
      )}
    >
      <WifiOff className="h-4 w-4 animate-pulse flex-shrink-0" />
      <span className="text-sm font-medium leading-relaxed">
        You are currently offline. Changes will be saved locally and synced when you&apos;re back
        online.
      </span>
    </div>
  );
}
