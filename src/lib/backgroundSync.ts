import { syncImagesToS3IfNeeded } from './s3Sync';
import { useImageSettingsStore } from './imageSettingsStore';

class BackgroundSyncService {
  private syncInterval: NodeJS.Timeout | null = null;
  private isRunning = false;

  start() {
    if (this.isRunning) return;

    this.isRunning = true;

    // Initial sync check
    this.performSync();

    // Set up periodic sync (every 30 seconds)
    this.syncInterval = setInterval(() => {
      this.performSync();
    }, 30000);

    console.log('Background sync service started');
  }

  stop() {
    if (!this.isRunning) return;

    this.isRunning = false;

    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    console.log('Background sync service stopped');
  }

  private async performSync() {
    try {
      const { syncImagesToS3 } = useImageSettingsStore.getState();

      // Only sync if enabled and online
      if (syncImagesToS3 && navigator.onLine) {
        await syncImagesToS3IfNeeded();
      }
    } catch (error) {
      console.error('Background sync failed:', error);
    }
  }

  // Manual sync trigger (for immediate sync when settings change)
  async triggerSync() {
    await this.performSync();
  }
}

// Export singleton instance
export const backgroundSyncService = new BackgroundSyncService();

// Auto-start service when module loads
if (typeof window !== 'undefined') {
  // Start service when app loads
  backgroundSyncService.start();

  // Listen for online/offline events
  window.addEventListener('online', () => {
    // Trigger immediate sync when coming online
    backgroundSyncService.triggerSync();
  });

  // Listen for storage changes (when settings change)
  window.addEventListener('storage', (e) => {
    if (e.key === 'image-settings') {
      // Trigger sync when settings change
      backgroundSyncService.triggerSync();
    }
  });
}
