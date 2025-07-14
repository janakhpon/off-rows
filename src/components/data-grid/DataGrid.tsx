'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { DataGrid, RenderCellProps } from 'react-data-grid';
import { Plus, Trash2, AlertTriangle, Code, Download, Maximize2, Minimize2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTables } from '@/app/contexts/TableContext';
import { useTheme } from '@/app/contexts/ThemeContext';
import { useAppStore } from '@/lib/store';
import { Field, TableRow, FileValueWithId, Table } from '@/lib/schemas';
import { AddColumnModal, DeleteColumnModal, TableSchemaModal } from '@/components';
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
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import EditColumnModal from '@/components/modals/EditColumnModal';
import ColumnHeaderModal from '@/components/modals/ColumnHeaderModal';
import { saveFileWithSync, deleteFileWithSync } from '@/lib/syncOrchestrator';

type DataGridRow = {
  id: number;
  data: Record<string, string | number | boolean | FileValueWithId | FileValueWithId[] | null>;
};

/**
 * Get default column width based on field type
 */
const getColumnWidth = (fieldType: string) => {
  switch (fieldType) {
    case 'text':
      return 200;
    case 'number':
      return 120;
    case 'boolean':
      return 100;
    case 'date':
      return 150;
    case 'dropdown':
      return 150;
    case 'image':
      return 120;
    case 'file':
      return 120;
    default:
      return 150;
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
  defaultWidth: number,
) => colWidths[fieldId] || getColumnWidth(fieldType) || defaultWidth;

// Pure function to transform rows for grid
const transformRowsForGrid = (orderedRows: TableRow[]): DataGridRow[] =>
  orderedRows.map((row) => ({
    id: row.id!,
    data: row.data,
    ...row.data,
  }));

// Pure function to create new row data
const createNewRowData = (
  activeTable: Table,
): Record<string, string | number | boolean | FileValueWithId | FileValueWithId[] | null> =>
  activeTable.fields.reduce(
    (
      acc: Record<string, string | number | boolean | FileValueWithId | FileValueWithId[] | null>,
      field: Field,
    ) => {
      if (field.type === 'images' || field.type === 'files') {
        acc[field.id] = Array.isArray(field.defaultValue) ? field.defaultValue : [];
      } else if (field.type === 'image' || field.type === 'file') {
        if (
          field.defaultValue &&
          typeof field.defaultValue === 'object' &&
          !Array.isArray(field.defaultValue) &&
          'fileId' in field.defaultValue
        ) {
          acc[field.id] = field.defaultValue as FileValueWithId;
        } else {
          acc[field.id] = null;
        }
      } else {
        acc[field.id] = field.defaultValue || null;
      }
      return acc;
    },
    {},
  );

/**
 * Main DataGrid component for displaying and editing table data
 * Features:
 * - Resizable columns and rows with persistence
 * - File/image upload and preview
 * - Row selection and bulk operations
 * - Modal dialogs with keyboard navigation
 * - Offline-first with IndexedDB storage
 */
interface DataGridComponentProps {
  searchQuery?: string;
}

export default function DataGridComponent({ searchQuery = '' }: DataGridComponentProps) {
  const { activeTable, refreshTables, setActiveTable } = useTables();
  const { theme } = useTheme();
  const {
    rows,
    addRow,
    updateRow,
    deleteRow,
    addColumn,
    deleteColumn,
    updateColWidths,
    updateRowHeights,
    deleteTable,
  } = useAppStore();
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [showDeleteColumn, setShowDeleteColumn] = useState(false);
  const [showSchemaModal, setShowSchemaModal] = useState(false);
  const [columnToDelete, setColumnToDelete] = useState<Field | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(createEmptySet());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteType, setDeleteType] = useState<'rows' | 'table' | null>(null);
  const [showEditColumn, setShowEditColumn] = useState(false);
  const [columnToEdit, setColumnToEdit] = useState<Field | null>(null);
  const [showColumnHeaderModal, setShowColumnHeaderModal] = useState(false);
  const [columnForModal, setColumnForModal] = useState<Field | null>(null);

  // --- CELL EDITING STATE ---
  // Track which cell is currently being edited
  const [editingCell, setEditingCell] = useState<{ rowId: number; fieldId: string } | null>(null);

  // --- ROW ORDER STATE ---
  // Maintain row order for consistent display and drag-and-drop support
  const [rowOrder, setRowOrder] = useState<number[]>(createEmptyArray());
  useEffect(() => {
    if (rows.length > 0) {
      setRowOrder((prev) => {
        // Filter out rows without IDs and check if order has changed
        const validRows = rows.filter((r): r is TableRow & { id: number } => r.id !== undefined);
        const validRowIds = validRows.map((r) => r.id);

        if (prev.length !== validRowIds.length || !prev.every((id, i) => id === validRowIds[i])) {
          return validRowIds;
        }
        return prev;
      });
    }
  }, [rows]);

  // Helper to get rows in original order for consistent rendering
  const orderedRows = useMemo(() => {
    if (!rowOrder.length) return rows;
    const rowMap = Object.fromEntries(
      rows.filter((r) => r.id !== undefined).map((r) => [r.id!, r]),
    );
    let filteredRows = rowOrder
      .map((id) => rowMap[id])
      .filter((row): row is TableRow => row !== undefined);
    if (searchQuery.trim() !== '' && activeTable) {
      const q = searchQuery.trim().toLowerCase();
      // Only search text fields
      const textFields = activeTable.fields.filter((f) => f.type === 'text').map((f) => f.id);
      filteredRows = filteredRows.filter((row) =>
        textFields.some((fid) => {
          const val = row.data[fid];
          return val !== null && val !== undefined && String(val).toLowerCase().includes(q);
        }),
      );
    }
    return filteredRows;
  }, [rows, rowOrder, searchQuery, activeTable]);

  // --- COLUMN WIDTH STATE (PERSISTED IN DB) ---
  // Column widths are persisted in the database for consistent layout
  const defaultColWidth = 140;
  const [colWidths, setColWidths] = useState<Record<string, number>>(createEmptyObject());
  useEffect(() => {
    if (activeTable && activeTable.colWidths) setColWidths(activeTable.colWidths);
  }, [activeTable]);

  useEffect(() => {
    if (activeTable && typeof activeTable.id === 'number') updateColWidths(activeTable.id, colWidths);
  }, [colWidths, activeTable, updateColWidths]);

  // --- ROW HEIGHT STATE (PERSISTED IN DB) ---
  // Row heights are persisted in the database for consistent layout
  const [rowHeights, setRowHeights] = useState<Record<string, number>>(createEmptyObject());
  useEffect(() => {
    if (activeTable && activeTable.rowHeights) setRowHeights(activeTable.rowHeights);
  }, [activeTable]);

  useEffect(() => {
    if (activeTable && typeof activeTable.id === 'number') updateRowHeights(activeTable.id, rowHeights);
  }, [rowHeights, activeTable, updateRowHeights]);

  // Helper to get column width with fallback to default
  const getColWidth = useCallback(
    (fieldId: string, fieldType?: string) =>
      getColumnWidthWithFallback(colWidths, fieldId, fieldType || '', defaultColWidth),
    [colWidths],
  );

  // Add state for file URLs
  // Cache file blob URLs for efficient rendering and preview
  const [fileUrls, setFileUrls] = useState<Record<number, string>>(createEmptyObject());

  // Helper to get object URL for a fileId from cache
  const getFileUrl = useCallback(
    (fileId?: number): string | undefined => {
      if (!fileId) return undefined;
      return fileUrls[fileId];
    },
    [fileUrls],
  );

  // Fetch and cache file blob URLs for offline access
  const fetchAndCacheFileUrl = useCallback(
    async (fileId: number) => {
      if (fileUrls[fileId]) return;
      const file = await fileOperations.getFileById(fileId);
      if (file) {
        const url = URL.createObjectURL(file.blob);
        setFileUrls((prev) => ({ ...prev, [fileId]: url }));
      }
    },
    [fileUrls],
  );

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
        } else if (
          (field.type === 'image' || field.type === 'file') &&
          val &&
          typeof val === 'object' &&
          'fileId' in val &&
          typeof val.fileId === 'number'
        ) {
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
  const [imageModal, setImageModal] = useState<{ images: { url: string; name: string; fileId: number }[]; index: number } | null>(null);
  const [imageModalFullscreen, setImageModalFullscreen] = useState(false);
  const [imageModalClosing, setImageModalClosing] = useState(false);
  // Helper to open modal for single or multiple images
  const openImageModal = useCallback((images: { url: string; name: string; fileId: number }[], index: number) => {
    setImageModal({ images, index });
    setImageModalFullscreen(false);
    setImageModalClosing(false);
  }, []);

  // Helper to close modal with fade-out
  const closeImageModal = useCallback(() => {
    setImageModalClosing(true);
    setTimeout(() => {
      setImageModal(null);
      setImageModalClosing(false);
    }, 200); // match CSS transition duration
  }, []);
  // --- SELECT ALL CHECKBOX LOGIC ---
  const allRowIds = orderedRows
    .filter((row): row is TableRow & { id: number } => row.id !== undefined)
    .map((row) => row.id);
  const allSelected = selectedRows.size > 0 && allRowIds.every((id) => selectedRows.has(id));

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      if (checked) {
        setSelectedRows(new Set<number>(allRowIds));
      } else {
        setSelectedRows(new Set<number>());
      }
    },
    [allRowIds],
  );
  const handleSelectRow = useCallback(
    (rowId: number | undefined, checked: boolean) => {
      if (typeof rowId !== 'number') return;
      const newSet = new Set(selectedRows);
      if (checked) {
        newSet.add(rowId);
      } else {
        newSet.delete(rowId);
      }
      setSelectedRows(newSet as Set<number>);
    },
    [selectedRows],
  );

  // --- COLUMNS ---
  const columns = useMemo(() => {
    if (!activeTable) return [];
    // Row number column
    const rowNumberCol = {
      key: 'rowNumber',
      name: '#',
      width: 50,
      resizable: false,
      renderCell: ({ rowIdx }: { rowIdx: number }) => (
        <span className="block text-xs text-center text-gray-400">{rowIdx + 1}</span>
      ),
      headerCellClass: 'text-center',
      cellClass: 'text-center',
    };
    // Select all checkbox column
    const selectCol = {
      key: 'select',
      name: (
        <div className="flex justify-center items-center">
          <Checkbox
            checked={allSelected}
            onCheckedChange={handleSelectAll}
            aria-label="Select all rows"
            className="cursor-pointer"
            ref={(el) => {
              if (el) {
                // Note: Radix UI Checkbox doesn't support indeterminate state directly
                // We'll handle this with custom styling or logic if needed
              }
            }}
          />
        </div>
      ),
      width: 40,
      resizable: false,
      renderCell: ({ row }: RenderCellProps<DataGridRow>) => (
        <div className="flex justify-center items-center">
          <Checkbox
            checked={selectedRows.has(row.id)}
            onCheckedChange={(checked) => handleSelectRow(row.id, !!checked)}
            aria-label="Select row"
            className="cursor-pointer"
          />
        </div>
      ),
      headerCellClass: 'text-center',
      cellClass: 'text-center',
    };
    // Data columns
    const dataCols = activeTable.fields.map((field) => ({
      key: field.id,
      name: (
        <div 
          className="flex justify-between items-center px-2 py-1 rounded transition-colors cursor-pointer group hover:bg-gray-50 dark:hover:bg-gray-700"
          onClick={() => {
            setColumnForModal(field);
            setShowColumnHeaderModal(true);
          }}
          title={`Click to manage column: ${field.name}`}
        >
          <span className="truncate max-w-[120px]" title={field.name}>{field.name}</span>
          <button
            className="p-1 rounded opacity-0 transition-opacity group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-gray-600"
            onClick={(e) => {
              e.stopPropagation();
              setColumnForModal(field);
              setShowColumnHeaderModal(true);
            }}
            title={`Manage column: ${field.name}`}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
        </div>
      ),
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
            return (
              <img
                src={value}
                alt="avatar"
                className="cell-avatar"
                aria-label={field.name}
                title="Click to preview"
              />
            );
          }
          if (value && typeof value === 'object' && 'fileId' in value && getFileUrl(value.fileId)) {
            return (
              <img
                src={getFileUrl(value.fileId)}
                alt="avatar"
                className="cell-avatar"
                aria-label={field.name}
                title="Click to preview"
              />
            );
          }
          return <span className="cell-none">None</span>;
        }
        // Default field type rendering
        switch (field.type) {
          case 'text':
            return (
              <TextCellEditor
                value={typeof value === 'string' ? value : ''}
                onChange={(val: string) =>
                  updateRow(row.id, { data: { ...row.data, [field.id]: val } })
                }
                placeholder={`Enter ${field.name.toLowerCase()}...`}
                ariaLabel={`Edit ${field.name}`}
                isEditing={editingCell?.rowId === row.id && editingCell?.fieldId === field.id}
                onEditStart={() => setEditingCell({ rowId: row.id, fieldId: field.id })}
                onEditEnd={() => setEditingCell(null)}
              />
            );
          case 'number':
            return (
              <NumberCellEditor
                value={typeof value === 'number' ? value : ''}
                onChange={(val: number | null) =>
                  updateRow(row.id, { data: { ...row.data, [field.id]: val } })
                }
                ariaLabel={`Edit ${field.name}`}
                isEditing={editingCell?.rowId === row.id && editingCell?.fieldId === field.id}
                onEditStart={() => setEditingCell({ rowId: row.id, fieldId: field.id })}
                onEditEnd={() => setEditingCell(null)}
              />
            );
          case 'date':
            return (
              <DateCellEditor
                value={typeof value === 'string' ? value : ''}
                onChange={(val: string) =>
                  updateRow(row.id, { data: { ...row.data, [field.id]: val } })
                }
                ariaLabel={`Edit ${field.name}`}
                isEditing={editingCell?.rowId === row.id && editingCell?.fieldId === field.id}
                onEditStart={() => setEditingCell({ rowId: row.id, fieldId: field.id })}
                onEditEnd={() => setEditingCell(null)}
              />
            );
          case 'boolean':
            return (
              <BooleanCellEditor
                value={!!value}
                onChange={(val: boolean) =>
                  updateRow(row.id, { data: { ...row.data, [field.id]: val } })
                }
                ariaLabel={`Toggle ${field.name}`}
              />
            );
          case 'dropdown':
            return (
              <DropdownCellEditor
                value={typeof value === 'string' ? value : ''}
                options={field.options || []}
                onChange={(val: string) =>
                  updateRow(row.id, { data: { ...row.data, [field.id]: val } })
                }
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
                      const fileId = await saveFileWithSync(file.name, new Uint8Array(await file.arrayBuffer()));
                      newImages.push({ fileId, name: file.name, type: file.type });
                    }
                    updateRow(row.id, {
                      data: {
                        ...row.data,
                        [field.id]: [...(Array.isArray(value) ? value : []), ...newImages],
                      },
                    });
                  } catch {
                    // Error handling removed with notification system
                  }
                }}
                onPreview={(url: string, name: string) => {
                  if (!activeTable) return;
                  const row = orderedRows.find(r => r.data[field.id]);
                  const value = row?.data[field.id];
                  if (Array.isArray(value)) {
                    const images = value
                      .map((v: { fileId: number; name: string }) => {
                        const fileUrl = getFileUrl(v.fileId);
                        if (!fileUrl) return null;
                        return { url: fileUrl, name: v.name, fileId: v.fileId };
                      })
                      .filter((img): img is { url: string; name: string; fileId: number } => !!img);
                    const idx = images.findIndex(img => img.url === url && img.name === name);
                    openImageModal(images, idx !== -1 ? idx : 0);
                  }
                }}
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
                      const fileId = await saveFileWithSync(file.name, new Uint8Array(await file.arrayBuffer()));
                      newFiles.push({ fileId, name: file.name, type: file.type });
                    }
                    updateRow(row.id, {
                      data: {
                        ...row.data,
                        [field.id]: [...(Array.isArray(value) ? value : []), ...newFiles],
                      },
                    });
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
                value={
                  value && typeof value === 'object' && !Array.isArray(value) && 'fileId' in value
                    ? value
                    : null
                }
                getFileUrl={getFileUrl}
                onUpload={async (file: File) => {
                  try {
                    const fileId = await saveFileWithSync(file.name, new Uint8Array(await file.arrayBuffer()));
                    updateRow(row.id, {
                      data: {
                        ...row.data,
                        [field.id]: { fileId, name: file.name, type: file.type },
                      },
                    });
                  } catch {
                    // Error handling removed with notification system
                  }
                }}
                onPreview={(url: string, name: string) => {
                  // Always use the fileId from the value for single image fields
                  const fileValue = value && typeof value === 'object' && 'fileId' in value ? value : null;
                  openImageModal([{ url, name, fileId: fileValue?.fileId ?? 0 }], 0);
                }}
                ariaLabel={field.name}
              />
            );
          case 'file':
            return (
              <FileCellEditor
                value={
                  value && typeof value === 'object' && !Array.isArray(value) && 'fileId' in value
                    ? value
                    : null
                }
                getFileUrl={getFileUrl}
                onUpload={async (file: File) => {
                  try {
                    const fileId = await saveFileWithSync(file.name, new Uint8Array(await file.arrayBuffer()));
                    updateRow(row.id, {
                      data: {
                        ...row.data,
                        [field.id]: { fileId, name: file.name, type: file.type },
                      },
                    });
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
              if (!value || typeof value !== 'string' || value === 'None')
                return <span className="badge">None</span>;
              let badgeClass = 'badge';
              if (value.includes('Gum') || value.includes('Hana')) badgeClass += ' green';
              else if (value.includes('Hito')) badgeClass += ' yellow';
              else badgeClass += ' blue';
              return <span className={badgeClass}>{value}</span>;
            }
            // For all other string/number fields, add ellipsis and tooltip
            if (typeof value === 'string' || typeof value === 'number') {
              return (
                <span
                  title={String(value)}
                  style={{
                    display: 'inline-block',
                    maxWidth: 180,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    verticalAlign: 'middle',
                  }}
                >
                  {value}
                </span>
              );
            }
            return <span className="cell-none">None</span>;
        }
      },
    }));
    return [rowNumberCol, selectCol, ...dataCols];
  }, [
    activeTable,
    getColWidth,
    selectedRows,
    allSelected,
    editingCell,
    getFileUrl,
    handleSelectAll,
    handleSelectRow,
    updateRow,
    openImageModal,
    orderedRows,
  ]);

  // --- REACT-DATA-GRID ROWS ---
  // Transform ordered rows for react-data-grid
  const gridRows = useMemo(() => {
    return transformRowsForGrid(orderedRows);
  }, [orderedRows]);

  // --- REACT-DATA-GRID EVENTS ---
  // Handle row data changes with optimistic updates
  const handleRowsChange = async (newRows: DataGridRow[]) => {
    for (const newRow of newRows) {
      const originalRow = orderedRows.find((r) => r.id !== undefined && r.id === newRow.id);
      if (originalRow && JSON.stringify(originalRow.data) !== JSON.stringify(newRow.data)) {
        await updateRow(newRow.id, { data: newRow.data });
      }
    }
  };

  // Add new row with proper field initialization
  const handleAddRow = async () => {
    if (!activeTable || typeof activeTable.id !== 'number') return;
    const newRow: Omit<TableRow, 'id' | 'createdAt' | 'updatedAt'> = {
      tableId: activeTable.id,
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

  // Keyboard event handlers for modals and cell editing
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
        if (editingCell) {
          setEditingCell(null);
        }
      }
    };

    if (imageModal || showDeleteConfirm || editingCell) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
    return undefined;
  }, [imageModal, showDeleteConfirm, editingCell]);

  // Click outside to stop editing
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (editingCell && !target.closest('.rdg-cell')) {
        setEditingCell(null);
      }
    };

    if (editingCell) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
    return undefined;
  }, [editingCell]);

  // --- Highlight logic for matching rows ---
  const isRowMatch = (row: DataGridRow) => {
    if (!searchQuery.trim() || !activeTable) return false;
    const q = searchQuery.trim().toLowerCase();
    const textFields = activeTable.fields.filter((f) => f.type === 'text').map((f) => f.id);
    return textFields.some((fid) => {
      const val = row.data[fid];
      return val !== null && val !== undefined && String(val).toLowerCase().includes(q);
    });
  };

  // --- SUMMARY FOOTER LOGIC ---
  const showSummary = orderedRows.length > 0 && activeTable;
  let numberFieldSums: Record<string, number> = {};
  if (showSummary) {
    numberFieldSums = activeTable.fields
      .filter((f) => f.type === 'number')
      .reduce(
        (acc, field) => {
          acc[field.id] = orderedRows.reduce((sum, row) => {
            const val = row.data[field.id];
            return sum + (typeof val === 'number' ? val : 0);
          }, 0);
          return acc;
        },
        {} as Record<string, number>,
      );
  }

  if (!activeTable) {
    return (
      <div className="flex overflow-auto flex-grow justify-center items-center">
        <div className="text-center">
          <div
            className="mb-2 text-lg"
            style={{
              color: theme === 'dark' ? '#6b7280' : '#6b7280',
            }}
          >
            No table selected
          </div>
          <p
            style={{
              color: theme === 'dark' ? '#9ca3af' : '#9ca3af',
            }}
          >
            Please select a table from the sidebar to view data
          </p>
        </div>
      </div>
    );
  }

  // Helper to delete a file or image from a row (handles single/multiple, image/file)
  async function handleDeleteFileOrImage({
    fileId,
    fieldType,
    fieldId,
    row,
    updateRow,
    setImageModal,
    imageModal,
  }: {
    fileId: number;
    fieldType: string;
    fieldId: string;
    row: TableRow;
    updateRow: (id: number, updates: Partial<Omit<TableRow, 'id' | 'createdAt'>>) => Promise<void>;
    setImageModal: (modal: { images: { url: string; name: string; fileId: number }[]; index: number } | null) => void;
    imageModal: { images: { url: string; name: string; fileId: number }[]; index: number } | null;
  }) {
    console.log('[handleDeleteFileOrImage] called with:', { fileId, fieldType, fieldId, row });
    // Remove the file from IDB
    await deleteFileWithSync(fileId);
    let newData;
    if (fieldType === 'images' || fieldType === 'files') {
      // Remove from array
      const arr = Array.isArray(row.data[fieldId]) ? row.data[fieldId] : [];
      const newArr = arr.filter((v) => v && typeof v === 'object' && 'fileId' in v && v.fileId !== fileId);
      newData = { ...row.data, [fieldId]: newArr };
      console.log('[handleDeleteFileOrImage] new array after deletion:', newArr);
    } else if (fieldType === 'image' || fieldType === 'file') {
      // Set to null
      newData = { ...row.data, [fieldId]: null };
      console.log('[handleDeleteFileOrImage] set field to null');
    } else {
      console.warn('[handleDeleteFileOrImage] unknown fieldType:', fieldType);
      return;
    }
    if (typeof row.id === 'number') {
      console.log('[handleDeleteFileOrImage] updating row', row.id, 'with data:', newData);
      await updateRow(row.id, { data: newData });
    } else {
      console.warn('[handleDeleteFileOrImage] row.id is not a number:', row.id);
    }
    // Update modal state
    if (imageModal) {
      const newImages = imageModal.images.filter((img) => img.fileId !== fileId);
      console.log('[handleDeleteFileOrImage] newImages for modal:', newImages);
      if (newImages.length === 0) {
        console.log('[handleDeleteFileOrImage] closing modal');
        closeImageModal();
      } else {
        const newIndex = Math.max(0, imageModal.index - (imageModal.index === newImages.length ? 1 : 0));
        console.log('[handleDeleteFileOrImage] updating modal, new index:', newIndex);
        setImageModal({ images: newImages, index: newIndex });
      }
    }
  }

  return (
    <div className="flex overflow-auto flex-col flex-grow px-1 min-w-0 sm:px-2">
      {/* Modals */}
      <AddColumnModal
        open={showAddColumn}
        onClose={() => setShowAddColumn(false)}
        onAddColumn={async (field) => {
          try {
            await addColumn(field);
            await refreshTables();
            const updated =
              (await refreshTables(),
              activeTable && (await refreshTables(), activeTable.id)
                ? useAppStore.getState().tables.find((t) => t.id === activeTable.id) || activeTable
                : activeTable);
            setActiveTable(updated);
            setShowAddColumn(false);
          } catch {}
        }}
      />
      <EditColumnModal
        open={showEditColumn}
        onClose={() => {
          setShowEditColumn(false);
          setColumnToEdit(null);
        }}
        onEditColumn={async (field) => {
          try {
            // update column logic
            if (activeTable && typeof activeTable.id === 'number' && field.id) {
              await useAppStore.getState().updateColumn(activeTable.id, field);
              await refreshTables();
              setActiveTable(
                useAppStore.getState().tables.find((t) => t.id === activeTable.id) || activeTable
              );
            }
          } catch {}
        }}
        column={columnToEdit!}
      />
      <ColumnHeaderModal
        open={showColumnHeaderModal}
        onClose={() => {
          setShowColumnHeaderModal(false);
          setColumnForModal(null);
        }}
        column={columnForModal!}
        onEditColumn={(field) => {
          setColumnToEdit(field);
          setShowEditColumn(true);
        }}
        onDeleteColumn={(field) => {
          setColumnToDelete(field);
          setShowDeleteColumn(true);
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

      <TableSchemaModal
        open={showSchemaModal}
        onClose={() => setShowSchemaModal(false)}
        table={activeTable}
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
            className="p-6 mx-4 w-96 max-w-md bg-white rounded-lg shadow-lg dark:bg-gray-800 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center mb-4">
              <AlertTriangle className="mr-3 w-6 h-6 text-yellow-500 dark:text-yellow-400" />
              <h2
                id="delete-modal-title"
                className="text-lg font-semibold text-gray-900 dark:text-gray-100"
              >
                Confirm Delete
              </h2>
            </div>
            <p className="text-gray-700 dark:text-gray-300">
              {deleteType === 'rows'
                ? `Are you sure you want to delete ${selectedRows.size} selected row(s)? This action cannot be undone.`
                : 'Are you sure you want to delete this entire table? This action cannot be undone.'}
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteType(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md transition-colors duration-200 cursor-pointer dark:text-gray-300 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={deleteType === 'rows' ? handleDeleteRows : handleDeleteTable}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md transition-colors duration-200 cursor-pointer dark:bg-red-500 hover:bg-red-700 dark:hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                type="button"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {imageModal && imageModal.images && typeof imageModal.index === 'number' && (
        <div
          className={`flex fixed inset-0 z-50 justify-center items-center bg-black bg-opacity-60 transition-opacity duration-200 ${imageModalClosing ? 'opacity-0' : 'opacity-100'} ${imageModalFullscreen ? 'p-0' : ''}`}
          onClick={closeImageModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="image-modal-title"
        >
          <div
            className={`flex flex-col items-center ${imageModalFullscreen ? 'p-0 w-screen max-w-none h-screen rounded-none max-h-none' : 'p-4 w-full max-w-lg'} bg-white rounded-lg shadow-lg dark:bg-gray-800 animate-scale-in relative`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Minimize button in fullscreen mode */}
            {imageModalFullscreen && (
              <button
                className="fixed top-4 right-4 z-50 p-2 bg-gray-100 rounded-full cursor-pointer dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-primary"
                onClick={() => setImageModalFullscreen(false)}
                title="Minimize"
                aria-label="Minimize image"
                type="button"
              >
                <Minimize2 className="w-6 h-6 cursor-pointer" />
              </button>
            )}
            {/* Navigation arrows for multiple images */}
            {imageModal.images.length > 1 && (
              <>
                <button
                  className="absolute left-2 top-1/2 z-10 p-2 bg-gray-100 rounded-full transform -translate-y-1/2 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-primary"
                  onClick={() => setImageModal((m) => m && { ...m, index: (m.index - 1 + m.images.length) % m.images.length })}
                  title="Previous image"
                  aria-label="Previous image"
                  type="button"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  className="absolute right-2 top-1/2 z-10 p-2 bg-gray-100 rounded-full transform -translate-y-1/2 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-primary"
                  onClick={() => setImageModal((m) => m && { ...m, index: (m.index + 1) % m.images.length })}
                  title="Next image"
                  aria-label="Next image"
                  type="button"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
            <img
              src={imageModal.images[imageModal.index]?.url || ''}
              alt={imageModal.images[imageModal.index]?.name || ''}
              className={`mb-4 ${imageModalFullscreen ? 'object-contain w-full h-full max-h-screen max-w-screen' : 'max-w-full max-h-96'} rounded`}
            />
            {/* Status Bar */}
            <ImageStatusBar
              url={imageModal.images[imageModal.index]?.url || ''}
              name={imageModal.images[imageModal.index]?.name || ''}
              onDelete={async () => {
                console.log('onDelete in modal called');
                if (!activeTable) {
                  console.log('activeTable is falsy');
                  return;
                }
                if (!imageModal) {
                  console.log('imageModal is falsy');
                  return;
                }
                if (!imageModal.images) {
                  console.log('imageModal.images is falsy');
                  return;
                }
                if (typeof imageModal.index !== 'number') {
                  console.log('imageModal.index is not a number:', imageModal.index);
                  return;
                }
                const currentImage = imageModal.images[imageModal.index];
                if (!currentImage) {
                  console.log('currentImage is falsy');
                  return;
                }
                // Find the row and field for this image/file
                for (const row of orderedRows) {
                  for (const field of activeTable.fields) {
                    const value = row.data[field.id];
                    if (Array.isArray(value)) {
                      const idx = value.findIndex(
                        (v) => v && typeof v === 'object' && 'fileId' in v && v.fileId === currentImage.fileId
                      );
                      console.log('Checking array field', field.id, 'row', row.id, 'idx', idx, 'currentImage.fileId', currentImage.fileId, 'value', value);
                      if (idx !== -1) {
                        await handleDeleteFileOrImage({
                          fileId: currentImage.fileId,
                          fieldType: field.type,
                          fieldId: field.id,
                          row,
                          updateRow,
                          setImageModal,
                          imageModal,
                        });
                        return;
                      }
                    } else if (
                      value && typeof value === 'object' && 'fileId' in value && value.fileId === currentImage.fileId
                    ) {
                      console.log('Found single file/image field', field.id, 'row', row.id, 'currentImage.fileId', currentImage.fileId, 'value', value);
                      await handleDeleteFileOrImage({
                        fileId: currentImage.fileId,
                        fieldType: field.type,
                        fieldId: field.id,
                        row,
                        updateRow,
                        setImageModal,
                        imageModal,
                      });
                      return;
                    }
                  }
                }
                console.log('No matching row/field found for currentImage.fileId', currentImage.fileId);
              }}
              fullscreen={imageModalFullscreen}
              onToggleFullscreen={() => setImageModalFullscreen((f) => !f)}
            />
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col gap-2 justify-between items-start p-2 border-b sm:flex-row sm:items-center">
        <div className="flex flex-wrap items-center space-x-2">
          {selectedRows.size > 0 && (
            <button
              onClick={() => confirmDelete('rows')}
              className="flex items-center px-2 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer sm:px-3 sm:py-2 sm:text-sm"
              type="button"
            >
              <Trash2 className="mr-1 w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">
                Delete {selectedRows.size} Row{selectedRows.size > 1 ? 's' : ''}
              </span>
              <span className="sm:hidden">Del {selectedRows.size}</span>
            </button>
          )}
          {/* Row Height Dropdown */}
          <div className="flex items-center space-x-1">
            <label className="text-xs text-gray-500 dark:text-gray-300">Height:</label>
            <select
              value={rowHeight}
              onChange={(e) => setRowHeight(Number(e.target.value))}
              className="px-1 py-1 text-xs rounded border cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400"
              style={{ minWidth: 60 }}
            >
              <option
                value={40}
                style={{
                  backgroundColor: theme === 'dark' ? '#1e3a8a' : '#dbeafe',
                  color: theme === 'dark' ? '#93c5fd' : '#1d4ed8',
                }}
              >
                Small
              </option>
              <option
                value={60}
                style={{
                  backgroundColor: theme === 'dark' ? '#1e3a8a' : '#dbeafe',
                  color: theme === 'dark' ? '#93c5fd' : '#1d4ed8',
                }}
              >
                Medium
              </option>
              <option
                value={80}
                style={{
                  backgroundColor: theme === 'dark' ? '#1e3a8a' : '#dbeafe',
                  color: theme === 'dark' ? '#93c5fd' : '#1d4ed8',
                }}
              >
                Large
              </option>
            </select>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowSchemaModal(true)}
            className="flex items-center p-1 text-xs font-medium rounded-md transition-colors cursor-pointer md:py-2 md:px-3 md:text-sm"
            type="button"
          >
            <Code className="mr-1 w-4 h-4" /> Schema
          </button>

          <button
            onClick={() => setShowAddColumn(true)}
            className="flex items-center p-1 text-xs font-medium rounded-md transition-colors cursor-pointer md:py-2 md:px-3 md:text-sm"
            type="button"
          >
            <Plus className="mr-1 w-4 h-4" /> Add Column
          </button>

          <button
            onClick={() => confirmDelete('table')}
            className="flex items-center p-1 text-xs font-medium rounded-md transition-colors cursor-pointer md:px-3 md:py-2 md:text-sm"
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
          className="rdg-custom"
          defaultColumnOptions={{
            resizable: true,
            sortable: true,
          }}
          rowClass={(row) => cn(isRowMatch(row) && 'bg-yellow-100 dark:bg-yellow-900/40')}
          style={{
            backgroundColor: theme === 'dark' ? '#303b4f' : '#ffffff',
            color: theme === 'dark' ? '#f9fafc' : '#111827',
          }}
        />
        {/* Summary Footer Row */}
        {showSummary && (
          <div
            className={cn(
              'flex overflow-x-auto flex-wrap w-full text-xs font-medium bg-gray-50 border-t border-gray-200 transition-colors duration-200 dark:bg-gray-900/80 dark:border-gray-700',
            )}
            style={{ minWidth: 0 }}
          >
            {/* Row number column */}
            <div className="flex-shrink-0 px-1 py-2 w-8 min-w-0 font-semibold text-center sm:px-2 sm:py-3 sm:w-12">
              <span className="hidden font-mono text-sm text-gray-800 whitespace-nowrap sm:inline dark:text-gray-100">Summary</span>
              <span className="text-gray-800 whitespace-nowrap sm:hidden dark:text-gray-100">Sum</span>
            </div>

            {/* Select column */}
            <div className="flex-shrink-0 px-1 py-2 w-6 min-w-0 text-center sm:px-2 sm:py-3 sm:w-10">
              {/* Empty space for checkbox column */}
            </div>

            {/* Data columns */}
            {activeTable.fields.map((field) => (
              <div
                key={field.id}
                className={cn(
                  'flex-shrink-0 px-1 py-2 sm:px-2 sm:py-3 text-right transition-colors duration-200 min-w-0',
                  field.type === 'number'
                    ? 'font-semibold text-blue-700 dark:text-blue-200'
                    : 'text-gray-600 dark:text-gray-400',
                )}
              >
                {field.type === 'number' ? (
                  <div className="flex flex-col items-end gap-0.5 sm:gap-1 min-w-0">
                    <span className="min-w-0 font-mono text-xs text-gray-900 truncate sm:text-sm dark:text-blue-100">
                    {field.name}: {numberFieldSums[field.id]?.toLocaleString() || '0'}
                    </span>
                  </div>
                ) :<></>}
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Add Row Button at Bottom Left */}
      <div className="flex items-center p-2" style={{ minHeight: 40 }}>
        <button
          onClick={handleAddRow}
          className="flex items-center px-4 py-1 text-sm font-medium bg-white rounded-md border border-gray-200 shadow-sm cursor-pointer dark:bg-primary hover:bg-gray-50 dark:text-white"
        >
          + Add
        </button>
      </div>
    </div>
  );
}

// ImageStatusBar component for the image modal
function ImageStatusBar({ url, name, onDelete, fullscreen, onToggleFullscreen }: {
  url: string;
  name: string;
  onDelete: () => void;
  fullscreen?: boolean;
  onToggleFullscreen?: () => void;
}) {
  const [type, setType] = React.useState<string>('');
  const [size, setSize] = React.useState<number>(0);

  React.useEffect(() => {
    // Fetch the image as a blob to get type and size
    fetch(url)
      .then((res) => res.blob())
      .then((blob) => {
        setType(blob.type.toUpperCase().replace('IMAGE/', ''));
        setSize(blob.size);
      });
  }, [url]);

  const handleDownload = () => {
    fetch(url)
      .then((res) => res.blob())
      .then((blob) => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = name;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      });
  };

  return (
    <div className="flex justify-between items-center px-2 py-2 mt-2 w-full text-xs bg-gray-50 rounded-b-lg border-t border-gray-200 dark:border-gray-700 dark:bg-gray-900/60">
      <div className="flex gap-2 items-center">
        <span className="font-medium text-gray-700 dark:text-gray-200">{name}</span>
        <span className="text-gray-400">{type}</span>
        <span className="text-gray-400">{(size / 1024).toFixed(1)} KB</span>
      </div>
      <div className="flex gap-3 items-center">
        <button
          className="transition-colors cursor-pointer text-primary hover:text-red-600"
          onClick={() => { console.log('Delete button clicked'); onDelete(); }}
          title="Delete image"
          aria-label="Delete image"
          type="button"
        >
          <Trash2 className="w-5 h-5" />
        </button>
        <button
          className="transition-colors cursor-pointer hover:text-blue-600 text-primary"
          onClick={handleDownload}
          title="Download image"
          aria-label="Download image"
          type="button"
        >
          <Download className="w-5 h-5" />
        </button>
        {onToggleFullscreen && (
          <button
            className="transition-colors cursor-pointer hover:text-green-600 text-primary"
            onClick={onToggleFullscreen}
            title={fullscreen ? 'Minimize' : 'Expand'}
            aria-label={fullscreen ? 'Minimize image' : 'Expand image'}
            type="button"
          >
            {fullscreen ? <Minimize2 className="w-5 h-5 cursor-pointer" /> : <Maximize2 className="w-5 h-5 cursor-pointer" />}
          </button>
        )}
      </div>
    </div>
  );
}
