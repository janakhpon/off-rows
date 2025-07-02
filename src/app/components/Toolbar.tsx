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
  X
} from 'lucide-react';
import { useTables } from '../contexts/TableContext';
import { Field } from '@/lib/schemas';
import { useAppStore } from '@/lib/store';

export default function Toolbar() {
  const { activeTable } = useTables();
  const { rows, addRow } = useAppStore();
  const [isFileMenuOpen, setIsFileMenuOpen] = useState(false);
  const [isViewMenuOpen, setIsViewMenuOpen] = useState(false);
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const fileInputRef = useState<HTMLInputElement | null>(null)[0] || (typeof window !== 'undefined' ? document.createElement('input') : null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Auto-hide notification after 3s
  useEffect(() => {
    if (notification) {
      const timeout = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timeout);
    }
  }, [notification]);

  if (!activeTable) {
    return (
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="text-gray-500">No table selected</div>
        </div>
      </div>
    );
  }

  // Helper: get rows for active table
  const tableRows = activeTable ? rows.filter(r => r.tableId === activeTable.id) : [];

  // Helper: get field order and names
  const fieldIds = activeTable ? activeTable.fields.map(f => f.id) : [];
  const fieldNames = activeTable ? activeTable.fields.map(f => f.name) : [];

  // Export CSV
  const handleExportCSV = () => {
    if (!activeTable) return;
    const csvRows = [fieldNames.join(',')];
    for (const row of tableRows) {
      const vals = fieldIds.map(fid => {
        let v = row.data[fid];
        if (typeof v === 'object' && v !== null) v = JSON.stringify(v);
        return v === undefined || v === null ? '' : String(v).replace(/"/g, '""');
      });
      csvRows.push(vals.map(val => `"${val}"`).join(','));
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
    const data = tableRows.map(row => {
      const obj: Record<string, any> = {};
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
      const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
      for (let i = 1; i < lines.length; ++i) {
        const vals = lines[i].split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map(v => v.replace(/^"|"$/g, ''));
        const data: Record<string, string | number | boolean | import('@/lib/schemas').FileValueWithId | import('@/lib/schemas').FileValueWithId[] | null> = {};
        headers.forEach((h, idx) => {
          const fieldIdx = headers.indexOf(h);
          if (fieldIdx !== -1 && fieldIdx < fieldIds.length) {
            data[fieldIds[fieldIdx]] = vals[idx] as string;
          }
        });
        await addRow({ tableId: activeTable.id, data });
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
      let arr: Record<string, string | number | boolean | import('@/lib/schemas').FileValueWithId | import('@/lib/schemas').FileValueWithId[] | null>[] = [];
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
        const data: Record<string, string | number | boolean | import('@/lib/schemas').FileValueWithId | import('@/lib/schemas').FileValueWithId[] | null> = {};
        for (const fid of fieldIds) {
          if (Object.prototype.hasOwnProperty.call(obj, fid)) data[fid] = obj[fid] as string;
        }
        await addRow({ tableId: activeTable.id, data });
      }
      setNotification({ message: 'JSON import complete!', type: 'success' });
      setIsFileMenuOpen(false);
    };
    input.click();
  };

  const handleRowHeightChange = (height: 'compact' | 'default' | 'large') => {
    // TODO: Implement row height change
    console.log('Row height:', height);
  };

  return (
    <>
      {notification && (
        <div className={`fixed top-6 right-6 z-50 px-4 py-2 rounded shadow-lg text-white font-medium transition-all ${notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {notification.message}
        </div>
      )}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {/* File Menu */}
            <div className="relative">
              <button
                onClick={() => setIsFileMenuOpen(!isFileMenuOpen)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <FileText className="mr-2 h-4 w-4" />
                File
                <ChevronDown className="ml-2 h-4 w-4" />
              </button>
              
              {isFileMenuOpen && (
                <div className="absolute left-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                  <div className="py-1">
                    <button
                      onClick={handleImportCSV}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <Upload className="inline mr-2 h-4 w-4" />
                      Import CSV
                    </button>
                    <button
                      onClick={handleImportJSON}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <Upload className="inline mr-2 h-4 w-4" />
                      Import JSON
                    </button>
                    <div className="border-t border-gray-200 my-1"></div>
                    <button
                      onClick={handleExportCSV}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <Download className="inline mr-2 h-4 w-4" />
                      Export CSV
                    </button>
                    <button
                      onClick={handleExportJSON}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <Download className="inline mr-2 h-4 w-4" />
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
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <Eye className="mr-2 h-4 w-4" />
                View Options
                <ChevronDown className="ml-2 h-4 w-4" />
              </button>
              
              {isViewMenuOpen && (
                <div className="absolute left-0 mt-2 w-64 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                  <div className="py-1">
                    <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Hide Fields
                    </div>
                    {activeTable.fields.map((field: Field) => (
                      <label key={field.id} className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                        <input type="checkbox" className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                        {field.name}
                      </label>
                    ))}
                    <div className="border-t border-gray-200 my-1"></div>
                    <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Row Height
                    </div>
                    <button
                      onClick={() => handleRowHeightChange('compact')}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      Compact
                    </button>
                    <button
                      onClick={() => handleRowHeightChange('default')}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      Default
                    </button>
                    <button
                      onClick={() => handleRowHeightChange('large')}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
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
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <Filter className="mr-2 h-4 w-4" />
                Filter
                <ChevronDown className="ml-2 h-4 w-4" />
              </button>
              
              {isFilterMenuOpen && (
                <div className="absolute left-0 mt-2 w-80 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-gray-900">Add Filter</h3>
                      <button
                        onClick={() => setIsFilterMenuOpen(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Field</label>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                          <option>Select a field</option>
                          {activeTable.fields.map((field: Field) => (
                            <option key={field.id} value={field.id}>{field.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Operator</label>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                          <option>equals</option>
                          <option>contains</option>
                          <option>greater than</option>
                          <option>less than</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Value</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter value"
                        />
                      </div>
                      <button className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors">
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
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <SortAsc className="mr-2 h-4 w-4" />
                Sort
                <ChevronDown className="ml-2 h-4 w-4" />
              </button>
              
              {isSortMenuOpen && (
                <div className="absolute left-0 mt-2 w-64 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-gray-900">Sort Rules</h3>
                      <button
                        onClick={() => setIsSortMenuOpen(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Sort by</label>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                          <option>Select a field</option>
                          {activeTable.fields.map((field: Field) => (
                            <option key={field.id} value={field.id}>{field.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Order</label>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                          <option value="asc">Ascending</option>
                          <option value="desc">Descending</option>
                        </select>
                      </div>
                      <button className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors">
                        Add Sort Rule
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </button>
          </div>
        </div>
      </div>
    </>
  );
} 