import { useEffect, useState } from 'react';
import { backgroundSyncService } from './backgroundSync';
import { useImageSettingsStore } from './imageSettingsStore';
import { getUnsyncedImages } from './database';
import { tableSyncService } from './tableSyncService';
import { useCloudSyncStore } from './cloudSyncStore';

export function useBackgroundSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncedCount, setSyncedCount] = useState(0);

  const syncImagesToS3 = useImageSettingsStore((s) => s.syncImagesToS3);
  const { autoSyncTables } = useCloudSyncStore();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Update sync counts
  useEffect(() => {
    const updateCounts = async () => {
      try {
        const unsynced = await getUnsyncedImages();
        setPendingCount(unsynced.length);

        // TODO: Add a function to get synced count from database
        // For now, we'll just show 0 for synced count
        setSyncedCount(0);
      } catch (error) {
        console.error('Failed to update sync counts:', error);
      }
    };

    updateCounts();

    // Update counts every 10 seconds
    const interval = setInterval(updateCounts, 10000);

    return () => clearInterval(interval);
  }, []);

  // Start/stop background sync based on settings
  useEffect(() => {
    if (syncImagesToS3 && isOnline) {
      backgroundSyncService.start();
    } else {
      backgroundSyncService.stop();
    }
  }, [syncImagesToS3, isOnline]);

  // Trigger table sync when online status changes and auto sync is enabled
  useEffect(() => {
    if (isOnline && autoSyncTables) {
      // Small delay to ensure backend availability check has completed
      const timeoutId = setTimeout(() => {
        tableSyncService.triggerSync(isOnline).catch(error => {
          console.error('Failed to trigger table sync:', error);
        });
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
    return undefined;
  }, [isOnline, autoSyncTables]);

  return {
    isOnline,
    pendingCount,
    syncedCount,
    canSync: syncImagesToS3 && isOnline,
  };
}
