'use client';

import { useState, useRef, useEffect } from 'react';
import { Menu, Search, Plus, Download, Upload } from 'lucide-react';
import { useTables } from '@/app/contexts/TableContext';
import { useTheme } from '@/app/contexts/ThemeContext';
import { useAppStore } from '@/lib/store';
import { ThemeToggle } from '@/components';
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
  setNotification: Dispatch<SetStateAction<{ message: string; type: 'success' | 'error' } | null>>,
) {
  const fieldIds = activeTable
    ? activeTable.fields
        .map((f) => (typeof f.id === 'string' ? f.id : ''))
        .filter((id): id is string => !!id)
    : [];
  const fieldNames = activeTable ? activeTable.fields.map((f) => f.name) : [];
  const tableRows = activeTable ? rows.filter((r: TableRow) => r.tableId === activeTable.id) : [];

  const handleExportCSV = () => {
    if (!activeTable) return;
    const csvRows = [fieldNames.join(',')];
    for (const row of tableRows) {
      const vals = fieldIds.map((fid: string) => {
        let v = row.data[fid];
        // Handle blob fields - just export the file name or a placeholder
        if (typeof v === 'object' && v !== null) {
          if ('fileId' in v && 'name' in v) {
            // File/image field - export filename
            v = (v as { name: string }).name || '[File]';
          } else {
            v = JSON.stringify(v);
          }
        }
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
      for (const fid of fieldIds) {
        const value = row.data[fid];
        // Handle blob fields - export file info instead of blob data
        if (typeof value === 'object' && value !== null && 'fileId' in value) {
          obj[fid] = {
            fileId: (value as { fileId: number }).fileId,
            name: (value as { name: string }).name || 'Unknown file',
            type: (value as { type: string }).type || 'application/octet-stream',
            // Note: Actual file content is not included in table export
            // Use full database export for complete file backup
          };
        } else {
          obj[fid] = value;
        }
      }
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
        const line = lines[i];
        if (!line) continue;
        const vals = line
          .split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/)
          .map((v: string) => v.replace(/^"|"$/g, ''));
        const data: Record<
          string,
          string | number | boolean | FileValueWithId | FileValueWithId[] | null
        > = {};
        for (const [idx, fid] of fieldIds.entries()) {
          if (typeof fid === 'string' && idx < vals.length) {
            const val = vals[idx];
            if (val !== undefined) {
              data[fid] = val;
            }
          }
        }
        await addRow({ tableId: activeTable.id!, data, version: 0 });
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
        const data: Record<
          string,
          string | number | boolean | FileValueWithId | FileValueWithId[] | null
        > = {};
        for (const fid of fieldIds) {
          if (Object.prototype.hasOwnProperty.call(obj, fid)) {
            data[fid] = obj[fid] as
              | string
              | number
              | boolean
              | FileValueWithId
              | FileValueWithId[]
              | null;
          }
        }
        await addRow({ tableId: activeTable.id!, data, version: 0 });
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
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);
  const [showNotification, setShowNotification] = useState(false);
  const { handleExportCSV, handleExportJSON, handleImportCSV, handleImportJSON } =
    useTableExportImport(activeTable, rows, addRow, setNotification);

  // Dropdown close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        exportMenuOpen &&
        exportBtnRef.current &&
        !exportBtnRef.current.contains(e.target as Node)
      )
        setExportMenuOpen(false);
      if (
        importMenuOpen &&
        importBtnRef.current &&
        !importBtnRef.current.contains(e.target as Node)
      )
        setImportMenuOpen(false);
    }
    if (exportMenuOpen || importMenuOpen) {
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
    return undefined;
  }, [exportMenuOpen, importMenuOpen]);

  // Show notification when set
  useEffect(() => {
    if (notification) {
      setShowNotification(true);
      const timeout = setTimeout(() => setShowNotification(false), 2500);
      const cleanup = setTimeout(() => setNotification(null), 3000);
      return () => {
        clearTimeout(timeout);
        clearTimeout(cleanup);
      };
    }
    return undefined;
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
        version: 0,
      });
    }
  };

  return (
    <header
      className={cn(
        'border-b shadow-sm sticky top-0 z-40 transition-all duration-300 ease-in-out',
        theme === 'dark' ? 'bg-gray-800/95 border-gray-700' : 'bg-white/95 border-gray-200',
        'backdrop-blur-md',
      )}
    >
      <div className="flex justify-between items-center px-4 h-16 sm:px-6">
        {/* Left side - Menu button and logo */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onToggleSidebar}
            className={cn(
              'p-2 rounded-lg transition-all duration-200 cursor-pointer focus-ring hover:scale-105',
              theme === 'dark'
                ? 'text-gray-400 hover:bg-gray-700/80 hover:text-gray-300'
                : 'text-gray-500 hover:bg-gray-100/80 hover:text-gray-700',
            )}
            type="button"
          >
            <Menu className="w-5 h-5 transition-transform duration-200" />
          </button>

          <div className="flex items-center space-x-3">
            <div className="hidden sm:block">
              <h1 className={cn('text-xl font-bold text-gray-900 transition-colors duration-200 dark:text-gray-100')}>Offrows</h1>
              <p className={cn('text-xs transition-colors duration-200', theme === 'dark' ? 'text-gray-400' : 'text-gray-500')}>
                Offline-first project tracker
              </p>
            </div>
          </div>
        </div>

        {/* Center - Search and table info */}
        <div className="hidden flex-1 mx-4 max-w-2xl md:block">
          <div className="relative group">
            <Search
              className={cn(
                'absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 transition-all duration-200',
                theme === 'dark' ? 'text-gray-400 group-focus-within:text-blue-500' : 'text-gray-500 group-focus-within:text-blue-500',
              )}
            />
            <input
              type="text"
              placeholder="Search in table..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                'w-full pl-10 pr-4 py-2 text-sm border rounded-lg transition-all duration-300 ease-in-out',
                theme === 'dark' ? 'bg-gray-700/80 border-gray-600' : 'bg-white/80 border-gray-200',
                theme === 'dark' ? 'text-gray-300' : 'text-gray-900',
                'focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500',
                'hover:border-gray-400 dark:hover:border-gray-500',
              )}
            />
          </div>
        </div>

        {/* Right side - Table info and actions */}
        <div className="flex items-center space-x-2">
          {/* Table info */}
          {activeTable && (
            <div className="hidden items-center mr-4 space-x-3 sm:flex animate-fade-in">
              <div className="text-right">
                <h2 className={cn('text-sm font-medium text-gray-900 transition-colors duration-200 dark:text-gray-100')}>
                  {activeTable.name}
                </h2>
                <p className={'text-xs text-gray-500 transition-colors duration-200 dark:text-gray-400'}>
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
                'p-2 rounded-lg transition-all duration-200 cursor-pointer focus-ring hover:scale-105',
                theme === 'dark'
                  ? 'text-gray-400 hover:bg-gray-700/80 hover:text-gray-300'
                  : 'text-gray-500 hover:bg-gray-100/80 hover:text-gray-700',
              )}
              type="button"
            >
              <Plus className="w-4 h-4 transition-transform duration-200" />
            </button>
            {/* Export and Import buttons */}
            <button
              ref={exportBtnRef}
              onClick={() => setExportMenuOpen((v) => !v)}
              className={cn(
                'p-2 rounded-lg transition-all duration-200 cursor-pointer focus-ring relative hover:scale-105',
                theme === 'dark'
                  ? 'text-gray-400 hover:bg-gray-700/80 hover:text-gray-300'
                  : 'text-gray-500 hover:bg-gray-100/80 hover:text-gray-700',
              )}
              type="button"
            >
              <Download className="w-4 h-4 transition-transform duration-200" />
              {exportMenuOpen && (
                <div className="absolute right-0 z-50 mt-2 w-44 rounded-md border border-gray-200 shadow-lg backdrop-blur-md transition-all duration-200 bg-white/95 dark:bg-gray-800/95 dark:border-gray-700 animate-fade-in-up">
                  <button
                    onClick={handleExportCSV}
                    className={cn(
                      'block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 transition-all duration-200 hover:bg-gray-100/80 dark:hover:bg-gray-700/80 hover:scale-[1.02]',
                    )}
                  >
                    Export as CSV
                  </button>
                  <button
                    onClick={handleExportJSON}
                    className={cn(
                      'block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 transition-all duration-200 hover:bg-gray-100/80 dark:hover:bg-gray-700/80 hover:scale-[1.02]',
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
                'p-2 rounded-lg transition-all duration-200 cursor-pointer focus-ring relative hover:scale-105',
                theme === 'dark'
                  ? 'text-gray-400 hover:bg-gray-700/80 hover:text-gray-300'
                  : 'text-gray-500 hover:bg-gray-100/80 hover:text-gray-700',
              )}
              type="button"
            >
              <Upload className="w-4 h-4 transition-transform duration-200" />
              {importMenuOpen && (
                <div className="absolute right-0 z-50 mt-2 w-44 rounded-md border border-gray-200 shadow-lg backdrop-blur-md transition-all duration-200 bg-white/95 dark:bg-gray-800/95 dark:border-gray-700 animate-fade-in-up">
                  <button
                    onClick={handleImportCSV}
                    className={cn(
                      'block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 transition-all duration-200 hover:bg-gray-100/80 dark:hover:bg-gray-700/80 hover:scale-[1.02]',
                    )}
                  >
                    Import as CSV
                  </button>
                  <button
                    onClick={handleImportJSON}
                    className={cn(
                      'block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 transition-all duration-200 hover:bg-gray-100/80 dark:hover:bg-gray-700/80 hover:scale-[1.02]',
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
      <div className="px-4 pb-4 md:hidden">
        <div className="relative group">
          <Search
            className={cn(
              'absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 transition-all duration-200',
              theme === 'dark' ? 'text-gray-400 group-focus-within:text-blue-500' : 'text-gray-500 group-focus-within:text-blue-500',
            )}
          />
          <input
            type="text"
            placeholder="Search in table..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              'w-full pl-10 pr-4 py-2 text-sm border rounded-lg transition-all duration-300 ease-in-out',
              theme === 'dark' ? 'bg-gray-700/80 border-gray-600' : 'bg-white/80 border-gray-200',
              theme === 'dark' ? 'text-gray-300' : 'text-gray-900',
              'focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500',
              'hover:border-gray-400 dark:hover:border-gray-500',
            )}
          />
        </div>
      </div>

      {/* Render notification in Header as well */}
      {notification && (
        <div
          className={cn(
            'fixed top-6 right-6 z-50 px-4 py-2 rounded-lg shadow-lg text-white font-medium transition-all duration-500 transform backdrop-blur-md',
            showNotification ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-2 scale-95',
            notification.type === 'success' ? 'bg-green-600/90' : 'bg-red-600/90',
          )}
          style={{ pointerEvents: showNotification ? 'auto' : 'none' }}
        >
          {notification.message}
        </div>
      )}
    </header>
  );
}
