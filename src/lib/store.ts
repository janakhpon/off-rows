import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { Table, TableRow, ViewSettings } from './schemas';
import { tableOperations, rowOperations, viewOperations, initializeDatabase } from './database';

interface AppState {
  // State
  tables: Table[];
  activeTable: Table | null;
  rows: TableRow[];
  views: ViewSettings[];
  activeView: ViewSettings | null;
  loading: boolean;
  error: string | null;
  sidebarCollapsed: boolean;
  selectedRows: Set<number>;
  
  // Actions
  initialize: () => Promise<void>;
  setActiveTable: (table: Table | null) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setSelectedRows: (rows: Set<number>) => void;
  setError: (error: string | null) => void;
  
  // Table operations
  addTable: (table: Omit<Table, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTable: (id: number, updates: Partial<Omit<Table, 'id' | 'createdAt'>>) => Promise<void>;
  deleteTable: (id: number) => Promise<void>;
  refreshTables: () => Promise<void>;
  
  // Row operations
  addRow: (row: Omit<TableRow, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateRow: (id: number, updates: Partial<Omit<TableRow, 'id' | 'createdAt'>>) => Promise<void>;
  deleteRow: (id: number) => Promise<void>;
  bulkUpdateRows: (rows: TableRow[]) => Promise<void>;
  refreshRows: () => Promise<void>;
  
  // View operations
  addView: (view: Omit<ViewSettings, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateView: (id: number, updates: Partial<Omit<ViewSettings, 'id' | 'createdAt'>>) => Promise<void>;
  deleteView: (id: number) => Promise<void>;
  setActiveView: (view: ViewSettings | null) => void;
  refreshViews: () => Promise<void>;
  
  // Column operations
  addColumn: (field: Omit<Table['fields'][0], 'id'> & { id?: string }) => Promise<void>;
  deleteColumn: (fieldId: string) => Promise<void>;
  
  // Add actions for colWidths/rowHeights
  updateColWidths: (tableId: number, colWidths: Record<string, number>) => Promise<void>;
  updateRowHeights: (tableId: number, rowHeights: Record<string, number>) => Promise<void>;
}

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        tables: [],
        activeTable: null,
        rows: [],
        views: [],
        activeView: null,
        loading: false,
        error: null,
        sidebarCollapsed: false,
        selectedRows: new Set(),

        // Basic actions
        initialize: async () => {
          set({ loading: true, error: null });
          try {
            await initializeDatabase();
            await get().refreshTables();
          } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to initialize' });
          } finally {
            set({ loading: false });
          }
        },

        setActiveTable: (table) => {
          set({ activeTable: table, selectedRows: new Set() });
          if (table) {
            get().refreshRows();
            get().refreshViews();
          } else {
            set({ rows: [], views: [], activeView: null });
          }
        },

        setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
        setSelectedRows: (rows) => set({ selectedRows: rows }),
        setError: (error) => set({ error }),

        // Table operations
        addTable: async (table) => {
          set({ loading: true, error: null });
          try {
            await tableOperations.add(table);
            await get().refreshTables();
            
            // Set as active table if it's the first one
            const { tables } = get();
            if (tables.length === 1) {
              get().setActiveTable(tables[0]);
            }
          } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to add table' });
          } finally {
            set({ loading: false });
          }
        },

        updateTable: async (id, updates) => {
          set({ loading: true, error: null });
          try {
            await tableOperations.update(id, updates);
            await get().refreshTables();
            
            // Update active table if it was the one updated
            const { activeTable } = get();
            if (activeTable?.id === id) {
              const updatedTable = get().tables.find(t => t.id === id);
              if (updatedTable) {
                set({ activeTable: updatedTable });
              }
            }
          } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to update table' });
          } finally {
            set({ loading: false });
          }
        },

        deleteTable: async (id) => {
          set({ loading: true, error: null });
          try {
            await tableOperations.delete(id);
            await get().refreshTables();
            
            // Clear active table if it was deleted
            const { activeTable } = get();
            if (activeTable?.id === id) {
              const { tables } = get();
              set({ activeTable: tables.length > 0 ? tables[0] : null });
            }
          } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to delete table' });
          } finally {
            set({ loading: false });
          }
        },

        refreshTables: async () => {
          try {
            const tables = await tableOperations.getAll();
            set({ tables });
          } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to refresh tables' });
          }
        },

        // Row operations
        addRow: async (row) => {
          set({ loading: true, error: null });
          try {
            await rowOperations.add(row);
            await get().refreshRows();
          } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to add row' });
          } finally {
            set({ loading: false });
          }
        },

        updateRow: async (id, updates) => {
          set({ loading: true, error: null });
          try {
            await rowOperations.update(id, updates);
            await get().refreshRows();
          } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to update row' });
          } finally {
            set({ loading: false });
          }
        },

        deleteRow: async (id) => {
          set({ loading: true, error: null });
          try {
            await rowOperations.delete(id);
            await get().refreshRows();
            set({ selectedRows: new Set() });
          } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to delete row' });
          } finally {
            set({ loading: false });
          }
        },

        bulkUpdateRows: async (rows) => {
          set({ loading: true, error: null });
          try {
            await rowOperations.bulkUpdate(rows);
            set({ rows });
          } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to update rows' });
          } finally {
            set({ loading: false });
          }
        },

        refreshRows: async () => {
          const { activeTable } = get();
          if (!activeTable) {
            set({ rows: [] });
            return;
          }

          try {
            const rows = await rowOperations.getByTableId(activeTable.id!);
            set({ rows });
          } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to refresh rows' });
          }
        },

        // View operations
        addView: async (view) => {
          set({ loading: true, error: null });
          try {
            await viewOperations.add(view);
            await get().refreshViews();
          } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to add view' });
          } finally {
            set({ loading: false });
          }
        },

        updateView: async (id, updates) => {
          set({ loading: true, error: null });
          try {
            await viewOperations.update(id, updates);
            await get().refreshViews();
          } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to update view' });
          } finally {
            set({ loading: false });
          }
        },

        deleteView: async (id) => {
          set({ loading: true, error: null });
          try {
            await viewOperations.delete(id);
            await get().refreshViews();
          } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to delete view' });
          } finally {
            set({ loading: false });
          }
        },

        setActiveView: (view) => set({ activeView: view }),
        refreshViews: async () => {
          const { activeTable } = get();
          if (!activeTable) {
            set({ views: [], activeView: null });
            return;
          }

          try {
            const views = await viewOperations.getByTableId(activeTable.id!);
            const defaultView = views.find(v => v.isDefault);
            set({ views, activeView: defaultView || null });
          } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to refresh views' });
          }
        },

        // Column operations
        addColumn: async (field) => {
          const { activeTable } = get();
          if (!activeTable) return;
          const newField = { ...field, id: field.id || field.name.toLowerCase().replace(/\s+/g, '_') };
          const updatedFields = [...activeTable.fields, newField];
          await tableOperations.update(activeTable.id!, { fields: updatedFields });
          await get().refreshTables();
          // Optionally, update all rows to include the new field with default value
          const rows = await rowOperations.getByTableId(activeTable.id!);
          for (const row of rows) {
            if (!(newField.id in row.data)) {
              row.data[newField.id] = newField.defaultValue || null;
            }
          }
          await rowOperations.bulkUpdate(rows);
          await get().refreshRows();
        },
        deleteColumn: async (fieldId) => {
          const { activeTable } = get();
          if (!activeTable) return;
          const updatedFields = activeTable.fields.filter(f => f.id !== fieldId);
          await tableOperations.update(activeTable.id!, { fields: updatedFields });
          await get().refreshTables();
          // Remove the field from all rows
          const rows = await rowOperations.getByTableId(activeTable.id!);
          for (const row of rows) {
            delete row.data[fieldId];
          }
          await rowOperations.bulkUpdate(rows);
          await get().refreshRows();
        },

        // Add actions for colWidths/rowHeights
        updateColWidths: async (tableId, colWidths) => {
          await tableOperations.updateColWidths(tableId, colWidths);
          await get().refreshTables();
        },
        updateRowHeights: async (tableId, rowHeights) => {
          await tableOperations.updateRowHeights(tableId, rowHeights);
          await get().refreshTables();
        },
      }),
      {
        name: 'offrows-store',
        partialize: (state) => ({
          sidebarCollapsed: state.sidebarCollapsed,
          selectedRows: Array.from(state.selectedRows),
        }),
      }
    ),
    {
      name: 'offrows-store',
    }
  )
); 