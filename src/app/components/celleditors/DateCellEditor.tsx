import React, { useRef, useEffect } from 'react';

interface DateCellEditorProps {
  value: string;
  onChange: (value: string) => void;
  ariaLabel?: string;
}

const DateCellEditor: React.FC<DateCellEditorProps> = ({ 
  value, 
  onChange, 
  ariaLabel 
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

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

  return (
    <input
      ref={inputRef}
      type="date"
      className="w-full h-full px-2 py-1 bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded text-sm text-center"
      value={formatDateForInput(value)}
      aria-label={ariaLabel || 'Edit date'}
      onChange={e => onChange(e.target.value)}
      onKeyDown={e => {
        if (e.key === 'Enter') {
          e.currentTarget.blur();
        }
        if (e.key === 'Escape') {
          e.currentTarget.blur();
        }
      }}
      style={{ 
        minWidth: 100,
        color: 'inherit',
        fontSize: 'inherit'
      }}
    />
  );
};

export default DateCellEditor;
export type { DateCellEditorProps }; 