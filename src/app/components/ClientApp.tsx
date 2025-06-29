'use client';

import { useState } from 'react';
import { useTables } from '../contexts/TableContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAppStore } from '@/lib/store';
import Header from './Header';
import DataGridComponent from './DataGrid';
import OfflineIndicator from './OfflineIndicator';

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
    <div 
      className="flex flex-col h-screen"
      style={{
        backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff'
      }}
    >
      <OfflineIndicator />
      <Header onToggleSidebar={() => {}} />
      
      <div className="flex overflow-hidden flex-1">
        {/* Table Tabs */}
        <div className="flex flex-col w-full">
          {/* Tab Bar */}
          <div 
            className="flex overflow-x-auto items-center px-4 py-2 space-x-2 border-b"
            style={{
              borderColor: theme === 'dark' ? '#475569' : '#e5e7eb',
              backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff'
            }}
          >
            {tables.map((table) => (
              <button
                key={table.id}
                onClick={() => setActiveTable(table)}
                className="px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap"
                style={{
                  backgroundColor: activeTable?.id === table.id 
                    ? (theme === 'dark' ? '#1e3a8a' : '#dbeafe')
                    : 'transparent',
                  color: activeTable?.id === table.id
                    ? (theme === 'dark' ? '#93c5fd' : '#1d4ed8')
                    : (theme === 'dark' ? '#9ca3af' : '#6b7280')
                }}
                onMouseEnter={(e) => {
                  if (activeTable?.id !== table.id) {
                    e.currentTarget.style.backgroundColor = theme === 'dark' ? '#374151' : '#f3f4f6';
                    e.currentTarget.style.color = theme === 'dark' ? '#d1d5db' : '#374151';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTable?.id !== table.id) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = theme === 'dark' ? '#9ca3af' : '#6b7280';
                  }
                }}
                type="button"
              >
                {table.name}
              </button>
            ))}
            
            {/* Create Table Button */}
            <button
              onClick={() => setShowCreateTable(true)}
              className="px-3 py-1.5 text-sm font-medium rounded-md transition-colors"
              style={{
                color: theme === 'dark' ? '#93c5fd' : '#1d4ed8'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme === 'dark' ? '#1e3a8a' : '#dbeafe';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              type="button"
            >
              + New Table
            </button>
          </div>

          {/* Main Content */}
          <div className="overflow-hidden flex-1">
            <DataGridComponent />
          </div>
        </div>
      </div>

      {/* Create Table Modal */}
      {showCreateTable && (
        <div className="flex fixed inset-0 z-50 justify-center items-center bg-black bg-opacity-50">
          <div 
            className="p-6 mx-4 w-96 max-w-md rounded-lg"
            style={{
              backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff'
            }}
          >
            <h2 
              className="mb-4 text-lg font-semibold"
              style={{
                color: theme === 'dark' ? '#f9fafc' : '#111827'
              }}
            >
              Create New Table
            </h2>
            <input
              type="text"
              value={newTableName}
              onChange={(e) => setNewTableName(e.target.value)}
              placeholder="Enter table name"
              className="p-2 w-full rounded-md border focus:ring-2 focus:border-transparent"
              style={{
                backgroundColor: theme === 'dark' ? '#374151' : '#ffffff',
                borderColor: theme === 'dark' ? '#4b5563' : '#d1d5db',
                color: theme === 'dark' ? '#f9fafc' : '#111827'
              }}
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
                className="px-4 py-2 text-sm font-medium rounded-md transition-colors"
                style={{
                  color: theme === 'dark' ? '#d1d5db' : '#374151'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = theme === 'dark' ? '#374151' : '#f3f4f6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
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