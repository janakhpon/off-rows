import React, { useRef } from 'react';
import { FileValueWithId } from '@/lib/schemas';

interface ImageCellEditorProps {
  value: FileValueWithId | null;
  getFileUrl: (fileId?: number) => string | undefined;
  onUpload: (file: File) => void;
  onPreview: (url: string, name: string) => void;
  ariaLabel?: string;
}

const ImageCellEditor: React.FC<ImageCellEditorProps> = ({ value, getFileUrl, onUpload, onPreview, ariaLabel }) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imgUrl = value && value.fileId ? getFileUrl(value.fileId) : undefined;

  return (
    <div className="flex items-center justify-center transition-all duration-200">
      {imgUrl ? (
        <img
          src={imgUrl}
          alt={value?.name || 'Image'}
          className="cell-img cursor-pointer transition-all duration-200"
          onClick={() => onPreview(imgUrl, value?.name || 'Image')}
          tabIndex={0}
          aria-label={ariaLabel || 'Preview image'}
        />
      ) : (
        <>
          <button
            className="text-xs text-blue-600 underline transition-colors duration-150"
            onClick={() => fileInputRef.current?.click()}
            type="button"
            aria-label={ariaLabel || 'Upload image'}
          >
            Upload
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) onUpload(file);
            }}
          />
        </>
      )}
    </div>
  );
};

export default ImageCellEditor; 