'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { DataGrid, RenderCellProps } from 'react-data-grid';
import { Plus, Trash2, AlertTriangle } from 'lucide-react';
import { useTables } from '../contexts/TableContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAppStore } from '@/lib/store';
import { Field, TableRow, FileValueWithId, Table } from '@/lib/schemas';
import AddColumnModal from './modals/AddColumnModal';
import DeleteColumnModal from './modals/DeleteColumnModal';
import { fileOperations } from '@/lib/database';
import TextCellEditor from './celleditors/TextCellEditor';
import NumberCellEditor from './celleditors/NumberCellEditor';
import DateCellEditor from './celleditors/DateCellEditor';
import BooleanCellEditor from './celleditors/BooleanCellEditor';
import DropdownCellEditor from './celleditors/DropdownCellEditor';
import FileCellEditor from './celleditors/FileCellEditor';
import ImagesCellEditor from './celleditors/ImagesCellEditor';
import FilesCellEditor from './celleditors/FilesCellEditor';
import ImageCellEditor from './celleditors/ImageCellEditor';

type DataGridRow = { id: number; data: Record<string, string | number | boolean | FileValueWithId | FileValueWithId[] | null> };

/**
 * Get default column width based on field type
 */
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

// Pure utility functions
const createEmptySet = () => new Set<number>();
const createEmptyArray = () => [];
const createEmptyObject = () => ({});

// Pure function to get column width with fallback
const getColumnWidthWithFallback = (
  colWidths: Record<string, number>,
  fieldId: string,
  fieldType: string,
  defaultWidth: number
) => colWidths[fieldId] || getColumnWidth(fieldType) || defaultWidth;

// Pure function to transform rows for grid
const transformRowsForGrid = (orderedRows: TableRow[]): DataGridRow[] =>
  orderedRows.map((row) => ({
    id: row.id!,
    data: row.data,
    ...row.data,
  }));

// Pure function to create new row data
const createNewRowData = (activeTable: Table): Record<string, string | number | boolean | FileValueWithId | FileValueWithId[] | null> =>
  activeTable.fields.reduce((acc: Record<string, string | number | boolean | FileValueWithId | FileValueWithId[] | null>, field: Field) => {
    if (field.type === 'images' || field.type === 'files') {
      acc[field.id] = Array.isArray(field.defaultValue) ? field.defaultValue : [];
    } else if (field.type === 'image' || field.type === 'file') {
      if (field.defaultValue && typeof field.defaultValue === 'object' && !Array.isArray(field.defaultValue) && 'fileId' in field.defaultValue) {
        acc[field.id] = field.defaultValue as FileValueWithId;
      } else {
        acc[field.id] = null;
      }
    } else {
      acc[field.id] = field.defaultValue || null;
    }
    return acc;
  }, {});

/**
 * Main DataGrid component for displaying and editing table data
 * Features:
 * - Resizable columns and rows with persistence
 * - File/image upload and preview
 * - Row selection and bulk operations
 * - Modal dialogs with keyboard navigation
 * - Offline-first with IndexedDB storage
 */
export default function DataGridComponent() {
  const { activeTable, refreshTables, setActiveTable } = useTables();
  const { theme } = useTheme();
  const { rows, addRow, updateRow, deleteRow, addColumn, deleteColumn, updateColWidths, updateRowHeights, deleteTable } = useAppStore();
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [showDeleteColumn, setShowDeleteColumn] = useState(false);
  const [columnToDelete, setColumnToDelete] = useState<Field | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(createEmptySet());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteType, setDeleteType] = useState<'rows' | 'table' | null>(null);

  // --- ROW ORDER STATE ---
  // Maintain row order for consistent display and drag-and-drop support
  const [rowOrder, setRowOrder] = useState<number[]>(createEmptyArray());
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

  // Helper to get rows in original order for consistent rendering
  const orderedRows = useMemo(() => {
    if (!rowOrder.length) return rows;
    const rowMap = Object.fromEntries(rows.map(r => [r.id!, r]));
    return rowOrder.map(id => rowMap[id]).filter(Boolean);
  }, [rows, rowOrder]);

  // --- COLUMN WIDTH STATE (PERSISTED IN DB) ---
  // Column widths are persisted in the database for consistent layout
  const defaultColWidth = 140;
  const [colWidths, setColWidths] = useState<Record<string, number>>(createEmptyObject());
  useEffect(() => {
    if (activeTable && activeTable.colWidths) setColWidths(activeTable.colWidths);
  }, [activeTable]);
  
  useEffect(() => {
    if (activeTable) updateColWidths(activeTable.id!, colWidths);
  }, [colWidths, activeTable, updateColWidths]);

  // --- ROW HEIGHT STATE (PERSISTED IN DB) ---
  // Row heights are persisted in the database for consistent layout
  const [rowHeights, setRowHeights] = useState<Record<string, number>>(createEmptyObject());
  useEffect(() => {
    if (activeTable && activeTable.rowHeights) setRowHeights(activeTable.rowHeights);
  }, [activeTable]);
  
  useEffect(() => {
    if (activeTable) updateRowHeights(activeTable.id!, rowHeights);
  }, [rowHeights, activeTable, updateRowHeights]);

  // Helper to get column width with fallback to default
  const getColWidth = useCallback((fieldId: string, fieldType?: string) =>
    getColumnWidthWithFallback(colWidths, fieldId, fieldType || '', defaultColWidth), [colWidths]);

  // Add state for file URLs
  // Cache file blob URLs for efficient rendering and preview
  const [fileUrls, setFileUrls] = useState<Record<number, string>>(createEmptyObject());

  // Helper to get object URL for a fileId from cache
  const getFileUrl = useCallback((fileId?: number): string | undefined => {
    if (!fileId) return undefined;
    return fileUrls[fileId];
  }, [fileUrls]);

  // Fetch and cache file blob URLs for offline access
  const fetchAndCacheFileUrl = useCallback(async (fileId: number) => {
    if (fileUrls[fileId]) return;
    const file = await fileOperations.getFileById(fileId);
    if (file) {
      const url = URL.createObjectURL(file.blob);
      setFileUrls(prev => ({ ...prev, [fileId]: url }));
    }
  }, [fileUrls]);

  // Ensure all fileIds in images/files fields are cached for display
  useEffect(() => {
    if (!activeTable) return;
    const fileIds: number[] = [];
    rows.forEach((row: TableRow) => {
      activeTable.fields.forEach((field: Field) => {
        const val = row.data[field.id];
        if (field.type === 'images' || field.type === 'files') {
          if (Array.isArray(val)) {
            val.forEach((v) => {
              if (v && typeof v === 'object' && 'fileId' in v && typeof v.fileId === 'number') {
                fileIds.push(v.fileId);
              }
            });
          }
        } else if ((field.type === 'image' || field.type === 'file') && val && typeof val === 'object' && 'fileId' in val && typeof val.fileId === 'number') {
          fileIds.push(val.fileId);
        }
      });
    });
    fileIds.forEach((id) => fetchAndCacheFileUrl(id));
  }, [rows, activeTable, fetchAndCacheFileUrl]);

  // --- DELETE FUNCTIONALITY ---
  // Delete selected rows with notification feedback
  const handleDeleteRows = async () => {
    const rowsToDelete = Array.from(selectedRows);
    try {
      for (const rowId of rowsToDelete) {
        await deleteRow(rowId);
      }
      setSelectedRows(createEmptySet());
      setShowDeleteConfirm(false);
      setDeleteType(null);
    } catch {
      // Error handling removed with notification system
    }
  };

  // Delete entire table with notification feedback
  const handleDeleteTable = async () => {
    if (activeTable) {
      try {
        await deleteTable(activeTable.id!);
        setShowDeleteConfirm(false);
        setDeleteType(null);
      } catch {
        // Error handling removed with notification system
      }
    }
  };

  // Show delete confirmation modal
  const confirmDelete = (type: 'rows' | 'table') => {
    setDeleteType(type);
    setShowDeleteConfirm(true);
  };

  // --- REACT-DATA-GRID COLUMNS ---
  // State for image preview modal
  const [imageModal, setImageModal] = useState<{ url: string; name: string } | null>(null);
  // Generate columns with cell editors based on field type
  const columns = useMemo(() => {
    if (!activeTable) return [];
    return activeTable.fields.map((field) => ({
      key: field.id,
      name: field.name,
      width: getColWidth(field.id, field.type),
      resizable: true,
      renderCell: ({ row }: RenderCellProps<DataGridRow>) => {
        const value = row.data[field.id];
        // Custom field ID rendering for Airtable-like look
        if (field.id === 'crew' || field.id === 'memberName' || field.id === 'crewName') {
          return (
            <span className="badge" title={typeof value === 'string' ? value : ''}>
              {typeof value === 'string' ? value : ''}
            </span>
          );
        }
        if (field.id === 'summary') {
          return (
            <span className="cell-summary" title={typeof value === 'string' ? value : ''}>
              {typeof value === 'string' ? value : ''}
            </span>
          );
        }
        if (field.id === 'crew_img' || field.id === 'avatar') {
          // Render as rounded avatar
          if (typeof value === 'string' && value) {
            return <img src={value} alt="avatar" className="cell-avatar" aria-label={field.name} title="Click to preview" />;
          }
          if (value && typeof value === 'object' && 'fileId' in value && getFileUrl(value.fileId)) {
            return <img src={getFileUrl(value.fileId)} alt="avatar" className="cell-avatar" aria-label={field.name} title="Click to preview" />;
          }
          return <span className="cell-none">None</span>;
        }
        // Default field type rendering
        switch (field.type) {
          case 'text':
            return (
              <TextCellEditor
                value={typeof value === 'string' ? value : ''}
                onChange={(val: string) => updateRow(row.id, { data: { ...row.data, [field.id]: val } })}
                placeholder={`Enter ${field.name.toLowerCase()}...`}
                ariaLabel={`Edit ${field.name}`}
              />
            );
          case 'number':
            return (
              <NumberCellEditor
                value={typeof value === 'number' ? value : ''}
                onChange={(val: number | null) => updateRow(row.id, { data: { ...row.data, [field.id]: val } })}
                ariaLabel={`Edit ${field.name}`}
              />
            );
          case 'date':
            return (
              <DateCellEditor
                value={typeof value === 'string' ? value : ''}
                onChange={(val: string) => updateRow(row.id, { data: { ...row.data, [field.id]: val } })}
                ariaLabel={`Edit ${field.name}`}
              />
            );
          case 'boolean':
            return (
              <BooleanCellEditor
                value={!!value}
                onChange={(val: boolean) => updateRow(row.id, { data: { ...row.data, [field.id]: val } })}
                ariaLabel={`Toggle ${field.name}`}
              />
            );
          case 'dropdown':
            return (
              <DropdownCellEditor
                value={typeof value === 'string' ? value : ''}
                options={field.options || []}
                onChange={(val: string) => updateRow(row.id, { data: { ...row.data, [field.id]: val } })}
                ariaLabel={`Select ${field.name}`}
              />
            );
          case 'images':
            return (
              <ImagesCellEditor
                value={Array.isArray(value) ? value : []}
                getFileUrl={getFileUrl}
                onUpload={async (files: File[]) => {
                  try {
                    const newImages: FileValueWithId[] = [];
                    for (const file of files) {
                      const fileId = await fileOperations.addFile(file);
                      newImages.push({ fileId, name: file.name, type: file.type });
                    }
                    updateRow(row.id, { data: { ...row.data, [field.id]: [...(Array.isArray(value) ? value : []), ...newImages] } });
                  } catch {
                    // Error handling removed with notification system
                  }
                }}
                onPreview={(url: string, name: string) => setImageModal({ url, name })}
                ariaLabel={field.name}
              />
            );
          case 'files':
            return (
              <FilesCellEditor
                value={Array.isArray(value) ? value : []}
                getFileUrl={getFileUrl}
                onUpload={async (files: File[]) => {
                  try {
                    const newFiles: FileValueWithId[] = [];
                    for (const file of files) {
                      const fileId = await fileOperations.addFile(file);
                      newFiles.push({ fileId, name: file.name, type: file.type });
                    }
                    updateRow(row.id, { data: { ...row.data, [field.id]: [...(Array.isArray(value) ? value : []), ...newFiles] } });
                  } catch {
                    // Error handling removed with notification system
                  }
                }}
                ariaLabel={field.name}
              />
            );
          case 'image':
            return (
              <ImageCellEditor
                value={value && typeof value === 'object' && !Array.isArray(value) && 'fileId' in value ? value : null}
                getFileUrl={getFileUrl}
                onUpload={async (file: File) => {
                  try {
                    const fileId = await fileOperations.addFile(file);
                    updateRow(row.id, { data: { ...row.data, [field.id]: { fileId, name: file.name, type: file.type } } });
                  } catch {
                    // Error handling removed with notification system
                  }
                }}
                onPreview={(url: string, name: string) => setImageModal({ url, name })}
                ariaLabel={field.name}
              />
            );
          case 'file':
            return (
              <FileCellEditor
                value={value && typeof value === 'object' && !Array.isArray(value) && 'fileId' in value ? value : null}
                getFileUrl={getFileUrl}
                onUpload={async (file: File) => {
                  try {
                    const fileId = await fileOperations.addFile(file);
                    updateRow(row.id, { data: { ...row.data, [field.id]: { fileId, name: file.name, type: file.type } } });
                  } catch {
                    // Error handling removed with notification system
                  }
                }}
                ariaLabel={field.name}
              />
            );
          default:
            // Type guard: do not render arrays in non-array fields
            if (Array.isArray(value)) return <span className="cell-none">None</span>;
            // Special styling for specific field types
            if (field.id === 'devilfruit') {
              if (!value || typeof value !== 'string' || value === 'None') return <span className="badge">None</span>;
              let badgeClass = 'badge';
              if (value.includes('Gum') || value.includes('Hana')) badgeClass += ' green';
              else if (value.includes('Hito')) badgeClass += ' yellow';
              else badgeClass += ' blue';
              return <span className={badgeClass}>{value}</span>;
            }
            // For all other string/number fields, add ellipsis and tooltip
            if (typeof value === 'string' || typeof value === 'number') {
              return (
                <span title={String(value)} style={{ display: 'inline-block', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                  {value}
                </span>
              );
            }
            return <span className="cell-none">None</span>;
        }
      }
    }));
  }, [activeTable, getColWidth, getFileUrl, updateRow]);

  // --- REACT-DATA-GRID ROWS ---
  // Transform ordered rows for react-data-grid
  const gridRows = useMemo(() => {
    return transformRowsForGrid(orderedRows);
  }, [orderedRows]);

  // --- REACT-DATA-GRID EVENTS ---
  // Handle row data changes with optimistic updates
  const handleRowsChange = async (newRows: DataGridRow[]) => {
    for (const newRow of newRows) {
      const originalRow = orderedRows.find(r => r.id === newRow.id);
      if (originalRow && JSON.stringify(originalRow.data) !== JSON.stringify(newRow.data)) {
        await updateRow(newRow.id, { data: newRow.data });
      }
    }
  };

  // Add new row with proper field initialization
  const handleAddRow = async () => {
    if (!activeTable) return;
    const newRow: Omit<TableRow, 'id' | 'createdAt' | 'updatedAt'> = {
      tableId: activeTable.id!,
      data: createNewRowData(activeTable),
    };
    try {
      await addRow(newRow);
    } catch {
      // Error handling removed with notification system
    }
  };

  // Delete column with notification feedback
  const confirmDeleteColumn = async () => {
    if (columnToDelete) {
      try {
        await deleteColumn(columnToDelete.id);
        setShowDeleteColumn(false);
        setColumnToDelete(null);
      } catch {
        // Error handling removed with notification system
      }
    }
  };

  const [rowHeight, setRowHeight] = useState(36); // default: medium

  // Keyboard event handlers for modals
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (imageModal) {
          setImageModal(null);
        }
        if (showDeleteConfirm) {
          setShowDeleteConfirm(false);
          setDeleteType(null);
        }
      }
    };

    if (imageModal || showDeleteConfirm) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [imageModal, showDeleteConfirm]);

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
          try {
            await addColumn(field);
            await refreshTables();
            const updated = (await refreshTables(), activeTable && (await refreshTables(), activeTable.id) ? (useAppStore.getState().tables.find(t => t.id === activeTable.id) || activeTable) : activeTable);
            setActiveTable(updated);
            setShowAddColumn(false);
          } catch {
          }
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
        <div 
          className="flex fixed inset-0 z-50 justify-center items-center bg-black bg-opacity-50 animate-fade-in"
          onClick={() => {
            setShowDeleteConfirm(false);
            setDeleteType(null);
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
        >
          <div 
            className="p-6 mx-4 w-96 max-w-md rounded-lg animate-scale-in"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff'
            }}
          >
            <div className="flex items-center mb-4">
              <AlertTriangle className="mr-3 w-6 h-6" style={{ color: theme === 'dark' ? '#f59e0b' : '#f59e0b' }} />
              <h2 
                id="delete-modal-title"
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
                className="px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
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
                aria-label="Cancel delete"
              >
                Cancel
              </button>
              <button
                onClick={deleteType === 'rows' ? handleDeleteRows : handleDeleteTable}
                className="px-4 py-2 text-sm font-medium text-white rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
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
                aria-label="Confirm delete"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {imageModal && (
        <div 
          className="flex fixed inset-0 z-50 justify-center items-center bg-black bg-opacity-60 animate-fade-in"
          onClick={() => setImageModal(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="image-modal-title"
        >
          <div 
            className="flex flex-col items-center p-4 w-full max-w-lg bg-white rounded-lg shadow-lg dark:bg-gray-900 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={imageModal.url} 
              alt={imageModal.name} 
              className="mb-4 max-w-full max-h-96 rounded" 
            />
            <div id="image-modal-title" className="mb-2 text-sm font-medium text-center">
              {imageModal.name}
            </div>
            <button
              className="px-4 py-2 text-white bg-blue-600 rounded transition-colors duration-200 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              onClick={() => setImageModal(null)}
              type="button"
              aria-label="Close image preview"
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
          defaultColumnOptions={{
            resizable: true,
            sortable: true
          }}
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