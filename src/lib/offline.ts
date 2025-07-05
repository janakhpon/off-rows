// Offline utilities for Offrows

// Routes that should be precached for offline access
export const OFFLINE_ROUTES = [
  '/',
  '/about',
  '/offline',
];

// Static assets that should be precached
export const OFFLINE_ASSETS = [
  '/manifest.json',
  '/favicon.ico',
  '/favicon-16x16.png',
  '/favicon-32x32.png',
  '/apple-touch-icon.png',
  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png',
  '/offrows.png',
  '/offrows_transparent.png',
  '/preview.png',
  '/file.svg',
  '/globe.svg',
  '/window.svg',
  '/next.svg',
];

// Check if the app is currently offline
export function isOffline(): boolean {
  if (typeof window === 'undefined') return false;
  return !navigator.onLine;
}

// Check if the app is currently online
export function isOnline(): boolean {
  if (typeof window === 'undefined') return true;
  return navigator.onLine;
}

// Register offline/online event listeners
export function registerOnlineStatusListener(
  onOnline: () => void,
  onOffline: () => void
): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleOnline = () => onOnline();
  const handleOffline = () => onOffline();

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

// Precache a specific route using the generated service worker
export async function precacheRoute(route: string): Promise<void> {
  if (typeof window === 'undefined' || !('caches' in window)) return;

  try {
    // Try multiple cache strategies
    const cacheNames = await caches.keys();
    
    // Look for next-pwa generated caches
    const pagesCache = cacheNames.find(name => name.includes('pages') || name.includes('next-pwa'));
    const staticCache = cacheNames.find(name => name.includes('static') || name.includes('assets'));
    
    if (pagesCache) {
      const cache = await caches.open(pagesCache);
      await cache.add(route);
      console.log(`Precached route in pages cache: ${route}`);
    }
    
    // Also try to cache in static cache for better offline support
    if (staticCache && !route.startsWith('/_next/')) {
      const cache = await caches.open(staticCache);
      await cache.add(route);
      console.log(`Precached route in static cache: ${route}`);
    }
    
    // If no specific cache found, try the default cache
    if (!pagesCache && !staticCache && cacheNames.length > 0) {
      const defaultCache = await caches.open(cacheNames[0]);
      await defaultCache.add(route);
      console.log(`Precached route in default cache: ${route}`);
    }
    
    if (!pagesCache && !staticCache && cacheNames.length === 0) {
      console.warn('No caches found for route precaching');
    }
  } catch (error) {
    console.error(`Failed to precache route ${route}:`, error);
  }
}

// Precache multiple routes
export async function precacheRoutes(routes: string[]): Promise<void> {
  await Promise.all(routes.map(route => precacheRoute(route)));
}

// Precache all offline routes and assets
export async function precacheAll(): Promise<void> {
  console.log('Starting route precaching...');
  
  try {
    // Precache routes
    await precacheRoutes(OFFLINE_ROUTES);
    
    // Precache static assets
    await precacheRoutes(OFFLINE_ASSETS);
    
    console.log('Route precaching completed successfully');
  } catch (error) {
    console.error('Route precaching failed:', error);
  }
}

// Check if a route is cached
export async function isRouteCached(route: string): Promise<boolean> {
  if (typeof window === 'undefined' || !('caches' in window)) return false;

  try {
    const cacheNames = await caches.keys();
    
    // Check our custom cache first
    const offrowsCache = cacheNames.find(name => name === 'offrows-routes-cache');
    if (offrowsCache) {
      const cache = await caches.open(offrowsCache);
      const response = await cache.match(route);
      if (response) {
        return true;
      }
    }
    
    // Check next-pwa generated caches
    const pagesCache = cacheNames.find(name => name.includes('pages') || name.includes('next-pwa'));
    if (pagesCache) {
      const cache = await caches.open(pagesCache);
      const response = await cache.match(route);
      if (response) {
        return true;
      }
    }
    
    // Check static cache
    const staticCache = cacheNames.find(name => name.includes('static') || name.includes('assets'));
    if (staticCache) {
      const cache = await caches.open(staticCache);
      const response = await cache.match(route);
      if (response) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error(`Failed to check if route ${route} is cached:`, error);
    return false;
  }
}

// Get cached response for a route
export async function getCachedRoute(route: string): Promise<Response | null> {
  if (typeof window === 'undefined' || !('caches' in window)) return null;

  try {
    const cacheNames = await caches.keys();
    
    // Check our custom cache first
    const offrowsCache = cacheNames.find(name => name === 'offrows-routes-cache');
    if (offrowsCache) {
      const cache = await caches.open(offrowsCache);
      const response = await cache.match(route);
      if (response) {
        return response;
      }
    }
    
    // Check next-pwa generated caches
    const pagesCache = cacheNames.find(name => name.includes('pages') || name.includes('next-pwa'));
    if (pagesCache) {
      const cache = await caches.open(pagesCache);
      const response = await cache.match(route);
      if (response) {
        return response;
      }
    }
    
    // Check static cache
    const staticCache = cacheNames.find(name => name.includes('static') || name.includes('assets'));
    if (staticCache) {
      const cache = await caches.open(staticCache);
      const response = await cache.match(route);
      if (response) {
        return response;
      }
    }
    
    return null;
  } catch (error) {
    console.error(`Failed to get cached route ${route}:`, error);
    return null;
  }
}

// Clear all caches
export async function clearAllCaches(): Promise<void> {
  if (typeof window === 'undefined' || !('caches' in window)) return;

  try {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => caches.delete(cacheName))
    );
    console.log('All caches cleared');
  } catch (error) {
    console.error('Failed to clear caches:', error);
  }
}

// Get cache storage usage
export async function getCacheUsage(): Promise<{ name: string; size: number }[]> {
  if (typeof window === 'undefined' || !('caches' in window)) return [];

  try {
    const cacheNames = await caches.keys();
    const usage = await Promise.all(
      cacheNames.map(async (name) => {
        const cache = await caches.open(name);
        const keys = await cache.keys();
        return { name, size: keys.length };
      })
    );
    return usage;
  } catch (error) {
    console.error('Failed to get cache usage:', error);
    return [];
  }
}

// Check if service worker is registered
export async function isServiceWorkerRegistered(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return false;

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    return !!registration;
  } catch (error) {
    console.error('Failed to check service worker registration:', error);
    return false;
  }
}

// Register service worker (uses the generated one from next-pwa)
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null;

  try {
    // next-pwa generates the service worker file automatically
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('Service Worker registered successfully:', registration);
    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
}

// Unregister service worker
export async function unregisterServiceWorker(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return false;

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      await registration.unregister();
      console.log('Service Worker unregistered successfully');
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to unregister service worker:', error);
    return false;
  }
}

// Force update the service worker
export async function forceUpdateServiceWorker(): Promise<void> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      await registration.update();
      console.log('Service Worker update triggered');
    }
  } catch (error) {
    console.error('Failed to force update service worker:', error);
  }
}

// Check if the app is installable (PWA criteria)
export function isInstallable(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check if the app meets PWA criteria
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

// Request notification permission
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error('Failed to request notification permission:', error);
    return 'denied';
  }
}

// Force precache routes using fetch and cache API directly
export async function forcePrecacheRoute(route: string): Promise<void> {
  if (typeof window === 'undefined' || !('caches' in window)) return;

  try {
    // Create a custom cache for our routes
    const cacheName = 'offrows-routes-cache';
    const cache = await caches.open(cacheName);
    
    // Fetch the route and cache it
    const response = await fetch(route, {
      method: 'GET',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Cache-Control': 'no-cache',
      },
    });
    
    if (response.ok) {
      await cache.put(route, response.clone());
      console.log(`Force precached route: ${route}`);
    } else {
      console.warn(`Failed to fetch route for precaching: ${route} (${response.status})`);
    }
  } catch (error) {
    console.error(`Failed to force precache route ${route}:`, error);
  }
}

// Force precache multiple routes
export async function forcePrecacheRoutes(routes: string[]): Promise<void> {
  await Promise.all(routes.map(route => forcePrecacheRoute(route)));
} 