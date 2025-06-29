import React, { useRef, useEffect } from 'react';

interface DropdownCellEditorProps {
  value: string;
  options: string[];
  onChange: (value: string) => void;
  ariaLabel?: string;
}

const DropdownCellEditor: React.FC<DropdownCellEditorProps> = ({ 
  value, 
  options, 
  onChange, 
  ariaLabel 
}) => {
  const selectRef = useRef<HTMLSelectElement>(null);

  // Auto-focus on mount
  useEffect(() => {
    if (selectRef.current) {
      selectRef.current.focus();
    }
  }, []);

  return (
    <select
      ref={selectRef}
      className="w-full h-full px-2 py-1 bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded text-sm cursor-pointer"
      value={value || ''}
      aria-label={ariaLabel || 'Select option'}
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
        minWidth: 80,
        color: 'inherit',
        fontSize: 'inherit'
      }}
    >
      <option value="">Select...</option>
      {options.map((option, index) => (
        <option key={index} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
};

export default DropdownCellEditor;
export type { DropdownCellEditorProps }; 