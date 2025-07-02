import React, { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface NumberCellEditorProps {
  value: number | '';
  onChange: (value: number | null) => void;
  ariaLabel?: string;
}

const NumberCellEditor: React.FC<NumberCellEditorProps> = ({ 
  value, 
  onChange, 
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
      type="number"
      className={cn(
        "w-full h-full px-2 py-1 bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded text-sm text-right",
        "dark:bg-gray-800 dark:text-gray-200"
      )}
      value={value || ''}
      aria-label={ariaLabel || 'Edit number'}
      onChange={e => {
        const val = e.target.value;
        onChange(val === '' ? null : Number(val));
      }}
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

export default NumberCellEditor;
export type { NumberCellEditorProps }; 