'use client';

import React, { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface NumberCellEditorProps {
  value: number | '';
  onChange: (value: number | null) => void;
  ariaLabel?: string;
  isEditing?: boolean;
  onEditStart?: () => void;
  onEditEnd?: () => void;
}

const NumberCellEditor: React.FC<NumberCellEditorProps> = ({ 
  value, 
  onChange, 
  ariaLabel,
  isEditing = false,
  onEditStart,
  onEditEnd
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
        type="number"
        className={cn(
          "px-2 py-1 w-full h-full text-sm text-right bg-transparent rounded border-none outline-none",
          "dark:bg-gray-800 dark:text-gray-200"
        )}
        value={value || ''}
        aria-label={ariaLabel || 'Edit number'}
        onChange={e => {
          const val = e.target.value;
          onChange(val === '' ? null : Number(val));
        }}
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
        "px-2 py-1 w-full h-full text-sm text-right cursor-text select-none",
        "hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors",
        !value && "text-gray-400 italic"
      )}
      onClick={handleClick}
      title={value ? String(value) : 'Click to edit'}
    >
      {value || 'Click to edit'}
    </div>
  );
};

export default NumberCellEditor;
export type { NumberCellEditorProps }; 