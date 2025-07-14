import { getImageSettingsSnapshot } from './imageSettingsStore';
import { executeS3Sync, retryFailedOperations, SyncResult } from './syncOrchestrator';

export async function syncImagesToS3IfNeeded(): Promise<SyncResult> {
  const { syncImagesToS3 } = getImageSettingsSnapshot();
  console.log('S3 Sync Debug:', {
    syncImagesToS3,
    isOnline: navigator.onLine,
  });
  
  if (!syncImagesToS3 || !navigator.onLine) {
    console.log('S3 Sync skipped:', { syncImagesToS3, isOnline: navigator.onLine });
    return { success: false, stats: { uploaded: 0, deleted: 0, failed: 0, retried: 0 }, error: 'Sync disabled or offline' };
  }
  
  // Execute S3 sync using the orchestrator
  const result = await executeS3Sync();
  
  if (result.success) {
    console.log('S3 Sync completed with stats:', result.stats);
  } else {
    console.error('S3 Sync failed:', result.error);
  }
  
  return result;
}

export async function retryFailedS3Operations(): Promise<SyncResult> {
  console.log('Retrying failed S3 operations...');
  
  const result = await retryFailedOperations();
  
  if (result.success) {
    console.log('Retry completed with stats:', result.stats);
  } else {
    console.error('Retry failed:', result.error);
  }
  
  return result;
}
