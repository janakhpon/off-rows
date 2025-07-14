import { syncImagesToS3IfNeeded, retryFailedS3Operations } from './s3Sync';
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
      console.log('Background sync check:', { syncImagesToS3, isOnline: navigator.onLine });

      // Only sync if enabled and online
      if (syncImagesToS3 && navigator.onLine) {
        console.log('Starting S3 sync...');
        const result = await syncImagesToS3IfNeeded();
        
        if (result.success) {
          console.log('S3 sync completed with stats:', result.stats);
          
          // Log summary if there were operations
          if (result.stats.uploaded > 0 || result.stats.deleted > 0) {
            console.log(`Sync Summary: ${result.stats.uploaded} uploaded, ${result.stats.deleted} deleted, ${result.stats.failed} failed`);
          }
        } else {
          console.error('S3 sync failed:', result.error);
        }
      } else {
        console.log('S3 sync skipped - conditions not met');
      }
    } catch (error) {
      console.error('Background sync failed:', error);
    }
  }

  // Manual sync trigger (for immediate sync when settings change)
  async triggerSync() {
    await this.performSync();
  }

  // Manual retry trigger for failed operations
  async triggerRetry() {
    try {
      console.log('Triggering retry of failed operations...');
      const result = await retryFailedS3Operations();
      
      if (result.success) {
        console.log('Retry completed with stats:', result.stats);
      } else {
        console.error('Retry failed:', result.error);
      }
    } catch (error) {
      console.error('Retry trigger failed:', error);
    }
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
