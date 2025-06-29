import React, { useRef } from 'react';
import { FileValueWithId } from '@/lib/schemas';

interface ImagesCellEditorProps {
  value: FileValueWithId[];
  getFileUrl: (fileId?: number) => string | undefined;
  onUpload: (files: File[]) => void;
  onPreview: (url: string, name: string) => void;
  ariaLabel?: string;
}

const ImagesCellEditor: React.FC<ImagesCellEditorProps> = ({ value, getFileUrl, onUpload, onPreview, ariaLabel }) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="flex flex-wrap gap-1 items-center transition-all duration-200">
      {value.map((img) => {
        const imgUrl = getFileUrl(img.fileId);
        return imgUrl ? (
          <img
            key={img.fileId}
            src={imgUrl}
            alt={img.name}
            className="cell-img cursor-pointer w-10 h-10 object-cover rounded transition-all duration-200"
            onClick={() => onPreview(imgUrl, img.name)}
            tabIndex={0}
            aria-label={ariaLabel || `Preview image ${img.name}`}
          />
        ) : null;
      })}
      <button
        className="text-xs text-blue-600 underline ml-1 transition-colors duration-150"
        onClick={() => fileInputRef.current?.click()}
        type="button"
        aria-label={ariaLabel || 'Upload images'}
      >
        Upload
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
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

export default ImagesCellEditor; 