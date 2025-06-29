'use client';

import { Menu, Plus, Database, ChevronRight, Settings, HelpCircle, Github } from 'lucide-react';
import { useTables } from '../contexts/TableContext';
import { useAppStore } from '@/lib/store';
import { Table } from '@/lib/schemas';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const { tables, activeTable, setActiveTable } = useTables();
  const { addTable } = useAppStore();

  const handleTableClick = (table: Table) => {
    setActiveTable(table);
  };

  const handleAddTable = async () => {
    const tableName = prompt('Enter table name:');
    if (tableName?.trim()) {
      await addTable({
        name: tableName.trim(),
        description: '',
        fields: [
          {
            id: 'name',
            name: 'Name',
            type: 'text',
            required: true,
            defaultValue: '',
          },
        ],
      });
    }
  };

  const handleSettings = () => {
    // TODO: Implement settings modal
    console.log('Settings clicked');
  };

  const handleHelp = () => {
    // TODO: Implement help/documentation
    console.log('Help clicked');
  };

  const handleGithub = () => {
    window.open('https://github.com/your-repo/offrows', '_blank');
  };

  return (
    <>
      {/* Mobile overlay */}
      {!isCollapsed && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden modal-backdrop"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed md:relative z-50 h-full bg-white border-r border-gray-200 shadow-sm transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-16 md:w-16' : 'w-64'}
        ${isCollapsed ? '-translate-x-full md:translate-x-0' : 'translate-x-0'}
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <Database className="h-6 w-6 text-blue-600" />
              <span className="font-semibold text-gray-900">Tables</span>
            </div>
          )}
          <button
            onClick={onToggle}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200 cursor-pointer focus-ring"
            type="button"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Tables Section */}
          <div className="p-4">
            {!isCollapsed && (
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-900">All Tables</h3>
                <button
                  onClick={handleAddTable}
                  className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors duration-200 cursor-pointer focus-ring"
                  title="Add new table"
                  type="button"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Tables List */}
            <div className="space-y-1">
              {tables.length === 0 ? (
                <div className={`text-center py-8 ${isCollapsed ? 'px-2' : 'px-4'}`}>
                  {!isCollapsed && (
                    <>
                      <Database className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500 mb-3">No tables yet</p>
                      <button
                        onClick={handleAddTable}
                        className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 cursor-pointer focus-ring"
                        type="button"
                      >
                        Create your first table
                      </button>
                    </>
                  )}
                </div>
              ) : (
                tables.map((table) => (
                  <button
                    key={table.id}
                    onClick={() => handleTableClick(table)}
                    className={`
                      w-full text-left p-2 rounded-lg transition-all duration-200 cursor-pointer group
                      ${activeTable?.id === table.id
                        ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 border border-transparent'
                      }
                      ${isCollapsed ? 'flex justify-center' : 'flex items-center justify-between'}
                    `}
                    type="button"
                  >
                    {isCollapsed ? (
                      <Database className={`h-5 w-5 ${activeTable?.id === table.id ? 'text-blue-600' : 'text-gray-400'}`} />
                    ) : (
                      <>
                        <div className="flex items-center space-x-2 min-w-0">
                          <Database className={`h-4 w-4 flex-shrink-0 ${activeTable?.id === table.id ? 'text-blue-600' : 'text-gray-400'}`} />
                          <div className="min-w-0">
                            <span className="truncate text-sm font-medium block">{table.name}</span>
                            <span className="text-xs text-gray-500">{table.fields.length} columns</span>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                      </>
                    )}
                  </button>
                ))
              )}
            </div>

            {/* Add Table Button (collapsed) */}
            {isCollapsed && tables.length > 0 && (
              <div className="mt-4 flex justify-center">
                <button
                  onClick={handleAddTable}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200 cursor-pointer focus-ring"
                  title="Add new table"
                  type="button"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200">
          {!isCollapsed ? (
            <div className="p-4 space-y-3">
              <div className="text-xs text-gray-500">
                {tables.length} table{tables.length !== 1 ? 's' : ''}
              </div>
              
              {/* Footer actions */}
              <div className="space-y-1">
                <button
                  onClick={handleSettings}
                  className="w-full flex items-center space-x-2 px-2 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded transition-colors duration-200 cursor-pointer"
                  type="button"
                >
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </button>
                <button
                  onClick={handleHelp}
                  className="w-full flex items-center space-x-2 px-2 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded transition-colors duration-200 cursor-pointer"
                  type="button"
                >
                  <HelpCircle className="h-4 w-4" />
                  <span>Help</span>
                </button>
                <button
                  onClick={handleGithub}
                  className="w-full flex items-center space-x-2 px-2 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded transition-colors duration-200 cursor-pointer"
                  type="button"
                >
                  <Github className="h-4 w-4" />
                  <span>GitHub</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              <button
                onClick={handleSettings}
                className="w-full p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded transition-colors duration-200 cursor-pointer focus-ring"
                title="Settings"
                type="button"
              >
                <Settings className="h-4 w-4" />
              </button>
              <button
                onClick={handleHelp}
                className="w-full p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded transition-colors duration-200 cursor-pointer focus-ring"
                title="Help"
                type="button"
              >
                <HelpCircle className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
} 