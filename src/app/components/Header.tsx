'use client';

import { useState, useRef, useEffect } from 'react';
import { Menu, Search, Plus, Download, Upload } from 'lucide-react';
import { useTables } from '../contexts/TableContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAppStore } from '@/lib/store';
import ThemeToggle from './ThemeToggle';
import { Table, TableRow, FileValueWithId } from '@/lib/schemas';
import { Dispatch, SetStateAction } from 'react';
import { cn } from '@/lib/utils';

interface HeaderProps {
  onToggleSidebar: () => void;
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
}

// Custom hook for table export/import logic
function useTableExportImport(
  activeTable: Table | null,
  rows: TableRow[],
  addRow: (row: Omit<TableRow, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>,
  setNotification: Dispatch<SetStateAction<{ message: string; type: 'success' | 'error' } | null>>
) {
  const fieldIds = activeTable ? activeTable.fields.map(f => typeof f.id === 'string' ? f.id : '').filter((id): id is string => !!id) : [];
  const fieldNames = activeTable ? activeTable.fields.map(f => f.name) : [];
  const tableRows = activeTable ? rows.filter((r: TableRow) => r.tableId === activeTable.id) : [];

  const handleExportCSV = () => {
    if (!activeTable) return;
    const csvRows = [fieldNames.join(',')];
    for (const row of tableRows) {
      const vals = fieldIds.map((fid: string) => {
        let v = row.data[fid];
        if (typeof v === 'object' && v !== null) v = JSON.stringify(v);
        return v === undefined || v === null ? '' : String(v).replace(/"/g, '""');
      });
      csvRows.push(vals.map((val: string) => `"${val}"`).join(','));
    }
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTable.name || 'table'}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setNotification({ message: 'CSV export complete!', type: 'success' });
  };

  const handleExportJSON = () => {
    if (!activeTable) return;
    const data = tableRows.map((row: TableRow) => {
      const obj: Record<string, unknown> = {};
      for (const fid of fieldIds) obj[fid] = row.data[fid];
      return obj;
    });
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTable.name || 'table'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setNotification({ message: 'JSON export complete!', type: 'success' });
  };

  const handleImportCSV = () => {
    if (!activeTable) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,text/csv';
    input.onchange = async (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files && target.files[0];
      if (!file) return;
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter(Boolean);
      if (lines.length < 2) {
        setNotification({ message: 'CSV must have at least one row.', type: 'error' });
        return;
      }
      for (let i = 1; i < lines.length; ++i) {
        const vals = lines[i].split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map((v: string) => v.replace(/^"|"$/g, ''));
        const data: Record<string, string | number | boolean | FileValueWithId | FileValueWithId[] | null> = {};
        for (const [idx, fid] of fieldIds.entries()) {
          if (typeof fid === 'string' && idx < vals.length) {
            data[fid] = vals[idx];
          }
        }
        await addRow({ tableId: activeTable.id, data });
      }
      setNotification({ message: 'CSV import complete!', type: 'success' });
    };
    input.click();
  };

  const handleImportJSON = () => {
    if (!activeTable) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = async (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files && target.files[0];
      if (!file) return;
      const text = await file.text();
      let arr: Record<string, unknown>[] = [];
      try {
        arr = JSON.parse(text);
      } catch {
        setNotification({ message: 'Invalid JSON file.', type: 'error' });
        return;
      }
      if (!Array.isArray(arr)) {
        setNotification({ message: 'JSON must be an array of objects.', type: 'error' });
        return;
      }
      for (const obj of arr) {
        const data: Record<string, string | number | boolean | FileValueWithId | FileValueWithId[] | null> = {};
        for (const fid of fieldIds) {
          if (Object.prototype.hasOwnProperty.call(obj, fid)) {
            data[fid] = obj[fid] as string | number | boolean | FileValueWithId | FileValueWithId[] | null;
          }
        }
        await addRow({ tableId: activeTable.id, data });
      }
      setNotification({ message: 'JSON import complete!', type: 'success' });
    };
    input.click();
  };

  return { handleExportCSV, handleExportJSON, handleImportCSV, handleImportJSON };
}

export default function Header({ onToggleSidebar, searchQuery, setSearchQuery }: HeaderProps) {
  const { activeTable } = useTables();
  const { theme } = useTheme();
  const { addTable, rows, addRow } = useAppStore();
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [importMenuOpen, setImportMenuOpen] = useState(false);
  const exportBtnRef = useRef<HTMLButtonElement>(null);
  const importBtnRef = useRef<HTMLButtonElement>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showNotification, setShowNotification] = useState(false);
  const { handleExportCSV, handleExportJSON, handleImportCSV, handleImportJSON } = useTableExportImport(activeTable, rows, addRow, setNotification);

  // Dropdown close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        exportMenuOpen && exportBtnRef.current && !exportBtnRef.current.contains(e.target as Node)
      ) setExportMenuOpen(false);
      if (
        importMenuOpen && importBtnRef.current && !importBtnRef.current.contains(e.target as Node)
      ) setImportMenuOpen(false);
    }
    if (exportMenuOpen || importMenuOpen) {
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [exportMenuOpen, importMenuOpen]);

  // Show notification when set
  useEffect(() => {
    if (notification) {
      setShowNotification(true);
      const timeout = setTimeout(() => setShowNotification(false), 2500);
      const cleanup = setTimeout(() => setNotification(null), 3000);
      return () => { clearTimeout(timeout); clearTimeout(cleanup); };
    }
  }, [notification]);

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

  return (
    <header 
      className={cn(
        "border-b shadow-sm sticky top-0 z-40",
        theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      )}
    >
      <div className="flex items-center justify-between h-16 px-4 sm:px-6">
        {/* Left side - Menu button and logo */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onToggleSidebar}
            className={cn(
              "p-2 rounded-lg transition-colors duration-200 cursor-pointer focus-ring",
              theme === 'dark' ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'
            )}
            type="button"
          >
            <Menu className="h-5 w-5" />
          </button>
          
          <div className="flex items-center space-x-3">
            <div className="hidden sm:block">
              <h1 
                className={cn(
                  "text-xl font-bold",
                  theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
                )}
              >
                Offrows
              </h1>
              <p 
                className={cn(
                  "text-xs",
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                )}
              >
                Offline-first project tracker
              </p>
            </div>
          </div>
        </div>

        {/* Center - Search and table info */}
        <div className="flex-1 max-w-2xl mx-4 hidden md:block">
          <div className="relative">
            <Search 
              className={cn(
                "absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4",
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              )}
            />
            <input
              type="text"
              placeholder="Search in table..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                "w-full pl-10 pr-4 py-2 text-sm border rounded-lg transition-colors duration-200",
                theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200',
                theme === 'dark' ? 'text-gray-300' : 'text-gray-900'
              )}
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6';
                e.target.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = theme === 'dark' ? '#4b5563' : '#d1d5db';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>
        </div>

        {/* Right side - Table info and actions */}
        <div className="flex items-center space-x-2">
          {/* Table info */}
          {activeTable && (
            <div className="hidden sm:flex items-center space-x-3 mr-4">
              <div className="text-right">
                <h2 
                  className={cn(
                    "text-sm font-medium",
                    theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
                  )}
                >
                  {activeTable.name}
                </h2>
                <p 
                  className={cn(
                    "text-xs",
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  )}
                >
                  {activeTable.fields.length} columns
                </p>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center space-x-1">
            <button
              onClick={handleAddTable}
              className={cn(
                "p-2 rounded-lg transition-colors duration-200 cursor-pointer focus-ring",
                theme === 'dark' ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'
              )}
              type="button"
            >
              <Plus className="h-4 w-4" />
            </button>
            {/* Export and Import buttons */}
            <button
              ref={exportBtnRef}
              onClick={() => setExportMenuOpen((v) => !v)}
              className={cn(
                "p-2 rounded-lg transition-colors duration-200 cursor-pointer focus-ring relative",
                theme === 'dark' ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'
              )}
              type="button"
            >
              <Download className="h-4 w-4" />
              {exportMenuOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                  <button
                    onClick={handleExportCSV}
                    className={cn(
                      "block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors",
                      theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                    )}
                  >
                    Export as CSV
                  </button>
                  <button
                    onClick={handleExportJSON}
                    className={cn(
                      "block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors",
                      theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                    )}
                  >
                    Export as JSON
                  </button>
                </div>
              )}
            </button>
            <button
              ref={importBtnRef}
              onClick={() => setImportMenuOpen((v) => !v)}
              className={cn(
                "p-2 rounded-lg transition-colors duration-200 cursor-pointer focus-ring relative",
                theme === 'dark' ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'
              )}
              type="button"
            >
              <Upload className="h-4 w-4" />
              {importMenuOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                  <button
                    onClick={handleImportCSV}
                    className={cn(
                      "block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors",
                      theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                    )}
                  >
                    Import as CSV
                  </button>
                  <button
                    onClick={handleImportJSON}
                    className={cn(
                      "block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors",
                      theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                    )}
                  >
                    Import as JSON
                  </button>
                </div>
              )}
            </button>
            {/* ThemeToggle button follows here */}
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Mobile search bar */}
      <div className="md:hidden px-4 pb-4">
        <div className="relative">
          <Search 
            className={cn(
              "absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4",
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            )}
          />
          <input
            type="text"
            placeholder="Search in table..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              "w-full pl-10 pr-4 py-2 text-sm border rounded-lg transition-colors duration-200",
              theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200',
              theme === 'dark' ? 'text-gray-300' : 'text-gray-900'
            )}
            onFocus={(e) => {
              e.target.style.borderColor = '#3b82f6';
              e.target.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = theme === 'dark' ? '#4b5563' : '#d1d5db';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>
      </div>

      {/* Render notification in Header as well */}
      {notification && (
        <div className={cn(
          "fixed top-6 right-6 z-50 px-4 py-2 rounded shadow-lg text-white font-medium transition-all duration-500 transform",
          showNotification ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2",
          notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        )}
          style={{ pointerEvents: showNotification ? 'auto' : 'none' }}>
          {notification.message}
        </div>
      )}
    </header>
  );
} 