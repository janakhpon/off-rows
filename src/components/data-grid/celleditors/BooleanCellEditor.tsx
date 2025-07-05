'use client';

import React, { useRef, useEffect } from 'react';

interface BooleanCellEditorProps {
  value: boolean;
  onChange: (value: boolean) => void;
  ariaLabel?: string;
}

const BooleanCellEditor: React.FC<BooleanCellEditorProps> = ({ value, onChange, ariaLabel }) => {
  const checkboxRef = useRef<HTMLInputElement>(null);

  // Auto-focus on mount
  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.focus();
    }
  }, []);

  return (
    <div className="flex items-center justify-center h-full w-full">
      <input
        ref={checkboxRef}
        type="checkbox"
        checked={value || false}
        aria-label={ariaLabel || 'Toggle value'}
        className="w-4 h-4 cursor-pointer transition-all duration-150"
        onChange={(e) => onChange(e.target.checked)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onChange(!value);
          }
          if (e.key === 'Escape') {
            e.currentTarget.blur();
          }
        }}
        style={{
          accentColor: 'var(--primary)',
          color: 'inherit',
        }}
      />
    </div>
  );
};

export default BooleanCellEditor;
