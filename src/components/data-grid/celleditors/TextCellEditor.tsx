'use client';

import React, { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface TextCellEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  isEditing?: boolean;
  onEditStart?: () => void;
  onEditEnd?: () => void;
}

const TextCellEditor: React.FC<TextCellEditorProps> = ({
  value,
  onChange,
  placeholder = 'Type...',
  ariaLabel,
  isEditing = false,
  onEditStart,
  onEditEnd,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Auto-focus on mount when editing
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleClick = () => {
    if (!isEditing && onEditStart) {
      onEditStart();
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (onEditEnd) {
      onEditEnd();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      (e.currentTarget as HTMLInputElement).blur();
    }
    if (e.key === 'Escape') {
      (e.currentTarget as HTMLInputElement).blur();
    }
  };

  // Show input when editing or focused
  if (isEditing || isFocused) {
    return (
      <input
        ref={inputRef}
        type="text"
        className={cn(
          'px-2 py-1 w-full h-full text-sm bg-transparent rounded border-none outline-none',
          'dark:bg-gray-800 dark:text-gray-100',
        )}
        value={value || ''}
        placeholder={placeholder}
        aria-label={ariaLabel || 'Edit text'}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
      />
    );
  }

  // Show plain text when not editing
  return (
    <div
      className={cn(
        'px-2 py-1 w-full h-full text-sm cursor-text select-none',
        'hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors',
        !value && 'text-gray-400 italic',
      )}
      onClick={handleClick}
      title={value || placeholder}
    >
      {value || placeholder}
    </div>
  );
};

export default TextCellEditor;
