'use client';

import { useState } from 'react';
import { useTables } from '@/app/contexts/TableContext';
import { useTheme } from '@/app/contexts/ThemeContext';
import { useAppStore } from '@/lib/store';
import { Header, DataGrid as DataGridComponent, OfflineIndicator } from '@/components';
import { cn } from '@/lib/utils';

// Pure utility functions
const createEmptyString = () => '';
const createEmptyBoolean = () => false;

// Pure function to validate table name
const validateTableName = (name: string): boolean => name.trim().length > 0;

// Pure function to create new table data
const createNewTableData = (name: string) => ({
  name: name.trim(),
  fields: [
    { id: 'name', name: 'Name', type: 'text' as const, required: true },
    { id: 'description', name: 'Description', type: 'text' as const },
  ],
});

export default function ClientApp() {
  const { tables, activeTable, setActiveTable } = useTables();
  const { theme } = useTheme();
  const { addTable } = useAppStore();
  const [showCreateTable, setShowCreateTable] = useState(createEmptyBoolean());
  const [newTableName, setNewTableName] = useState(createEmptyString());
  const [searchQuery, setSearchQuery] = useState('');

  const handleCreateTable = async () => {
    if (!validateTableName(newTableName)) return;
    
    try {
      await addTable(createNewTableData(newTableName));
      setNewTableName(createEmptyString());
      setShowCreateTable(false);
    } catch {
      // Error handling removed with notification system
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateTable();
    } else if (e.key === 'Escape') {
      setShowCreateTable(false);
      setNewTableName(createEmptyString());
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-800">
      <OfflineIndicator />
      <Header onToggleSidebar={() => {}} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      <div className="flex overflow-hidden flex-1">
        {/* Table Tabs */}
        <div className="flex flex-col w-full">
          {/* Tab Bar */}
          <div className="flex overflow-x-auto items-center px-4 py-2 space-x-2 border-b bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            {tables.map((table) => (
              <button
                key={table.id}
                onClick={() => setActiveTable(table)}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap",
                  activeTable?.id === table.id
                    ? (theme === 'dark' ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-900')
                    : (theme === 'dark' ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100')
                )}
                type="button"
              >
                {table.name}
              </button>
            ))}
            {/* Create Table Button */}
            <button
              onClick={() => setShowCreateTable(true)}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                theme === 'dark' ? 'text-blue-300 hover:bg-blue-900' : 'text-blue-700 hover:bg-blue-100'
              )}
              type="button"
            >
              + New Table
            </button>
          </div>
          {/* Main Content */}
          <div className="overflow-hidden flex-1">
            <DataGridComponent searchQuery={searchQuery} />
          </div>
        </div>
      </div>
      {/* Create Table Modal */}
      {showCreateTable && (
        <div className="flex fixed inset-0 z-50 justify-center items-center bg-black bg-opacity-50">
          <div
            className={cn(
              "p-6 mx-4 w-96 max-w-md rounded-lg",
              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            )}
          >
            <h2
              className={cn(
                "mb-4 text-lg font-semibold",
                theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
              )}
            >
              Create New Table
            </h2>
            <input
              type="text"
              value={newTableName}
              onChange={(e) => setNewTableName(e.target.value)}
              placeholder="Enter table name"
              className={cn(
                "p-2 w-full rounded-md border focus:ring-2 focus:border-transparent",
                theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-200 text-gray-900'
              )}
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6';
                e.target.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = theme === 'dark' ? '#4b5563' : '#d1d5db';
                e.target.style.boxShadow = 'none';
              }}
              onKeyDown={handleKeyPress}
            />
            <div className="flex justify-end mt-4 space-x-2">
              <button
                onClick={() => setShowCreateTable(false)}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-md transition-colors",
                  theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                )}
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTable}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md transition-colors hover:bg-blue-700"
                type="button"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 