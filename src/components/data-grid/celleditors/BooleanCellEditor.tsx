'use client';

import React, { useRef, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';

interface BooleanCellEditorProps {
  value: boolean;
  onChange: (value: boolean) => void;
  ariaLabel?: string;
}

const BooleanCellEditor: React.FC<BooleanCellEditorProps> = ({ value, onChange, ariaLabel }) => {
  const checkboxRef = useRef<HTMLButtonElement>(null);

  // Auto-focus on mount
  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.focus();
    }
  }, []);

  return (
    <div className="flex items-center justify-center h-full w-full">
      <Checkbox
        ref={checkboxRef}
        checked={value || false}
        onCheckedChange={onChange}
        aria-label={ariaLabel || 'Toggle value'}
        className="cursor-pointer"
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.currentTarget.blur();
          }
        }}
      />
    </div>
  );
};

export default BooleanCellEditor;
