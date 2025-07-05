'use client';

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

  return (
    <div className="flex flex-row gap-2 items-center h-full transition-all duration-200">
      {value && getFileUrl(value.fileId) ? (
        <img
          src={getFileUrl(value.fileId)!}
          alt={value.name}
          className="cell-img cursor-pointer w-14 h-14 object-cover transition-all duration-200 border border-gray-200"
          style={{ borderRadius: 6 }}
          onClick={() => onPreview(getFileUrl(value.fileId)!, value.name)}
          tabIndex={0}
          aria-label={ariaLabel || `Preview image ${value.name}`}
        />
      ) : null}
      <button
        className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 hover:bg-blue-100 text-blue-600 text-lg font-bold border border-gray-300 transition-colors duration-150 ml-1"
        onClick={() => fileInputRef.current?.click()}
        type="button"
        aria-label={ariaLabel || (value ? 'Replace image' : 'Upload image')}
        tabIndex={0}
      >
        +
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
    </div>
  );
};

export default ImageCellEditor; 