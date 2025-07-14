import { 
  saveImageToIDB,
  updateImageInIDB,
  deleteImageFromIDB,
  createUploadOperation,
  createUpdateOperation,
  createDeleteOperation,
  markImageAsSynced,
  markImageSyncFailed,
  markImageAsSyncing,
  markOperationAsCompleted,
  markOperationAsFailed,
  markOperationAsProcessing,
  markDeletionAsSynced,
  incrementRetryCount,
  getUnsyncedImages,
  getUnsyncedDeletions,
  getFailedOperations,
  getImageById,
  saveFileToIDB,
  updateFileInIDB,
  deleteFileFromIDB,
  fileOperations
} from './database';
import { ApiService } from './api';

// Type for file records returned from IndexedDB
export interface SyncedFileRecord {
  id: number;
  name: string;
  type: string;
  blob: Blob;
  s3Key?: string;
  synced: boolean;
  syncStatus: string;
  lastSyncAttempt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SyncStats {
  uploaded: number;
  deleted: number;
  failed: number;
  retried: number;
}

export interface SyncResult {
  success: boolean;
  stats: SyncStats;
  error?: string;
}

// === HIGH-LEVEL SYNC OPERATIONS ===

/**
 * Complete image lifecycle with sync tracking
 */
export async function saveImageWithSync(filename: string, data: Uint8Array): Promise<number> {
  // 1. Save image to IDB
  const imageId = await saveImageToIDB({ filename, data });
  
  // 2. Create upload operation for tracking
  await createUploadOperation(imageId);
  
  return imageId;
}

/**
 * Update image with sync tracking
 */
export async function updateImageWithSync(id: number, filename: string, data: Uint8Array): Promise<void> {
  // 1. Update image in IDB
  await updateImageInIDB({ id, filename, data });
  
  // 2. Create update operation for tracking
  await createUpdateOperation(id);
}

/**
 * Delete image with sync tracking
 */
export async function deleteImageWithSync(id: number): Promise<void> {
  // 1. Get image details before deletion
  const image = await getImageById(id);
  if (!image) return;
  
  // 2. Create delete operation with image details
  await createDeleteOperation(id, image.filename, image.s3Key);
  
  // 3. Delete from images table
  await deleteImageFromIDB(id);
}

// === HIGH-LEVEL SYNC OPERATIONS FOR FILES ===
export async function saveFileWithSync(filename: string, data: Uint8Array): Promise<number> {
  // 1. Save file to IDB
  const fileId = await saveFileToIDB({ filename, data });
  // 2. Create upload operation for tracking
  await createUploadOperation(fileId);
  return fileId;
}

export async function updateFileWithSync(id: number, filename: string, data: Uint8Array): Promise<void> {
  await updateFileInIDB({ id, filename, data });
  await createUpdateOperation(id);
}

export async function deleteFileWithSync(id: number): Promise<void> {
  // 1. Get file details before deletion
  const file = await fileOperations.getFileById(id);
  if (!file) return;
  // 2. Create delete operation with file details
  await createDeleteOperation(id, file.name, file.s3Key);
  // 3. Delete from files table
  await deleteFileFromIDB(id);
}

// === SYNC EXECUTION ===

/**
 * Execute S3 sync for all pending operations
 */
export async function executeS3Sync(): Promise<SyncResult> {
  const stats: SyncStats = { uploaded: 0, deleted: 0, failed: 0, retried: 0 };
  
  try {
    // Check S3 configuration
    const s3Status = await ApiService.getS3Status();
    if (!s3Status.configured) {
      return { success: false, stats, error: 'S3 not configured' };
    }
    
    // Sync uploads/updates for images and files
    await syncPendingUploads(stats);
    
    // Sync deletions for images and files
    await syncPendingDeletions(stats);
    
    return { success: true, stats };
  } catch (error) {
    console.error('S3 sync execution failed:', error);
    return { 
      success: false, 
      stats, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Retry failed operations
 */
export async function retryFailedOperations(): Promise<SyncResult> {
  const stats: SyncStats = { uploaded: 0, deleted: 0, failed: 0, retried: 0 };
  
  try {
    const failedOps = await getFailedOperations();
    
    for (const op of failedOps) {
      try {
        await markOperationAsProcessing(op.id!);
        
        if (op.operation === 'upload') {
          const image = await getImageById(op.fileId);
          if (image) {
            await ApiService.uploadImageToS3(image.filename, image.data);
            await markImageAsSynced(op.fileId);
            await markOperationAsCompleted(op.id!);
            stats.uploaded++;
          }
        } else if (op.operation === 'delete') {
          // Handle delete retry
          await markOperationAsCompleted(op.id!);
          stats.deleted++;
        }
        
        stats.retried++;
      } catch (error) {
        console.error('Retry failed for operation:', op.id, error);
        await markOperationAsFailed(op.id!);
        await incrementRetryCount(op.id!);
        stats.failed++;
      }
    }
    
    return { success: true, stats };
  } catch (error) {
    console.error('Retry operations failed:', error);
    return { 
      success: false, 
      stats, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// === PRIVATE SYNC FUNCTIONS ===

async function syncPendingUploads(stats: SyncStats): Promise<void> {
  // Images
  const unsyncedImages = await getUnsyncedImages();
  for (const img of unsyncedImages) {
    try {
      await markImageAsSyncing(img.id!);
      await ApiService.uploadImageToS3(img.filename, img.data);
      await markImageAsSynced(img.id!);
      await markOperationAsCompleted(img.id!);
      stats.uploaded++;
    } catch {
      await markImageSyncFailed(img.id!);
      await markOperationAsFailed(img.id!);
      stats.failed++;
    }
  }
  // Files
  const unsyncedFiles = await fileOperations.getUnsyncedFiles() as SyncedFileRecord[];
  for (const file of unsyncedFiles) {
    try {
      const arrayBuffer = await file.blob.arrayBuffer();
      const data = new Uint8Array(arrayBuffer);
      await ApiService.uploadImageToS3(file.name, data);
      await fileOperations.markFileAsSynced(file.id);
      await markOperationAsCompleted(file.id);
      stats.uploaded++;
    } catch {
      await fileOperations.markFileAsFailed(file.id);
      await markOperationAsFailed(file.id);
      stats.failed++;
    }
  }
}

async function syncPendingDeletions(stats: SyncStats): Promise<void> {
  const unsyncedDeletions = await getUnsyncedDeletions();
  for (const deletion of unsyncedDeletions) {
    try {
      const s3Key = deletion.s3Key || deletion.filename;
      await ApiService.deleteImageFromS3(s3Key);
      await markDeletionAsSynced(deletion.id!);
      await markOperationAsCompleted(deletion.id!);
      stats.deleted++;
    } catch {
      stats.failed++;
    }
  }
} 