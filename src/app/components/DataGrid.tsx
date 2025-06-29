'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import NextImage from 'next/image';
import { Calendar, FileText, Plus } from 'lucide-react';
import { useTables } from '../contexts/TableContext';
import { useAppStore } from '@/lib/store';
import { Field, TableRow, FileValueWithId } from '@/lib/schemas';
import AddColumnModal from './modals/AddColumnModal';
import DeleteColumnModal from './modals/DeleteColumnModal';
import { fileOperations } from '@/lib/database';

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
  const { rows, addRow, updateRow, addColumn, deleteColumn, updateColWidths, updateRowHeights } = useAppStore();
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [showDeleteColumn, setShowDeleteColumn] = useState(false);
  const [columnToDelete, setColumnToDelete] = useState<Field | null>(null);
  // Inline editing state
  const [editingCell, setEditingCell] = useState<{ rowIdx: number; colKey: string } | null>(null);
  const [editValue, setEditValue] = useState<string | number | boolean | FileValueWithId | null>(null);

  // --- ROW ORDER STATE ---
  const [rowOrder, setRowOrder] = useState<number[]>([]);
  useEffect(() => {
    if (rows.length > 0) {
      setRowOrder((prev) => {
        // If prev is empty or doesn't match, reset to current order
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
  const minColWidth = 80;
  const [colWidths, setColWidths] = useState<Record<string, number>>({});
  useEffect(() => {
    if (activeTable && activeTable.colWidths) setColWidths(activeTable.colWidths);
  }, [activeTable]);
  // Persist to DB on change
  useEffect(() => {
    if (activeTable) updateColWidths(activeTable.id!, colWidths);
  }, [colWidths, activeTable, updateColWidths]);

  // --- ROW HEIGHT STATE (PERSISTED IN DB) ---
  const defaultRowHeight = 36;
  const [rowHeights, setRowHeights] = useState<Record<string, number>>({});
  useEffect(() => {
    if (activeTable && activeTable.rowHeights) setRowHeights(activeTable.rowHeights);
  }, [activeTable]);
  useEffect(() => {
    if (activeTable) updateRowHeights(activeTable.id!, rowHeights);
  }, [rowHeights, activeTable, updateRowHeights]);

  const resizingCol = useRef<string | null>(null);
  const startX = useRef<number>(0);
  const startWidth = useRef<number>(0);
  const [resizeLine, setResizeLine] = useState<number | null>(null);

  // Helper to get column width
  const getColWidth = (fieldId: string, fieldType?: string) =>
    colWidths[fieldId] || (fieldType ? getColumnWidth(fieldType) : defaultColWidth);

  // --- COLUMN RESIZE HANDLERS ---
  const handleResizeStart = (e: React.MouseEvent, fieldId: string) => {
    e.preventDefault();
    resizingCol.current = fieldId;
    startX.current = e.clientX;
    startWidth.current = getColWidths()[fieldId] || defaultColWidth;
    setResizeLine(e.clientX);
    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
  };
  const handleResizeMove = (e: MouseEvent) => {
    if (!resizingCol.current) return;
    setResizeLine(e.clientX);
  };
  const handleResizeEnd = (e: MouseEvent) => {
    if (!resizingCol.current) return;
    const delta = e.clientX - startX.current;
    setColWidths((prev) => {
      const newWidth = Math.max(minColWidth, startWidth.current + delta);
      return { ...prev, [resizingCol.current!]: newWidth };
    });
    resizingCol.current = null;
    setResizeLine(null);
    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeEnd);
  };
  const getColWidths = () => colWidths;

  // --- FILE/IMAGE CELL HANDLER ---
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const handleFileClick = (rowIdx: number, colKey: string) => {
    const refKey = `${rowIdx}-${colKey}`;
    fileInputRefs.current[refKey]?.click();
  };

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

  // Define renderCell function before useMemo
  const renderCell = (field: Field, value: string | number | boolean | FileValueWithId | null, rowIdx?: number, colKey?: string) => {
    switch (field.type) {
      case 'boolean':
        if (typeof value !== 'boolean') return null;
        return (
          <div className="flex items-center justify-center h-full w-full">
            <input
              type="checkbox"
              checked={!!value}
              onChange={async (e) => {
                if (rowIdx !== undefined && colKey) {
                  await handleCellValueChange(rowIdx, colKey, e.target.checked);
                }
              }}
              className="h-4 w-4 text-blue-600 dark:text-blue-400 border-gray-300 dark:border-gray-600 rounded cursor-pointer bg-white dark:bg-gray-700"
            />
          </div>
        );
      case 'dropdown':
        if (typeof value !== 'string') return null;
        return (
          <div className="flex items-center h-full w-full">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
              {value || 'Not set'}
            </span>
          </div>
        );
      case 'date':
        if (typeof value !== 'string') return null;
        return (
          <div className="flex items-center h-full w-full">
            <Calendar className="mr-2 h-4 w-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
            <span className="text-sm text-gray-600 dark:text-gray-300 truncate">{value || 'Not set'}</span>
          </div>
        );
      case 'number':
        if (typeof value !== 'number') return null;
        return (
          <div className="flex items-center h-full w-full">
            <span className="text-sm text-gray-900 dark:text-gray-100">{value || 0}</span>
          </div>
        );
      case 'image': {
        // Only support a single file object per cell
        if (!value || typeof value !== 'object' || Array.isArray(value) || !('fileId' in value)) return null;
        const v = value as FileValueWithId;
        const imgUrl = getFileUrl(v.fileId);
        return (
          <div className="flex items-center h-full w-full cursor-pointer" onClick={() => rowIdx !== undefined && colKey && handleFileClick(rowIdx, colKey)}>
            {imgUrl ? (
              <a href={imgUrl} target="_blank" rel="noopener noreferrer" className="flex items-center" onClick={(e) => e.stopPropagation()}>
                <NextImage src={imgUrl} alt={v.name} width={32} height={32} className="h-8 w-8 object-cover rounded border border-gray-200 dark:border-gray-600 flex-shrink-0" style={{ minWidth: 32, minHeight: 32 }} />
              </a>
            ) : (
              <span className="text-sm text-gray-400 dark:text-gray-500">Click to upload</span>
            )}
            {rowIdx !== undefined && colKey && (
              <input
                type="file"
                accept="image/png,image/jpeg"
                ref={el => { fileInputRefs.current[`${rowIdx}-${colKey}`] = el; }}
                style={{ display: 'none' }}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const fileId = await fileOperations.addFile(file);
                    await handleCellValueChange(rowIdx, colKey, { name: file.name, type: file.type, fileId });
                  }
                }}
              />
            )}
          </div>
        );
      }
      case 'file': {
        // Only support a single file object per cell
        if (!value || typeof value !== 'object' || Array.isArray(value) || !('fileId' in value)) return null;
        const fileValue = value as FileValueWithId;
        const fileUrl = getFileUrl(fileValue.fileId);
        return (
          <div className="flex items-center h-full w-full cursor-pointer" onClick={() => rowIdx !== undefined && colKey && handleFileClick(rowIdx, colKey)}>
            {fileUrl ? (
              <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-1 text-blue-600 dark:text-blue-400 underline" onClick={(e) => e.stopPropagation()}>
                <FileText className="h-4 w-4 text-green-500 dark:text-green-400 flex-shrink-0" />
                <span className="text-xs truncate max-w-[80px]">{fileValue.name}</span>
              </a>
            ) : (
              <span className="text-sm text-gray-400 dark:text-gray-500">Click to upload</span>
            )}
            {rowIdx !== undefined && colKey && (
              <input
                type="file"
                ref={el => { fileInputRefs.current[`${rowIdx}-${colKey}`] = el; }}
                style={{ display: 'none' }}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const fileId = await fileOperations.addFile(file);
                    await handleCellValueChange(rowIdx, colKey, { name: file.name, type: file.type, fileId });
                  }
                }}
              />
            )}
          </div>
        );
      }
      default:
        if (typeof value !== 'string') return null;
        return (
          <div className="flex items-center h-full w-full">
            <span className="text-sm text-gray-900 dark:text-gray-100">{value}</span>
          </div>
        );
    }
  };

  const handleCellValueChange = async (rowIdx: number, colKey: string, value: string | number | boolean | FileValueWithId | null) => {
    const row = rows[rowIdx];
    if (!row) return;
    const field = activeTable?.fields.find(f => f.id === colKey);
    if (!field) return;
    let newValue: string | number | boolean | FileValueWithId | null = value;
    if ((field.type === 'image' || field.type === 'file')) {
      if (typeof value !== 'object' || value === null || !('fileId' in value)) return;
      newValue = value as FileValueWithId;
    } else {
      if (typeof value === 'object') newValue = '';
    }
    const updatedRow = {
      ...row,
      data: { ...row.data, [colKey]: newValue },
    };
    await updateRow(row.id!, { data: updatedRow.data });
  };

  // Render cell with inline editing
  const renderEditableCell = (field: Field, value: string | number | boolean | FileValueWithId | null, rowIdx: number, colKey: string) => {
    const isEditing = editingCell && editingCell.rowIdx === rowIdx && editingCell.colKey === colKey;
    if (!isEditing) {
      return (
        <div
          className="w-full h-full cursor-pointer"
          tabIndex={0}
          onClick={() => {
            setEditingCell({ rowIdx, colKey });
            setEditValue(value ?? '');
          }}
          onDoubleClick={() => {
            setEditingCell({ rowIdx, colKey });
            setEditValue(value ?? '');
          }}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              setEditingCell({ rowIdx, colKey });
              setEditValue(value ?? '');
            }
          }}
        >
          {renderCell(field, value, rowIdx, colKey)}
        </div>
      );
    }
    // Editor
    const inputValue = typeof editValue === 'boolean' ? '' : editValue ?? '';
    switch (field.type) {
      case 'boolean':
        return (
          <input
            type="checkbox"
            checked={!!editValue}
            autoFocus
            onChange={e => setEditValue(e.target.checked)}
            onBlur={async () => { if (typeof editValue !== 'object') { await handleCellValueChange(rowIdx, colKey, editValue ?? ''); } setEditingCell(null); }}
            onKeyDown={async e => { if (e.key === 'Enter' && typeof editValue !== 'object') { await handleCellValueChange(rowIdx, colKey, editValue ?? ''); setEditingCell(null); } else if (e.key === 'Escape') { setEditingCell(null); } }}
            className="h-4 w-4 text-blue-600 dark:text-blue-400 border-gray-300 dark:border-gray-600 rounded cursor-pointer bg-white dark:bg-gray-700"
          />
        );
      case 'dropdown':
        return (
          <select
            value={typeof inputValue === 'object' ? '' : inputValue ?? ''}
            autoFocus
            onChange={e => setEditValue(e.target.value)}
            onBlur={async () => { if (typeof editValue !== 'object') { await handleCellValueChange(rowIdx, colKey, editValue ?? ''); } setEditingCell(null); }}
            onKeyDown={async e => { if (e.key === 'Enter' && typeof editValue !== 'object') { await handleCellValueChange(rowIdx, colKey, editValue ?? ''); setEditingCell(null); } else if (e.key === 'Escape') { setEditingCell(null); } }}
            className="w-full p-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 cursor-pointer bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="">Select...</option>
            {field.options?.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );
      case 'date':
        return (
          <input
            type="date"
            value={typeof inputValue === 'object' ? '' : inputValue ?? ''}
            autoFocus
            onChange={e => setEditValue(e.target.value)}
            onBlur={async () => { if (typeof editValue !== 'object') { await handleCellValueChange(rowIdx, colKey, editValue ?? ''); } setEditingCell(null); }}
            onKeyDown={async e => { if (e.key === 'Enter' && typeof editValue !== 'object') { await handleCellValueChange(rowIdx, colKey, editValue ?? ''); setEditingCell(null); } else if (e.key === 'Escape') { setEditingCell(null); } }}
            className="w-full p-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 cursor-pointer bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        );
      case 'image':
      case 'file':
        return (
          <input
            type="file"
            accept={field.type === 'image' ? 'image/png,image/jpeg' : '.pdf,.csv,.json'}
            autoFocus
            onChange={async (e) => { const file = e.target.files?.[0]; if (file) { const fileId = await fileOperations.addFile(file); await handleCellValueChange(rowIdx, colKey, { name: file.name, type: file.type, fileId }); } setEditingCell(null); }}
            className="w-full text-xs text-gray-900 dark:text-gray-100"
          />
        );
      default:
        return (
          <input
            type={field.type === 'number' ? 'number' : 'text'}
            value={typeof inputValue === 'object' ? '' : inputValue ?? ''}
            autoFocus
            onChange={e => setEditValue(e.target.value)}
            onBlur={async () => { if (typeof editValue !== 'object') { await handleCellValueChange(rowIdx, colKey, editValue ?? ''); } setEditingCell(null); }}
            onKeyDown={async e => { if (e.key === 'Enter' && typeof editValue !== 'object') { await handleCellValueChange(rowIdx, colKey, editValue ?? ''); setEditingCell(null); } else if (e.key === 'Escape') { setEditingCell(null); } }}
            className="w-full p-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 cursor-pointer bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        );
    }
  };

  const confirmDeleteColumn = async () => {
    if (columnToDelete) {
      await deleteColumn(columnToDelete.id);
      setShowDeleteColumn(false);
      setColumnToDelete(null);
    }
  };

  const handleAddRow = async () => {
    if (!activeTable) return;

    const newRow: Omit<TableRow, 'id' | 'createdAt' | 'updatedAt'> = {
      tableId: activeTable.id!,
      data: activeTable.fields.reduce((acc, field) => {
        // For file/image fields, ensure we only get a single file object, not an array
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderedRows, activeTable]);

  if (!activeTable) {
    return (
      <div className="flex-grow overflow-auto flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 text-lg mb-2">No table selected</div>
          <p className="text-gray-400">Please select a table from the sidebar to view data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-grow overflow-auto flex flex-col min-w-0">
      {/* Modals */}
      <AddColumnModal 
        open={showAddColumn} 
        onClose={() => setShowAddColumn(false)}
        onAddColumn={async (field) => {
          await addColumn(field);
          await refreshTables();
          // Set the updated table as active
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

      {/* Resize line indicator */}
      {resizeLine !== null && (
        <div
          className="fixed top-0 left-0 h-full w-0.5 bg-blue-500 z-50 pointer-events-none"
          style={{ left: resizeLine }}
        />
      )}

      {/* Grid */}
      <div className="flex flex-col border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 overflow-x-auto w-full min-w-0" style={{ minWidth: 600 }}>
        {/* Header Row */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 sticky top-0 z-10 select-none min-w-0">
          {/* Row ID Header */}
          <div className="flex items-center justify-center px-2 py-1 font-semibold text-xs text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-700 min-w-[60px] h-10 flex-shrink-0">
            <span className="truncate">#</span>
          </div>
          
          {activeTable.fields.map((field) => (
            <div
              key={field.id}
              className="flex items-center px-2 py-1 font-semibold text-xs text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-700 min-w-[80px] h-10 relative group flex-shrink-0"
              style={{ width: getColWidth(field.id, field.type), position: 'relative' }}
            >
              <span className="truncate flex-1 min-w-0">{field.name}</span>
              {/* Resize handle */}
              <div
                className="absolute right-0 top-0 h-full w-1 cursor-col-resize group-hover:bg-blue-500 dark:group-hover:bg-blue-400 transition-colors"
                onMouseDown={e => handleResizeStart(e, field.id)}
                style={{ zIndex: 10 }}
              />
            </div>
          ))}
          {/* + Add Column Button as header cell */}
          <div className="flex items-center justify-center px-2 py-1 min-w-[40px] h-10 flex-shrink-0">
            <button
              onClick={() => setShowAddColumn(true)}
              className="flex items-center justify-center w-7 h-7 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
              title="Add Column"
              type="button"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
        {/* Data Rows */}
        <div className="flex flex-col divide-y divide-gray-100 dark:divide-gray-700 min-w-0">
          {orderedRows.length === 0 ? (
            <div className="flex items-center justify-center h-24 text-gray-500 dark:text-gray-400 text-sm">
              No data available
            </div>
          ) : (
            orderedRows.map((row, rowIndex) => (
              <div
                key={row.id || rowIndex}
                className="flex hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors min-w-0"
                style={{ minHeight: rowHeights[row.id!] || defaultRowHeight }}
              >
                {/* Row ID Cell */}
                <div className="flex items-center justify-center px-2 py-1 min-w-[60px] border-r border-gray-100 dark:border-gray-700 text-xs h-10 flex-shrink-0 bg-gray-50 dark:bg-gray-900">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">{row.id || rowIndex + 1}</span>
                </div>
                
                {activeTable.fields.map((field) => (
                  <div
                    key={field.id}
                    className="flex items-center px-2 py-1 min-w-[80px] border-r border-gray-100 dark:border-gray-700 text-xs h-10 cursor-pointer group flex-shrink-0 min-w-0"
                    style={{ width: getColWidth(field.id, field.type) }}
                  >
                    {field.type === 'image' || field.type === 'file'
                      ? renderEditableCell(field, (() => {
                          const value = row.data[field.id];
                          if (value && typeof value === 'object' && !Array.isArray(value) && 'fileId' in value) {
                            return value as FileValueWithId;
                          }
                          return null;
                        })(), rowIndex, field.id)
                      : renderEditableCell(field, (() => {
                          const value = row.data[field.id];
                          if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
                            return value;
                          }
                          return null;
                        })(), rowIndex, field.id)}
                  </div>
                ))}
                {/* Empty cell for add column button alignment */}
                <div className="min-w-[40px] flex-shrink-0" />
              </div>
            ))
          )}
        </div>
        {/* + Add Row Button as a full-width row */}
        <div className="flex border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 min-w-0">
          <button
            onClick={handleAddRow}
            className="flex items-center justify-center w-full py-2 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-950/20 transition-colors font-medium text-xs"
            type="button"
          >
            <Plus className="h-3 w-3 mr-1" /> Add row
          </button>
        </div>
      </div>
    </div>
  );
} 