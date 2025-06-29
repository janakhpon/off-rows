import React, { useRef } from 'react';
import { FileValueWithId } from '@/lib/schemas';

interface FileCellEditorProps {
  value: FileValueWithId | null;
  getFileUrl: (fileId?: number) => string | undefined;
  onUpload: (file: File) => void;
  ariaLabel?: string;
}

const FileCellEditor: React.FC<FileCellEditorProps> = ({ value, getFileUrl, onUpload, ariaLabel }) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const fileUrl = value && value.fileId ? getFileUrl(value.fileId) : undefined;

  return (
    <div className="flex items-center justify-center transition-all duration-200">
      {fileUrl && value ? (
        <a
          href={fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="cell-link block truncate max-w-[120px] transition-all duration-200"
          aria-label={ariaLabel || 'Download file'}
        >
          {value.name}
        </a>
      ) : (
        <>
          <button
            className="text-xs text-blue-600 underline transition-colors duration-150"
            onClick={() => fileInputRef.current?.click()}
            type="button"
            aria-label={ariaLabel || 'Upload file'}
          >
            Upload
          </button>
          <input
            ref={fileInputRef}
            type="file"
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

export default FileCellEditor; 