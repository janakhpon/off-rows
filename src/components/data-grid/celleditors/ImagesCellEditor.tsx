'use client';

import React, { useRef, useState } from 'react';
import { FileValueWithId } from '@/lib/schemas';
import { processImage, shouldConvertToWebP } from '@/lib/imageProcessing';
import { generateUniqueFilename } from '@/lib/filename';
import { saveImageToIDB } from '@/lib/database';
import { useImageSettingsStore } from '@/lib/imageSettingsStore';
import { useNotifications } from '@/app/contexts/NotificationContext';
import { formatFileSize } from '@/lib/utils';

interface ImagesCellEditorProps {
  value: FileValueWithId[];
  getFileUrl: (fileId?: number) => string | undefined;
  onUpload: (files: File[]) => void;
  onPreview: (url: string, name: string) => void;
  ariaLabel?: string;
}

const ImagesCellEditor: React.FC<ImagesCellEditorProps> = ({
  value,
  getFileUrl,
  onUpload,
  onPreview,
  ariaLabel,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Get image settings from global store
  const convertToWebP = useImageSettingsStore((s) => s.convertToWebP);
  const imageQuality = useImageSettingsStore((s) => s.imageQuality);
  const showImageNotifications = useImageSettingsStore((s) => s.showImageNotifications);

  // Get notification context
  const { showNotification } = useNotifications();

  const handleFilesUpload = async (files: File[]) => {
    if (!files.length) return;

    setIsProcessing(true);
    const originalTotalSize = files.reduce((sum, file) => sum + file.size, 0);

    try {
      const processedFiles: File[] = [];
      let processedTotalSize = 0;
      let successCount = 0;
      let failedCount = 0;

      // Process all files in parallel
      const processingPromises = files.map(async (file, index) => {
        try {
          const originalSize = file.size;
          const originalName = file.name;
          const originalFormat = file.name.split('.').pop()?.toUpperCase() || 'UNKNOWN';

          // Read file as Uint8Array
          const arrayBuffer = await file.arrayBuffer();
          const input = new Uint8Array(arrayBuffer);

          // Check if WebP conversion would be beneficial
          const shouldConvert = convertToWebP ? await shouldConvertToWebP(input) : false;
          
          // Process image using WASM with current settings
          const processed = await processImage(input, shouldConvert, imageQuality);

          // Generate unique filename
          const ext = shouldConvert ? 'webp' : 'jpg';
          const filename = generateUniqueFilename(ext);
          const processedFormat = ext.toUpperCase();

          // Save to IDB (will be synced to S3 in background if enabled)
          await saveImageToIDB({ filename, data: processed, synced: false });

          // Create a new File object for the processed image
          const processedFile = new File([processed], filename, {
            type: shouldConvert ? 'image/webp' : 'image/jpeg',
          });

          processedTotalSize += processed.length;
          successCount++;

          // Show individual file notification (if enabled)
          if (showImageNotifications) {
            const compressionRatio = (
              ((originalSize - processed.length) / originalSize) *
              100
            ).toFixed(1);
            const action = shouldConvert ? 'compressed and converted' : 'compressed';

            showNotification({
              type: 'success',
              title: `Image ${index + 1} processed`,
              message: `${originalName} (${formatFileSize(originalSize)} ${originalFormat}) was ${action} into ${filename} (${formatFileSize(processed.length)} ${processedFormat}) - ${compressionRatio}% smaller`,
              duration: 4000,
            });
          }

          return processedFile;
        } catch (error) {
          console.error(`Image processing failed for ${file.name}:`, error);
          failedCount++;

          // Show error notification for failed file (if enabled)
          if (showImageNotifications) {
            showNotification({
              type: 'error',
              title: 'Image processing failed',
              message: `Failed to process ${file.name}. Using original file.`,
              duration: 4000,
            });
          }

          // Fallback to original file if processing fails
          return file;
        }
      });

      const results = await Promise.all(processingPromises);
      processedFiles.push(...results);

      // Show batch summary notification (if enabled)
      if (showImageNotifications) {
        const totalCompressionRatio = (
          ((originalTotalSize - processedTotalSize) / originalTotalSize) *
          100
        ).toFixed(1);
        const action = 'processed';

        showNotification({
          type: 'success',
          title: 'Batch processing complete',
          message: `${successCount} images ${action} (${failedCount} failed). Total: ${formatFileSize(originalTotalSize)} → ${formatFileSize(processedTotalSize)} (${totalCompressionRatio}% smaller)`,
          duration: 6000,
        });
      }

      // Call the original onUpload with all processed files
      onUpload(processedFiles);
    } catch (error) {
      console.error('Batch image processing failed:', error);

      // Show error notification (if enabled)
      if (showImageNotifications) {
        showNotification({
          type: 'error',
          title: 'Batch processing failed',
          message: `Failed to process images. Using original files.`,
          duration: 4000,
        });
      }

      // Fallback to original files if processing fails
      onUpload(files);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-row gap-2 items-center h-full transition-all duration-200">
      {value.map((img) => {
        const imgUrl = getFileUrl(img.fileId);
        return imgUrl ? (
          <img
            key={img.fileId}
            src={imgUrl}
            alt={img.name}
            className="cell-img cursor-pointer w-14 h-14 object-cover transition-all duration-200 border border-gray-200"
            style={{ borderRadius: 6 }}
            onClick={() => onPreview(imgUrl, img.name)}
            tabIndex={0}
            aria-label={ariaLabel || `Preview image ${img.name}`}
          />
        ) : null;
      })}
      <button
        className={`flex items-center justify-center w-8 h-8 rounded-full text-lg font-bold border border-gray-300 transition-colors duration-150 ml-1 ${
          isProcessing
            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
            : 'bg-gray-100 hover:bg-blue-100 text-blue-600'
        }`}
        onClick={() => fileInputRef.current?.click()}
        disabled={isProcessing}
        type="button"
        aria-label={ariaLabel || 'Upload images'}
        tabIndex={0}
      >
        {isProcessing ? '...' : '+'}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => {
          const files = e.target.files ? Array.from(e.target.files) : [];
          if (files.length > 0) handleFilesUpload(files);
        }}
      />
    </div>
  );
};

export default ImagesCellEditor;
