'use client';

import { useEffect } from 'react';
import { precacheAll, forcePrecacheRoutes, isServiceWorkerRegistered, registerServiceWorker, OFFLINE_ROUTES } from '@/lib/offline';

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const initializeServiceWorker = async () => {
        try {
          // Immediately force precache all routes when the app loads
          console.log('Force precaching routes on app load...');
          await forcePrecacheRoutes(OFFLINE_ROUTES);
          
          // Check if service worker is already registered
          const isRegistered = await isServiceWorkerRegistered();
          
          if (!isRegistered) {
            // Register service worker
            const registration = await registerServiceWorker();
            if (registration) {
              console.log('Service Worker registered successfully:', registration);
              
              // Also use regular precaching as backup
              await precacheAll();
            }
          } else {
            console.log('Service Worker already registered');
            // Use regular precaching as backup
            await precacheAll();
          }
          
          // Check for updates
          const registration = await navigator.serviceWorker.getRegistration();
          if (registration) {
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    // New content is available
                    console.log('New content is available; please refresh.');
                    
                    // Show a notification to the user
                    if ('Notification' in window && Notification.permission === 'granted') {
                      new Notification('Offrows Update', {
                        body: 'A new version is available. Please refresh the page.',
                        icon: '/android-chrome-192x192.png',
                        badge: '/favicon-32x32.png',
                      });
                    }
                  }
                });
              }
            });
          }
        } catch (error) {
          console.error('Service Worker initialization failed:', error);
        }
      };

      initializeServiceWorker();

      // Handle service worker updates
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });

      // Request notification permission for update notifications
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, []);

  return null; // This component doesn't render anything
} 