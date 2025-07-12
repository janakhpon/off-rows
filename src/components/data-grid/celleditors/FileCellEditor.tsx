'use client';

import React, { useRef } from 'react';
import { FileValueWithId } from '@/lib/schemas';

interface FileCellEditorProps {
  value: FileValueWithId | null;
  getFileUrl: (fileId?: number) => string | undefined;
  onUpload: (file: File) => void;
  ariaLabel?: string;
}

const FileCellEditor: React.FC<FileCellEditorProps> = ({
  value,
  getFileUrl,
  onUpload,
  ariaLabel,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="flex flex-row gap-2 items-center h-full transition-all duration-200">
      {value && getFileUrl(value.fileId) ? (
        <div className="flex items-center gap-1">
          <a
            href={getFileUrl(value.fileId)!}
            target="_blank"
            rel="noopener noreferrer"
            className="cell-link flex items-center px-3 py-1 rounded-full bg-gray-100 border border-gray-200 text-blue-700 text-xs font-medium max-w-[120px] truncate transition-all duration-200 hover:scale-105 hover:shadow-sm hover:bg-blue-50"
            aria-label={ariaLabel || `Download file ${value.name}`}
            style={{ minWidth: 0 }}
          >
            {value.name}
          </a>
          {/* Small replace button */}
          <button
            className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium border border-gray-300 transition-all duration-150 text-gray-500 hover:text-blue-600 hover:bg-blue-50 hover:scale-110"
            onClick={() => fileInputRef.current?.click()}
            type="button"
            aria-label="Replace file"
            title="Replace file"
          >
            ↻
          </button>
        </div>
      ) : (
        /* Show + button only when no file exists */
        <button
          className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 hover:bg-blue-100 text-blue-600 text-lg font-bold border border-gray-300 transition-all duration-150 hover:scale-105"
          onClick={() => fileInputRef.current?.click()}
          type="button"
          aria-label={ariaLabel || 'Upload file'}
          tabIndex={0}
        >
          +
        </button>
      )}
      <input
        ref={fileInputRef}
        type="file"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUpload(file);
        }}
      />
    </div>
  );
};

export default FileCellEditor;
