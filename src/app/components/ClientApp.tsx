'use client';

import { useState } from 'react';
import { useTables } from '../contexts/TableContext';
import { useAppStore } from '@/lib/store';
import { Table } from '@/lib/schemas';
import Header from './Header';
import DataGridComponent from './DataGrid';
import OfflineIndicator from './OfflineIndicator';

export default function ClientApp() {
  const { tables, activeTable, setActiveTable } = useTables();
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
    <div className="h-screen flex flex-col bg-white dark:bg-gray-800">
      <OfflineIndicator />
      <Header onToggleSidebar={() => {}} />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Table Tabs */}
        <div className="w-full flex flex-col">
          {/* Tab Bar */}
          <div className="flex items-center border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 space-x-2 overflow-x-auto">
            {tables.map((table) => (
              <button
                key={table.id}
                onClick={() => setActiveTable(table)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                  activeTable?.id === table.id
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                type="button"
              >
                {table.name}
              </button>
            ))}
            
            {/* Create Table Button */}
            <button
              onClick={() => setShowCreateTable(true)}
              className="px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded-md transition-colors"
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
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-md mx-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Create New Table</h2>
            <input
              type="text"
              value={newTableName}
              onChange={(e) => setNewTableName(e.target.value)}
              placeholder="Enter table name"
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
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
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
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