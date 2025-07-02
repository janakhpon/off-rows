import React, { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface TextCellEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
}

const TextCellEditor: React.FC<TextCellEditorProps> = ({ 
  value, 
  onChange, 
  placeholder = 'Type...', 
  ariaLabel 
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, []);

  return (
    <input
      ref={inputRef}
      type="text"
      className={cn(
        "px-2 py-1 w-full h-full text-sm bg-transparent rounded border-none outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50",
        "dark:bg-gray-800 dark:text-gray-200"
      )}
      value={value || ''}
      placeholder={placeholder}
      aria-label={ariaLabel || 'Edit text'}
      onChange={e => onChange(e.target.value)}
      onKeyDown={e => {
        if (e.key === 'Enter') {
          e.currentTarget.blur();
        }
        if (e.key === 'Escape') {
          e.currentTarget.blur();
        }
      }}
    />
  );
};

export default TextCellEditor; 