'use client';

import { useState, useEffect } from 'react';
import {
  FileText,
  Filter,
  SortAsc,
  Eye,
  Settings,
  Download,
  Upload,
  ChevronDown,
  X,
} from 'lucide-react';
import { useTables } from '@/app/contexts/TableContext';
import { Field, FileValueWithId } from '@/lib/schemas';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';

export default function Toolbar() {
  const { activeTable } = useTables();
  const { rows, addRow } = useAppStore();
  const [isFileMenuOpen, setIsFileMenuOpen] = useState(false);
  const [isViewMenuOpen, setIsViewMenuOpen] = useState(false);
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const fileInputRef =
    useState<HTMLInputElement | null>(null)[0] ||
    (typeof window !== 'undefined' ? document.createElement('input') : null);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  // Auto-hide notification after 3s
  useEffect(() => {
    if (notification) {
      const timeout = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [notification]);

  if (!activeTable) {
    return (
      <div className="px-4 py-3 bg-white border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div className="text-gray-500">No table selected</div>
        </div>
      </div>
    );
  }

  // Helper: get rows for active table
  const tableRows = activeTable ? rows.filter((r) => r.tableId === activeTable.id) : [];

  // Helper: get field order and names
  const fieldIds = activeTable ? activeTable.fields.map((f) => f.id) : [];
  const fieldNames = activeTable ? activeTable.fields.map((f) => f.name) : [];

  // Export CSV
  const handleExportCSV = () => {
    if (!activeTable) return;
    const csvRows = [fieldNames.join(',')];
    for (const row of tableRows) {
      const vals = fieldIds.map((fid) => {
        let v = row.data[fid];
        if (typeof v === 'object' && v !== null) v = JSON.stringify(v);
        return v === undefined || v === null ? '' : String(v).replace(/"/g, '""');
      });
      csvRows.push(vals.map((val) => `"${val}"`).join(','));
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
    setIsFileMenuOpen(false);
  };

  // Export JSON
  const handleExportJSON = () => {
    if (!activeTable) return;
    const data = tableRows.map((row) => {
      const obj: Record<
        string,
        string | number | boolean | FileValueWithId | FileValueWithId[] | null
      > = {};
      for (const fid of fieldIds) {
        const value = row.data[fid];
        if (value !== undefined) {
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
    setIsFileMenuOpen(false);
  };

  // Import CSV
  const handleImportCSV = () => {
    if (!activeTable) return;
    const input = fileInputRef || document.createElement('input');
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
      const firstLine = lines[0];
      if (!firstLine) {
        setNotification({ message: 'Invalid CSV file.', type: 'error' });
        return;
      }
      const headers = firstLine.split(',').map((h) => h.replace(/"/g, '').trim());
      for (let i = 1; i < lines.length; ++i) {
        const line = lines[i];
        if (!line) continue;
        const vals = line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map((v) => v.replace(/^"|"$/g, ''));
        const data: Record<
          string,
          string | number | boolean | FileValueWithId | FileValueWithId[] | null
        > = {};
        headers.forEach((h, idx) => {
          const fieldIdx = headers.indexOf(h);
          if (fieldIdx !== -1 && fieldIdx < fieldIds.length && fieldIds[fieldIdx]) {
            const val = vals[idx];
            if (val !== undefined) {
              data[fieldIds[fieldIdx]!] = val as string;
            }
          }
        });
        await addRow({ tableId: activeTable.id!, data });
      }
      setNotification({ message: 'CSV import complete!', type: 'success' });
      setIsFileMenuOpen(false);
    };
    input.click();
  };

  // Import JSON
  const handleImportJSON = () => {
    if (!activeTable) return;
    const input = fileInputRef || document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = async (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files && target.files[0];
      if (!file) return;
      const text = await file.text();
      let arr: Record<
        string,
        string | number | boolean | FileValueWithId | FileValueWithId[] | null
      >[] = [];
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
          if (Object.prototype.hasOwnProperty.call(obj, fid)) data[fid] = obj[fid] as string;
        }
        await addRow({ tableId: activeTable.id!, data });
      }
      setNotification({ message: 'JSON import complete!', type: 'success' });
      setIsFileMenuOpen(false);
    };
    input.click();
  };

  const handleRowHeightChange = (height: 'compact' | 'default' | 'large') => {
    // // TODO: Implement row height change
    console.log('Row height:', height);
  };

  return (
    <>
      {notification && (
        <div
          className={cn(
            `fixed top-6 right-6 z-50 px-4 py-2 rounded shadow-lg text-white font-medium transition-all ${notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`,
          )}
        >
          {notification.message}
        </div>
      )}
      <div className="px-2 py-2 bg-white border-b border-gray-200 sm:px-4 sm:py-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center sm:gap-0">
          <div className="flex flex-wrap gap-2 items-center">
            {/* File Menu */}
            <div className="relative">
              <button
                onClick={() => setIsFileMenuOpen(!isFileMenuOpen)}
                className={cn(
                  'inline-flex items-center px-3 py-2 text-sm font-medium leading-4 text-gray-700 bg-white rounded-md border border-gray-300 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
                )}
              >
                <FileText className="mr-2 w-4 h-4" />
                File
                <ChevronDown className="ml-2 w-4 h-4" />
              </button>

              {isFileMenuOpen && (
                <div className="absolute left-0 z-50 mt-2 w-56 w-full bg-white rounded-md border border-gray-200 shadow-lg sm:w-56">
                  <div className="py-1">
                    <button
                      onClick={handleImportCSV}
                      className={cn(
                        'block px-4 py-2 w-full text-sm text-left text-gray-700 transition-colors hover:bg-gray-100',
                      )}
                    >
                      <Upload className="inline mr-2 w-4 h-4" />
                      Import CSV
                    </button>
                    <button
                      onClick={handleImportJSON}
                      className={cn(
                        'block px-4 py-2 w-full text-sm text-left text-gray-700 transition-colors hover:bg-gray-100',
                      )}
                    >
                      <Upload className="inline mr-2 w-4 h-4" />
                      Import JSON
                    </button>
                    <div className="my-1 border-t border-gray-200"></div>
                    <button
                      onClick={handleExportCSV}
                      className={cn(
                        'block px-4 py-2 w-full text-sm text-left text-gray-700 transition-colors hover:bg-gray-100',
                      )}
                    >
                      <Download className="inline mr-2 w-4 h-4" />
                      Export CSV
                    </button>
                    <button
                      onClick={handleExportJSON}
                      className={cn(
                        'block px-4 py-2 w-full text-sm text-left text-gray-700 transition-colors hover:bg-gray-100',
                      )}
                    >
                      <Download className="inline mr-2 w-4 h-4" />
                      Export JSON
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* View Options */}
            <div className="relative">
              <button
                onClick={() => setIsViewMenuOpen(!isViewMenuOpen)}
                className={cn(
                  'inline-flex items-center px-3 py-2 text-sm font-medium leading-4 text-gray-700 bg-white rounded-md border border-gray-300 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
                )}
              >
                <Eye className="mr-2 w-4 h-4" />
                View Options
                <ChevronDown className="ml-2 w-4 h-4" />
              </button>

              {isViewMenuOpen && (
                <div className="absolute left-0 z-50 mt-2 w-64 w-full bg-white rounded-md border border-gray-200 shadow-lg sm:w-64">
                  <div className="py-1">
                    <div className="px-4 py-2 text-xs font-medium tracking-wide text-gray-500 uppercase">
                      Hide Fields
                    </div>
                    {activeTable.fields.map((field: Field) => (
                      <label
                        key={field.id}
                        className={cn(
                          'flex items-center px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100',
                        )}
                      >
                        <Checkbox className={cn('mr-3')} />
                        {field.name}
                      </label>
                    ))}
                    <div className="my-1 border-t border-gray-200"></div>
                    <div className="px-4 py-2 text-xs font-medium tracking-wide text-gray-500 uppercase">
                      Row Height
                    </div>
                    <button
                      onClick={() => handleRowHeightChange('compact')}
                      className={cn(
                        'block px-4 py-2 w-full text-sm text-left text-gray-700 transition-colors hover:bg-gray-100',
                      )}
                    >
                      Compact
                    </button>
                    <button
                      onClick={() => handleRowHeightChange('default')}
                      className={cn(
                        'block px-4 py-2 w-full text-sm text-left text-gray-700 transition-colors hover:bg-gray-100',
                      )}
                    >
                      Default
                    </button>
                    <button
                      onClick={() => handleRowHeightChange('large')}
                      className={cn(
                        'block px-4 py-2 w-full text-sm text-left text-gray-700 transition-colors hover:bg-gray-100',
                      )}
                    >
                      Large
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Filter */}
            <div className="relative">
              <button
                onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
                className={cn(
                  'inline-flex items-center px-3 py-2 text-sm font-medium leading-4 text-gray-700 bg-white rounded-md border border-gray-300 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
                )}
              >
                <Filter className="mr-2 w-4 h-4" />
                Filter
                <ChevronDown className="ml-2 w-4 h-4" />
              </button>

              {isFilterMenuOpen && (
                <div className="absolute left-0 z-50 mt-2 w-80 w-full bg-white rounded-md border border-gray-200 shadow-lg sm:w-80">
                  <div className="p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-sm font-medium text-gray-900">Add Filter</h3>
                      <button
                        onClick={() => setIsFilterMenuOpen(false)}
                        className={cn('text-gray-400 hover:text-gray-600')}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="block mb-1 text-xs font-medium text-gray-700">
                          Field
                        </label>
                        <select
                          className={cn(
                            'px-3 py-2 w-full text-sm rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500',
                          )}
                        >
                          <option>Select a field</option>
                          {activeTable.fields.map((field: Field) => (
                            <option key={field.id} value={field.id}>
                              {field.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block mb-1 text-xs font-medium text-gray-700">
                          Operator
                        </label>
                        <select
                          className={cn(
                            'px-3 py-2 w-full text-sm rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500',
                          )}
                        >
                          <option>equals</option>
                          <option>contains</option>
                          <option>greater than</option>
                          <option>less than</option>
                        </select>
                      </div>
                      <div>
                        <label className="block mb-1 text-xs font-medium text-gray-700">
                          Value
                        </label>
                        <input
                          type="text"
                          className={cn(
                            'px-3 py-2 w-full text-sm rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500',
                          )}
                          placeholder="Enter value"
                        />
                      </div>
                      <button
                        className={cn(
                          'px-4 py-2 w-full text-sm font-medium text-white bg-blue-600 rounded-md transition-colors hover:bg-blue-700',
                        )}
                      >
                        Add Filter
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sort */}
            <div className="relative">
              <button
                onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
                className={cn(
                  'inline-flex items-center px-3 py-2 text-sm font-medium leading-4 text-gray-700 bg-white rounded-md border border-gray-300 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
                )}
              >
                <SortAsc className="mr-2 w-4 h-4" />
                Sort
                <ChevronDown className="ml-2 w-4 h-4" />
              </button>

              {isSortMenuOpen && (
                <div className="absolute left-0 z-50 mt-2 w-64 w-full bg-white rounded-md border border-gray-200 shadow-lg sm:w-64">
                  <div className="p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-sm font-medium text-gray-900">Sort Rules</h3>
                      <button
                        onClick={() => setIsSortMenuOpen(false)}
                        className={cn('text-gray-400 hover:text-gray-600')}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="block mb-1 text-xs font-medium text-gray-700">
                          Sort by
                        </label>
                        <select
                          className={cn(
                            'px-3 py-2 w-full text-sm rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500',
                          )}
                        >
                          <option>Select a field</option>
                          {activeTable.fields.map((field: Field) => (
                            <option key={field.id} value={field.id}>
                              {field.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block mb-1 text-xs font-medium text-gray-700">
                          Order
                        </label>
                        <select
                          className={cn(
                            'px-3 py-2 w-full text-sm rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500',
                          )}
                        >
                          <option value="asc">Ascending</option>
                          <option value="desc">Descending</option>
                        </select>
                      </div>
                      <button
                        className={cn(
                          'px-4 py-2 w-full text-sm font-medium text-white bg-blue-600 rounded-md transition-colors hover:bg-blue-700',
                        )}
                      >
                        Add Sort Rule
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2 items-center mt-2 sm:mt-0">
            <button
              className={cn(
                'inline-flex items-center px-3 py-2 text-sm font-medium leading-4 text-gray-700 bg-white rounded-md border border-gray-300 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
              )}
            >
              <Settings className="mr-2 w-4 h-4" />
              Settings
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
