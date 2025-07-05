'use client';

import React, { useRef } from 'react';
import { FileValueWithId } from '@/lib/schemas';

interface FilesCellEditorProps {
  value: FileValueWithId[];
  getFileUrl: (fileId?: number) => string | undefined;
  onUpload: (files: File[]) => void;
  ariaLabel?: string;
}

const FilesCellEditor: React.FC<FilesCellEditorProps> = ({ value, getFileUrl, onUpload, ariaLabel }) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="flex flex-row gap-2 items-center h-full transition-all duration-200">
      {value.map((file) => {
        const fileUrl = getFileUrl(file.fileId);
        return fileUrl ? (
          <a
            key={file.fileId}
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="cell-link flex items-center px-3 py-1 rounded-full bg-gray-100 border border-gray-200 text-blue-700 text-xs font-medium max-w-[120px] truncate transition-all duration-200"
            aria-label={ariaLabel || `Download file ${file.name}`}
            style={{ minWidth: 0 }}
          >
            {file.name}
          </a>
        ) : null;
      })}
      <button
        className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 hover:bg-blue-100 text-blue-600 text-lg font-bold border border-gray-300 transition-colors duration-150 ml-1"
        onClick={() => fileInputRef.current?.click()}
        type="button"
        aria-label={ariaLabel || 'Upload files'}
        tabIndex={0}
      >
        +
      </button>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        style={{ display: 'none' }}
        onChange={e => {
          const files = e.target.files ? Array.from(e.target.files) : [];
          if (files.length > 0) onUpload(files);
        }}
      />
    </div>
  );
};

export default FilesCellEditor; 