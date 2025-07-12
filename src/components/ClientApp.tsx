'use client';

import { useState, useEffect } from 'react';
import { useTables } from '@/app/contexts/TableContext';
import { useAppStore } from '@/lib/store';
import { Header, Sidebar, DataGrid as DataGridComponent, OfflineIndicator } from '@/components';
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

// Static loading component for the app
function AppLoading() {
  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-800">
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your data...</p>
        </div>
      </div>
    </div>
  );
}

export default function ClientApp() {
  const [isReady, setIsReady] = useState(false);
  const { tables, activeTable, setActiveTable } = useTables();
  const { addTable } = useAppStore();
  const [showCreateTable, setShowCreateTable] = useState(createEmptyBoolean());
  const [newTableName, setNewTableName] = useState(createEmptyString());
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Ensure the app is ready after hydration
  useEffect(() => {
    setIsReady(true);
  }, []);

  // Show loading state until ready
  if (!isReady) {
    return <AppLoading />;
  }

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
    <div className="flex h-screen bg-white dark:bg-gray-800">
      <OfflineIndicator />
      <Sidebar
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
        <div className="flex overflow-hidden flex-1">
          {/* Table Tabs */}
          <div className="flex flex-col w-full">
            {/* Tab Bar */}
            <div className="flex overflow-x-auto items-center px-4 py-2 space-x-2 bg-white border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
              {tables.map((table) => (
                <button
                  key={table.id}
                  onClick={() => setActiveTable(table)}
                  className={cn(
                    'px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer',
                    activeTable?.id === table.id
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-200'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700',
                  )}
                  type="button"
                >
                  {table.name}
                </button>
              ))}
              {/* Create Table Button */}
              <button
                onClick={() => setShowCreateTable(true)}
                className="cursor-pointer px-3 py-1.5 text-sm font-medium rounded-md transition-colors text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900"
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
      </div>
      {/* Create Table Modal */}
      {showCreateTable && (
        <div className="flex fixed inset-0 z-50 justify-center items-center bg-black bg-opacity-50">
          <div className="p-6 mx-4 w-96 max-w-md bg-white rounded-lg dark:bg-gray-800">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
              Create New Table
            </h2>
            <input
              type="text"
              value={newTableName}
              onChange={(e) => setNewTableName(e.target.value)}
              placeholder="Enter table name"
              className="p-2 w-full text-gray-900 bg-white rounded-md border border-gray-200 focus:ring-2 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6';
                e.target.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '';
                e.target.style.boxShadow = 'none';
              }}
              onKeyDown={handleKeyPress}
            />
            <div className="flex justify-end mt-4 space-x-2">
              <button
                onClick={() => setShowCreateTable(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 rounded-md transition-colors dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
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
