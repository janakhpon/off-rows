'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { DataGrid, RenderCellProps } from 'react-data-grid';
import { Plus, Trash2, AlertTriangle } from 'lucide-react';
import { useTables } from '../contexts/TableContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAppStore } from '@/lib/store';
import { Field, TableRow, FileValueWithId } from '@/lib/schemas';
import AddColumnModal from './modals/AddColumnModal';
import DeleteColumnModal from './modals/DeleteColumnModal';
import { fileOperations } from '@/lib/database';

type DataGridRow = { id: number; data: Record<string, string | number | boolean | FileValueWithId | null> };

const getColumnWidth = (fieldType: string) => {
  switch (fieldType) {
    case 'text': return 200;
    case 'number': return 120;
    case 'boolean': return 100;
    case 'date': return 150;
    case 'dropdown': return 150;
    case 'image': return 120;
    case 'file': return 120;
    default: return 150;
  }
};

export default function DataGridComponent() {
  const { activeTable, refreshTables, setActiveTable } = useTables();
  const { theme } = useTheme();
  const { rows, addRow, updateRow, deleteRow, addColumn, deleteColumn, updateColWidths, updateRowHeights, deleteTable } = useAppStore();
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [showDeleteColumn, setShowDeleteColumn] = useState(false);
  const [columnToDelete, setColumnToDelete] = useState<Field | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteType, setDeleteType] = useState<'rows' | 'table' | null>(null);

  // --- ROW ORDER STATE ---
  const [rowOrder, setRowOrder] = useState<number[]>([]);
  useEffect(() => {
    if (rows.length > 0) {
      setRowOrder((prev) => {
        if (prev.length !== rows.length || !prev.every((id, i) => id === rows[i].id)) {
          return rows.map((r) => r.id!);
        }
        return prev;
      });
    }
  }, [rows]);

  // Helper to get rows in original order
  const orderedRows = useMemo(() => {
    if (!rowOrder.length) return rows;
    const rowMap = Object.fromEntries(rows.map(r => [r.id!, r]));
    return rowOrder.map(id => rowMap[id]).filter(Boolean);
  }, [rows, rowOrder]);

  // --- COLUMN WIDTH STATE (PERSISTED IN DB) ---
  const defaultColWidth = 140;
  const [colWidths, setColWidths] = useState<Record<string, number>>({});
  useEffect(() => {
    if (activeTable && activeTable.colWidths) setColWidths(activeTable.colWidths);
  }, [activeTable]);
  
  useEffect(() => {
    if (activeTable) updateColWidths(activeTable.id!, colWidths);
  }, [colWidths, activeTable, updateColWidths]);

  // --- ROW HEIGHT STATE (PERSISTED IN DB) ---
  const [rowHeights, setRowHeights] = useState<Record<string, number>>({});
  useEffect(() => {
    if (activeTable && activeTable.rowHeights) setRowHeights(activeTable.rowHeights);
  }, [activeTable]);
  
  useEffect(() => {
    if (activeTable) updateRowHeights(activeTable.id!, rowHeights);
  }, [rowHeights, activeTable, updateRowHeights]);

  // Helper to get column width
  const getColWidth = (fieldId: string, fieldType?: string) =>
    colWidths[fieldId] || (fieldType ? getColumnWidth(fieldType) : defaultColWidth);

  // Add state for file URLs
  const [fileUrls, setFileUrls] = useState<Record<number, string>>({});

  // Helper to get object URL for a fileId
  const getFileUrl = (fileId?: number): string | undefined => {
    if (!fileId) return undefined;
    return fileUrls[fileId];
  };

  // Fetch and cache file blob URLs
  const fetchAndCacheFileUrl = async (fileId: number) => {
    if (fileUrls[fileId]) return;
    const file = await fileOperations.getFileById(fileId);
    if (file) {
      const url = URL.createObjectURL(file.blob);
      setFileUrls(prev => ({ ...prev, [fileId]: url }));
    }
  };

  // --- DELETE FUNCTIONALITY ---
  const handleDeleteRows = async () => {
    const rowsToDelete = Array.from(selectedRows);
    for (const rowId of rowsToDelete) {
      await deleteRow(rowId);
    }
    setSelectedRows(new Set());
    setShowDeleteConfirm(false);
    setDeleteType(null);
  };

  const handleDeleteTable = async () => {
    if (activeTable) {
      // Delete the entire table using the store function
      await deleteTable(activeTable.id!);
      setShowDeleteConfirm(false);
      setDeleteType(null);
    }
  };

  const confirmDelete = (type: 'rows' | 'table') => {
    setDeleteType(type);
    setShowDeleteConfirm(true);
  };

  // --- REACT-DATA-GRID COLUMNS ---
  const [imageModal, setImageModal] = useState<{ url: string; name: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const columns = useMemo(() => {
    if (!activeTable) return [];
    return activeTable.fields.map((field) => ({
      key: field.id,
      name: field.name,
      width: getColWidth(field.id, field.type),
      resizable: true,
      renderCell: ({ row }: RenderCellProps<DataGridRow>) => {
        const value = row.data[field.id];
        switch (field.type) {
          case 'dropdown':
            return <span className="cell-dropdown">{typeof value === 'string' ? value : 'None'}</span>;
          case 'boolean':
            return (
              <span className="cell-checkbox">
                <input
                  type="checkbox"
                  checked={!!value}
                  onChange={e => {
                    // Update the boolean value in the DB/store
                    updateRow(row.id, { data: { ...row.data, [field.id]: e.target.checked } });
                  }}
                  aria-label={field.name}
                />
              </span>
            );
          case 'image': {
            if (value && typeof value === 'object' && !Array.isArray(value) && 'fileId' in value) {
              const v = value as FileValueWithId;
              const imgUrl = getFileUrl(v.fileId);
              return imgUrl ? (
                <>
                  <img
                    src={imgUrl}
                    alt={v.name}
                    className="cursor-pointer cell-img"
                    onClick={() => setImageModal({ url: imgUrl, name: v.name })}
                  />
                </>
              ) : <span className="cell-none">None</span>;
            }
            // If empty, show upload button
            return (
              <>
                <button
                  className="text-xs text-blue-600 underline"
                  onClick={() => fileInputRef.current?.click()}
                  type="button"
                >
                  Upload
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      // Save file to IndexedDB and update row
                      const fileId = await fileOperations.addFile(file);
                      updateRow(row.id, { data: { ...row.data, [field.id]: { fileId, name: file.name, type: file.type } } });
                    }
                  }}
                />
              </>
            );
          }
          case 'file': {
            if (!value || typeof value !== 'object' || Array.isArray(value) || !('fileId' in value)) {
              return <span className="cell-none">None</span>;
            }
            const fileValue = value as FileValueWithId;
            const fileUrl = getFileUrl(fileValue.fileId);
            return fileUrl ? (
              <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="cell-link">{fileValue.name}</a>
            ) : <span className="cell-none">None</span>;
          }
          case 'date': {
            return (
              <input
                type="date"
                className="w-full text-center bg-transparent border-none focus:ring-0"
                value={typeof value === 'string' ? value : ''}
                onChange={e => updateRow(row.id, { data: { ...row.data, [field.id]: e.target.value } })}
                style={{ minWidth: 100 }}
              />
            );
          }
          case 'number': {
            return (
              <input
                type="number"
                className="w-full text-right bg-transparent border-none cell-number focus:ring-0"
                value={typeof value === 'number' ? value : ''}
                onChange={e => {
                  const num = e.target.value === '' ? null : Number(e.target.value);
                  updateRow(row.id, { data: { ...row.data, [field.id]: num } });
                }}
                style={{ minWidth: 60 }}
              />
            );
          }
          default:
            if (field.id === 'devilfruit') {
              if (!value || typeof value !== 'string' || value === 'None') return <span className="badge">None</span>;
              let badgeClass = 'badge';
              if (value.includes('Gum') || value.includes('Hana')) badgeClass += ' green';
              else if (value.includes('Hito')) badgeClass += ' yellow';
              else badgeClass += ' blue';
              return <span className={badgeClass}>{value}</span>;
            }
            if (field.id === 'crew' || field.id === 'memberName' || field.id === 'crewName') {
              return <span className="cell-crew">{typeof value === 'string' ? value : ''}</span>;
            }
            if (field.id === 'summary') {
              return <span className="cell-summary">{typeof value === 'string' ? value : ''}</span>;
            }
            if (typeof value === 'string' || typeof value === 'number') {
              return <span>{value}</span>;
            }
            return <span />;
        }
      }
    }));
  }, [activeTable, theme, getColWidth, getFileUrl, updateRow]);

  // --- REACT-DATA-GRID ROWS ---
  const gridRows = useMemo(() => {
    return orderedRows.map((row) => ({
      id: row.id!,
      data: row.data,
      ...row.data
    })) as DataGridRow[];
  }, [orderedRows]);

  // --- REACT-DATA-GRID EVENTS ---
  const handleRowsChange = async (newRows: DataGridRow[]) => {
    for (const newRow of newRows) {
      const originalRow = orderedRows.find(r => r.id === newRow.id);
      if (originalRow && JSON.stringify(originalRow.data) !== JSON.stringify(newRow.data)) {
        await updateRow(newRow.id, { data: newRow.data });
      }
    }
  };

  const handleAddRow = async () => {
    if (!activeTable) return;

    const newRow: Omit<TableRow, 'id' | 'createdAt' | 'updatedAt'> = {
      tableId: activeTable.id!,
      data: activeTable.fields.reduce((acc, field) => {
        if (field.type === 'image' || field.type === 'file') {
          if (field.defaultValue && typeof field.defaultValue === 'object' && !Array.isArray(field.defaultValue) && 'fileId' in field.defaultValue) {
            acc[field.id] = field.defaultValue as FileValueWithId;
          } else {
            acc[field.id] = null;
          }
        } else {
          acc[field.id] = field.defaultValue || null;
        }
        return acc;
      }, {} as Record<string, string | number | boolean | FileValueWithId | null>),
    };

    await addRow(newRow);
  };

  const confirmDeleteColumn = async () => {
    if (columnToDelete) {
      await deleteColumn(columnToDelete.id);
      setShowDeleteColumn(false);
      setColumnToDelete(null);
    }
  };

  useEffect(() => {
    const fileIds: number[] = [];
    orderedRows.forEach(row => {
      if (!activeTable) return;
      activeTable.fields.forEach(field => {
        const val = row.data[field.id];
        if (val && typeof val === 'object' && 'fileId' in val && typeof val.fileId === 'number') {
          fileIds.push(val.fileId);
        }
      });
    });
    fileIds.forEach(id => { if (!fileUrls[id]) fetchAndCacheFileUrl(id); });
  }, [orderedRows, activeTable, fileUrls]);

  const [rowHeight, setRowHeight] = useState(36); // default: medium

  if (!activeTable) {
    return (
      <div className="flex overflow-auto flex-grow justify-center items-center">
        <div className="text-center">
          <div 
            className="mb-2 text-lg"
            style={{
              color: theme === 'dark' ? '#6b7280' : '#6b7280'
            }}
          >
            No table selected
          </div>
          <p 
            style={{
              color: theme === 'dark' ? '#9ca3af' : '#9ca3af'
            }}
          >
            Please select a table from the sidebar to view data
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex overflow-auto flex-col flex-grow min-w-0">
      {/* Modals */}
      <AddColumnModal 
        open={showAddColumn} 
        onClose={() => setShowAddColumn(false)}
        onAddColumn={async (field) => {
          await addColumn(field);
          await refreshTables();
          const updated = (await refreshTables(), activeTable && (await refreshTables(), activeTable.id) ? (useAppStore.getState().tables.find(t => t.id === activeTable.id) || activeTable) : activeTable);
          setActiveTable(updated);
          setShowAddColumn(false);
        }}
      />
      <DeleteColumnModal
        open={showDeleteColumn}
        onClose={() => {
          setShowDeleteColumn(false);
          setColumnToDelete(null);
        }}
        onConfirm={confirmDeleteColumn}
        columnName={columnToDelete?.name || ''}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="flex fixed inset-0 z-50 justify-center items-center bg-black bg-opacity-50">
          <div 
            className="p-6 mx-4 w-96 max-w-md rounded-lg"
            style={{
              backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff'
            }}
          >
            <div className="flex items-center mb-4">
              <AlertTriangle className="mr-3 w-6 h-6" style={{ color: theme === 'dark' ? '#f59e0b' : '#f59e0b' }} />
              <h2 
                className="text-lg font-semibold"
                style={{
                  color: theme === 'dark' ? '#f9fafc' : '#111827'
                }}
              >
                Confirm Delete
              </h2>
            </div>
            <p 
              className="mb-4"
              style={{
                color: theme === 'dark' ? '#d1d5db' : '#374151'
              }}
            >
              {deleteType === 'rows' 
                ? `Are you sure you want to delete ${selectedRows.size} selected row(s)? This action cannot be undone.`
                : 'Are you sure you want to delete this entire table? This action cannot be undone.'
              }
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteType(null);
                }}
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
                onClick={deleteType === 'rows' ? handleDeleteRows : handleDeleteTable}
                className="px-4 py-2 text-sm font-medium text-white rounded-md transition-colors"
                style={{
                  backgroundColor: theme === 'dark' ? '#dc2626' : '#dc2626'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = theme === 'dark' ? '#b91c1c' : '#b91c1c';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = theme === 'dark' ? '#dc2626' : '#dc2626';
                }}
                type="button"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {imageModal && (
        <div className="flex fixed inset-0 z-50 justify-center items-center bg-black bg-opacity-60">
          <div className="flex flex-col items-center p-4 w-full max-w-lg bg-white rounded-lg shadow-lg dark:bg-gray-900">
            <img src={imageModal.url} alt={imageModal.name} className="mb-4 max-w-full max-h-96" />
            <div className="mb-2 text-sm text-center">{imageModal.name}</div>
            <button
              className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
              onClick={() => setImageModal(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div 
        className="flex justify-between items-center p-4 border-b"
        style={{
          borderColor: theme === 'dark' ? '#475569' : '#e5e7eb',
          backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff'
        }}
      >
        <div className="flex items-center space-x-2">
          <button
            onClick={handleAddRow}
            className="flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors"
            style={{
              backgroundColor: theme === 'dark' ? '#1e3a8a' : '#dbeafe',
              color: theme === 'dark' ? '#93c5fd' : '#1d4ed8'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme === 'dark' ? '#1e40af' : '#bfdbfe';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = theme === 'dark' ? '#1e3a8a' : '#dbeafe';
            }}
            type="button"
          >
            <Plus className="mr-1 w-4 h-4" /> Add Row
          </button>
          
          {selectedRows.size > 0 && (
            <button
              onClick={() => confirmDelete('rows')}
              className="flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors"
              style={{
                backgroundColor: theme === 'dark' ? '#dc2626' : '#fef2f2',
                color: theme === 'dark' ? '#fca5a5' : '#dc2626'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme === 'dark' ? '#b91c1c' : '#fee2e2';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = theme === 'dark' ? '#dc2626' : '#fef2f2';
              }}
              type="button"
            >
              <Trash2 className="mr-1 w-4 h-4" /> Delete {selectedRows.size} Row{selectedRows.size > 1 ? 's' : ''}
            </button>
          )}
          {/* Row Height Dropdown */}
          <label className="ml-4 text-xs text-gray-500">Row height:</label>
          <select
            value={rowHeight}
            onChange={e => setRowHeight(Number(e.target.value))}
            className="px-2 py-1 text-xs rounded border focus:outline-none focus:ring-2 focus:ring-blue-400"
            style={{ minWidth: 80 }}
          >
            <option value={28}>Small</option>
            <option value={36}>Medium</option>
            <option value={48}>Large</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowAddColumn(true)}
            className="flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors"
            style={{
              backgroundColor: theme === 'dark' ? '#1e3a8a' : '#dbeafe',
              color: theme === 'dark' ? '#93c5fd' : '#1d4ed8'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme === 'dark' ? '#1e40af' : '#bfdbfe';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = theme === 'dark' ? '#1e3a8a' : '#dbeafe';
            }}
            type="button"
          >
            <Plus className="mr-1 w-4 h-4" /> Add Column
          </button>
          
          <button
            onClick={() => confirmDelete('table')}
            className="flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors"
            style={{
              backgroundColor: theme === 'dark' ? '#dc2626' : '#fef2f2',
              color: theme === 'dark' ? '#fca5a5' : '#dc2626'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme === 'dark' ? '#b91c1c' : '#fee2e2';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = theme === 'dark' ? '#dc2626' : '#fef2f2';
            }}
            type="button"
          >
            <Trash2 className="mr-1 w-4 h-4" /> Delete Table
          </button>
        </div>
      </div>

      {/* Data Grid */}
      <div className="flex-1">
        <DataGrid
          columns={columns}
          rows={gridRows}
          onRowsChange={handleRowsChange}
          selectedRows={selectedRows}
          onSelectedRowsChange={setSelectedRows}
          rowHeight={rowHeight}
          style={{
            backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
            color: theme === 'dark' ? '#f9fafc' : '#111827'
          }}
          className="rdg-custom"
        />
      </div>
      {/* Add Row Button at Bottom Left */}
      <div className="flex items-center p-2" style={{ minHeight: 40 }}>
        <button
          onClick={handleAddRow}
          className="flex items-center px-3 py-1 text-sm font-medium bg-white rounded-md border border-gray-200 shadow-sm hover:bg-gray-50"
          style={{ color: '#2563eb' }}
        >
          + Add
        </button>
      </div>
    </div>
  );
} 