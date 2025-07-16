'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { X, Copy, Code, Database } from 'lucide-react';
import { Table, Field } from '@/lib/schemas';
import { SQLGenerator } from '@/lib/sql-generator';
import { useNotifications } from '@/app/contexts/NotificationContext';

// Types
interface TableSchemaModalProps {
  open: boolean;
  onClose: () => void;
  table: Table | null;
}

type TabType = 'schema' | 'sql';
type CopyType = 'schema' | 'sql';

// Constants
const TAB_CONFIG = {
  schema: {
    id: 'schema' as const,
    label: 'Schema Structure',
    icon: Code,
  },
  sql: {
    id: 'sql' as const,
    label: 'SQL Code',
    icon: Database,
  },
} as const;

// Utility functions
const getTypeScriptType = (fieldType: Field['type']): string => {
  const typeMap: Record<Field['type'], string> = {
    text: 'string',
    number: 'number',
    boolean: 'boolean',
    date: 'string',
    dropdown: 'string',
    image: 'FileValueWithId | null',
    file: 'FileValueWithId | null',
    images: 'FileValueWithId[]',
    files: 'FileValueWithId[]',
  };

  return typeMap[fieldType] || 'string';
};

const getDefaultValue = (field: Field): string => {
  const valueMap: Record<Field['type'], () => string> = {
    text: () => `"${field.name}"`,
    number: () => String(field.defaultValue || '0'),
    boolean: () => (field.defaultValue ? 'true' : 'false'),
    date: () => `"${new Date().toISOString().split('T')[0]}"`,
    dropdown: () => (field.options?.[0] ? `"${field.options[0]}"` : 'null'),
    image: () => 'null',
    file: () => 'null',
    images: () => '[]',
    files: () => '[]',
  };

  return valueMap[field.type]?.() || 'null';
};

// Custom hooks
const useClipboard = () => {
  const { showNotification } = useNotifications();

  const copyToClipboard = async (text: string, type: CopyType) => {
    try {
      await navigator.clipboard.writeText(text);
      showNotification({
        type: 'success',
        title: `${type === 'schema' ? 'Schema' : 'SQL'} copied to clipboard!`,
        message: `The ${type === 'schema' ? 'TypeScript schema' : 'SQL code'} has been copied to your clipboard.`,
      });
    } catch {
      showNotification({
        type: 'error',
        title: 'Failed to copy to clipboard',
        message: 'Please try copying manually or check your browser permissions.',
      });
    }
  };

  return { copyToClipboard };
};

const useSchemaCode = (table: Table | null) => {
  return useMemo(() => {
    if (!table) return '';

    const interfaceName = table.name.replace(/\s+/g, '');

    const fieldDefinitions = table.fields
      .map((field) => {
        const type = getTypeScriptType(field.type);
        const required = field.required ? '' : '?';
        return `  ${field.id}${required}: ${type};`;
      })
      .join('\n');

    const sampleData = table.fields
      .map((field) => {
        const defaultValue = getDefaultValue(field);
        return `  ${field.id}: ${defaultValue},`;
      })
      .join('\n');

    return `// Table Schema for "${table.name}"
interface ${interfaceName}Table {
  id: number;
  tableId: number;
  createdAt: Date;
  updatedAt: Date;
${fieldDefinitions}
}

// Field Definitions
const fields: Field[] = ${JSON.stringify(table.fields, null, 2)};

// Sample Data Structure
const sampleRow = {
${sampleData}
};`;
  }, [table]);
};

// Components
const TabButton: React.FC<{
  tab: (typeof TAB_CONFIG)[keyof typeof TAB_CONFIG];
  isActive: boolean;
  onClick: () => void;
}> = ({ tab, isActive, onClick }) => {
  const Icon = tab.icon;

  return (
    <button
      onClick={onClick}
      className={`flex items-center px-4 py-2 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
        isActive
          ? 'text-blue-600 border-blue-500 dark:text-blue-400'
          : 'text-gray-500 border-transparent hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
      }`}
    >
      <Icon className="mr-2 w-4 h-4" />
      {tab.label}
    </button>
  );
};

const CodeBlock: React.FC<{
  title: string;
  code: string;
  onCopy: () => void;
  copyLabel: string;
}> = ({ title, code, onCopy, copyLabel }) => (
  <div>
    <div className="flex justify-between items-center mb-3">
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{title}</h3>
      <button
        onClick={onCopy}
        className="flex items-center px-3 py-1 text-sm text-gray-700 bg-gray-100 rounded transition-colors cursor-pointer hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
      >
        <Copy className="mr-1 w-4 h-4" />
        {copyLabel}
      </button>
    </div>
    <div className="overflow-auto p-4 max-h-96 text-green-400 bg-gray-900 rounded-lg">
      <pre className="font-mono text-sm whitespace-pre-wrap">{code}</pre>
    </div>
  </div>
);

const ModalHeader: React.FC<{
  table: Table;
  onClose: () => void;
}> = ({ table, onClose }) => (
  <div className="flex justify-between items-center mb-6">
    <div>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
        Table Schema: {table.name}
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {table.fields.length} fields • {table.description || 'No description'}
      </p>
    </div>
    <button
      onClick={onClose}
      className="p-2 text-gray-400 transition-colors cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
      aria-label="Close"
    >
      <X className="w-5 h-5" />
    </button>
  </div>
);

const TabNavigation: React.FC<{
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}> = ({ activeTab, onTabChange }) => (
  <div className="flex mb-6 border-b border-gray-200 dark:border-gray-700">
    {Object.values(TAB_CONFIG).map((tab) => (
      <TabButton
        key={tab.id}
        tab={tab}
        isActive={activeTab === tab.id}
        onClick={() => onTabChange(tab.id)}
      />
    ))}
  </div>
);

// Main component
export default function TableSchemaModal({ open, onClose, table }: TableSchemaModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('schema');
  const [generatedSQL, setGeneratedSQL] = useState<string>('');

  const { copyToClipboard } = useClipboard();
  const schemaCode = useSchemaCode(table);

  // Generate SQL when table changes
  useEffect(() => {
    if (table && open) {
      try {
        const sql = SQLGenerator.generateCreateTableSQL(table);
        setGeneratedSQL(sql);
      } catch (error) {
        console.error('Failed to generate SQL:', error);
        setGeneratedSQL('-- Error generating SQL schema');
      }
    }
  }, [table, open]);

  // Reset tab when modal opens
  useEffect(() => {
    if (open) {
      setActiveTab('schema');
    }
  }, [open]);

  // Early return if not open or no table
  if (!open || !table) return null;

  const handleCopySchema = () => {
    copyToClipboard(schemaCode, 'schema');
  };

  const handleCopySQL = () => {
    copyToClipboard(generatedSQL, 'sql');
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div
      className="flex fixed inset-0 z-50 justify-center items-center bg-primary/5 animate-fade-in"
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="schema-modal-title"
    >
      <div className="relative p-6 mx-4 w-full max-w-4xl bg-white rounded-lg shadow-lg animate-scale-in dark:bg-gray-800">
        <ModalHeader table={table} onClose={onClose} />

        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="space-y-4">
          {activeTab === 'schema' && (
            <CodeBlock
              title="TypeScript Interface & Field Definitions"
              code={schemaCode}
              onCopy={handleCopySchema}
              copyLabel="Copy"
            />
          )}

          {activeTab === 'sql' && (
            <CodeBlock
              title="Generated SQL Schema"
              code={generatedSQL}
              onCopy={handleCopySQL}
              copyLabel="Copy SQL"
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-4 mt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md transition-colors cursor-pointer hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
