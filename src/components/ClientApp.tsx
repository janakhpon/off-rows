'use client';

import { useState, useEffect } from 'react';
import { useTables } from '@/app/contexts/TableContext';
import { useAppStore } from '@/lib/store';
import { Header, Sidebar, DataGrid as DataGridComponent, OfflineIndicator } from '@/components';
import { cn } from '@/lib/utils';
import CreateTableModal from '@/components/modals/CreateTableModal';

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
      <div className="flex justify-center items-center h-full">
        <div className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 rounded-full border-b-2 border-blue-600 animate-spin"></div>
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
    <div className="flex h-screen bg-white transition-all duration-300 ease-in-out dark:bg-gray-800">
      <OfflineIndicator />
      <Sidebar
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <div className="flex overflow-hidden flex-col flex-1 transition-all duration-300 ease-in-out">
        <Header
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
        <div className="flex overflow-hidden flex-1">
          {/* Table Tabs */}
          <div className="flex flex-col w-full">
            {/* Tab Bar with enhanced animations */}
            <div className="flex overflow-x-auto items-center px-4 py-2 space-x-2 border-b border-gray-200 backdrop-blur-sm transition-all duration-300 ease-in-out bg-white/95 dark:bg-gray-800/95 dark:border-gray-700">
              {tables.map((table, index) => (
                <button
                  key={table.id}
                  onClick={() => setActiveTable(table)}
                  className={cn(
                    'px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 whitespace-nowrap cursor-pointer hover:scale-105',
                    activeTable?.id === table.id
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-200 shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-300',
                  )}
                  style={{ animationDelay: `${index * 0.1}s` }}
                  type="button"
                >
                  {table.name}
                </button>
              ))}
              {/* Create Table Button with enhanced styling */}
              <button
                onClick={() => setShowCreateTable(true)}
                className="cursor-pointer px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900 hover:scale-105 hover:shadow-sm"
                type="button"
              >
                + New Table
              </button>
            </div>
            {/* Main Content */}
            <div className="overflow-hidden flex-1 transition-all duration-300 ease-in-out">
              <DataGridComponent searchQuery={searchQuery} />
            </div>
          </div>
        </div>
      </div>
      {/* Create Table Modal with enhanced animations */}
      <CreateTableModal
        open={showCreateTable}
        onClose={() => {
          setShowCreateTable(false);
          setNewTableName('');
        }}
        value={newTableName}
        onValueChange={setNewTableName}
        onCreate={handleCreateTable}
        onKeyPress={handleKeyPress}
      />
    </div>
  );
}
