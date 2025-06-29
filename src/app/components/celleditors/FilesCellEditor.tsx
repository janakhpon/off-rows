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
    <div className="flex flex-wrap gap-1 items-center transition-all duration-200">
      {value.map((file) => {
        const fileUrl = getFileUrl(file.fileId);
        return fileUrl ? (
          <a
            key={file.fileId}
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="cell-link block truncate max-w-[100px] transition-all duration-200"
            aria-label={ariaLabel || `Download file ${file.name}`}
          >
            {file.name}
          </a>
        ) : null;
      })}
      <button
        className="ml-1 text-xs text-blue-600 underline transition-colors duration-150"
        onClick={() => fileInputRef.current?.click()}
        type="button"
        aria-label={ariaLabel || 'Upload files'}
      >
        Upload
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