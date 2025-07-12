'use client';

import React, { useRef, useState } from 'react';
import { FileValueWithId } from '@/lib/schemas';
import { processImage } from '@/lib/imageProcessing';
import { generateUniqueFilename } from '@/lib/filename';
import { saveImageToIDB } from '@/lib/database';
import { useImageSettingsStore } from '@/lib/imageSettingsStore';
import { useNotifications } from '@/app/contexts/NotificationContext';
import { formatFileSize } from '@/lib/utils';

interface ImageCellEditorProps {
  value: FileValueWithId | null;
  getFileUrl: (fileId?: number) => string | undefined;
  onUpload: (file: File) => void;
  onPreview: (url: string, name: string) => void;
  ariaLabel?: string;
}

const ImageCellEditor: React.FC<ImageCellEditorProps> = ({
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

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    setIsProcessing(true);
    const originalSize = file.size;
    const originalName = file.name;
    const originalFormat = file.name.split('.').pop()?.toUpperCase() || 'UNKNOWN';

    try {
      // Read file as Uint8Array
      const arrayBuffer = await file.arrayBuffer();
      const input = new Uint8Array(arrayBuffer);

      // Process image using WASM with current settings
      const processed = await processImage(input, convertToWebP, imageQuality);

      // Generate unique filename
      const ext = convertToWebP ? 'webp' : 'jpg';
      const filename = generateUniqueFilename(ext);
      const processedFormat = ext.toUpperCase();

      // Save to IDB (will be synced to S3 in background if enabled)
      await saveImageToIDB({ filename, data: processed, synced: false });

      // Create a new File object for the processed image
      const processedFile = new File([processed], filename, {
        type: convertToWebP ? 'image/webp' : 'image/jpeg',
      });

      // Show success notification with processing details (if enabled)
      if (showImageNotifications) {
        const compressionRatio = (((originalSize - processed.length) / originalSize) * 100).toFixed(
          1,
        );
        const action = convertToWebP ? 'compressed and converted' : 'compressed';

        showNotification({
          type: 'success',
          title: 'Image processed successfully',
          message: `${originalName} (${formatFileSize(originalSize)} ${originalFormat}) was ${action} into ${filename} (${formatFileSize(processed.length)} ${processedFormat}) - ${compressionRatio}% smaller`,
          duration: 5000,
        });
      }

      // Call the original onUpload with the processed file
      onUpload(processedFile);
    } catch (error) {
      console.error('Image processing failed:', error);

      // Show error notification (if enabled)
      if (showImageNotifications) {
        showNotification({
          type: 'error',
          title: 'Image processing failed',
          message: `Failed to process ${originalName}. Using original file.`,
          duration: 4000,
        });
      }

      // Fallback to original file if processing fails
      onUpload(file);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-row gap-2 items-center h-full transition-all duration-200">
      {value && getFileUrl(value.fileId) ? (
        <img
          src={getFileUrl(value.fileId)!}
          alt={value.name}
          className="object-cover w-14 h-14 border border-gray-200 transition-all duration-200 cursor-pointer cell-img"
          style={{ borderRadius: 6 }}
          onClick={() => onPreview(getFileUrl(value.fileId)!, value.name)}
          tabIndex={0}
          aria-label={ariaLabel || `Preview image ${value.name}`}
        />
      ) : null}
      <button
        className={`flex items-center justify-center w-8 h-8 rounded-full text-lg font-bold border border-gray-300 transition-colors duration-150 ml-1 ${
          isProcessing
            ? 'text-gray-500 bg-gray-200 cursor-not-allowed'
            : 'text-blue-600 bg-gray-100 hover:bg-blue-100'
        }`}
        onClick={() => fileInputRef.current?.click()}
        disabled={isProcessing}
        type="button"
        aria-label={ariaLabel || (value ? 'Replace image' : 'Upload image')}
        tabIndex={0}
      >
        {isProcessing ? '...' : '+'}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileUpload(file);
        }}
      />
    </div>
  );
};

export default ImageCellEditor;
