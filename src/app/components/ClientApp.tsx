'use client';

import { useState } from 'react';
import { useTables } from '../contexts/TableContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAppStore } from '@/lib/store';
import { Table } from '@/lib/schemas';
import Header from './Header';
import DataGridComponent from './DataGrid';
import OfflineIndicator from './OfflineIndicator';

export default function ClientApp() {
  const { tables, activeTable, setActiveTable } = useTables();
  const { theme } = useTheme();
  const { addTable } = useAppStore();
  const [showCreateTable, setShowCreateTable] = useState(false);
  const [newTableName, setNewTableName] = useState('');

  const handleCreateTable = async () => {
    if (!newTableName.trim()) return;

    const newTable: Omit<Table, 'id' | 'createdAt' | 'updatedAt'> = {
      name: newTableName.trim(),
      description: '',
      fields: [
        { id: 'name', name: 'Name', type: 'text', required: true },
        { id: 'status', name: 'Status', type: 'dropdown', options: ['Active', 'Inactive', 'Pending'] },
        { id: 'priority', name: 'Priority', type: 'number' },
        { id: 'due_date', name: 'Due Date', type: 'date' },
        { id: 'completed', name: 'Completed', type: 'boolean' },
      ],
      colWidths: {},
      rowHeights: {},
    };

    await addTable(newTable);
    setNewTableName('');
    setShowCreateTable(false);
  };

  return (
    <div 
      className="h-screen flex flex-col"
      style={{
        backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff'
      }}
    >
      <OfflineIndicator />
      <Header onToggleSidebar={() => {}} />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Table Tabs */}
        <div className="w-full flex flex-col">
          {/* Tab Bar */}
          <div 
            className="flex items-center border-b px-4 py-2 space-x-2 overflow-x-auto"
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
          <div className="flex-1 overflow-hidden">
            <DataGridComponent />
          </div>
        </div>
      </div>

      {/* Create Table Modal */}
      {showCreateTable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div 
            className="rounded-lg p-6 w-96 max-w-md mx-4"
            style={{
              backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff'
            }}
          >
            <h2 
              className="text-lg font-semibold mb-4"
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
              className="w-full p-2 border rounded-md focus:ring-2 focus:border-transparent"
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
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreateTable();
                } else if (e.key === 'Escape') {
                  setShowCreateTable(false);
                }
              }}
            />
            <div className="flex justify-end space-x-2 mt-4">
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
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
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