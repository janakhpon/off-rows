'use client';

import React, { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface DateCellEditorProps {
  value: string;
  onChange: (value: string) => void;
  ariaLabel?: string;
  isEditing?: boolean;
  onEditStart?: () => void;
  onEditEnd?: () => void;
}

const DateCellEditor: React.FC<DateCellEditorProps> = ({ 
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
    }
  }, [isEditing]);

  // Format date for display (YYYY-MM-DD)
  const formatDateForInput = (dateString: string): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  // Format date for display
  const formatDateForDisplay = (dateString: string): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleDateString();
    } catch {
      return '';
    }
  };

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
        type="date"
        className={cn(
          "px-2 py-1 w-full h-full text-sm text-center bg-transparent rounded border-none outline-none",
          "dark:bg-gray-800 dark:text-gray-200"
        )}
        value={formatDateForInput(value)}
        aria-label={ariaLabel || 'Edit date'}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        style={{ 
          minWidth: 100,
          color: 'inherit',
          fontSize: 'inherit'
        }}
      />
    );
  }

  // Show formatted date when not editing
  return (
    <div
      className={cn(
        "px-2 py-1 w-full h-full text-sm text-center cursor-text select-none",
        "hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors",
        !value && "text-gray-400 italic"
      )}
      onClick={handleClick}
      title={value ? formatDateForDisplay(value) : 'Click to edit'}
    >
      {value ? formatDateForDisplay(value) : 'Click to edit'}
    </div>
  );
};

export default DateCellEditor;
export type { DateCellEditorProps }; 