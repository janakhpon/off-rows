import { ApiService } from './api';
import { useAppStore } from './store';
import { useCloudSyncStore, getSyncStatus } from './cloudSyncStore';
import { tableOperations, rowOperations, viewOperations } from './database';
import { Table, TableRow, ViewSettings } from './schemas';

// Types following functional programming principles
interface SyncResult {
  success: boolean;
  syncedTables: number;
  syncedRows: number;
  syncedViews: number;
  error?: string;
}

interface SyncData {
  tables: Array<{
    id: string;
    name: string;
    description?: string;
    fields: Array<Record<string, unknown>>;
    colWidths?: Record<string, unknown>;
    rowHeights?: Record<string, unknown>;
    createdAt?: string;
    updatedAt?: string;
  }>;
  rows: Array<{
    id: string;
    tableId: string;
    rowKey?: string;
    data: Record<string, unknown>;
    order?: number;
    createdAt?: string;
    updatedAt?: string;
  }>;
  views: Array<{
    id: string;
    tableId: string;
    name: string;
    hiddenFields: string[];
    filters: Array<Record<string, unknown>>;
    sorts: Array<Record<string, unknown>>;
    rowHeight: string;
    colorRules: Array<Record<string, unknown>>;
    isDefault?: boolean;
    createdAt?: string;
    updatedAt?: string;
  }>;
}

// Pure function to transform local data to sync format
const transformLocalDataToSyncFormat = (tables: Table[], rows: TableRow[], views: ViewSettings[]): SyncData => ({
  tables: tables.map(table => ({
    id: table.id?.toString() || '',
    name: table.name,
    ...(table.description && { description: table.description }),
    fields: table.fields,
    ...(table.colWidths && { colWidths: table.colWidths }),
    ...(table.rowHeights && { rowHeights: table.rowHeights }),
    version: table.version || 0, // Include version for optimistic concurrency control
    ...(table.createdAt && { createdAt: table.createdAt.toISOString() }),
    ...(table.updatedAt && { updatedAt: table.updatedAt.toISOString() }),
  })),
  rows: rows.map(row => ({
    id: row.id?.toString() || '',
    tableId: row.tableId?.toString() || '',
    ...(row.rowKey && { rowKey: row.rowKey }),
    data: row.data,
    ...(row.order !== undefined && { order: row.order }),
    version: row.version || 0, // Include version for optimistic concurrency control
    ...(row.createdAt && { createdAt: row.createdAt.toISOString() }),
    ...(row.updatedAt && { updatedAt: row.updatedAt.toISOString() }),
  })),
  views: views.map(view => ({
    id: view.id?.toString() || '',
    tableId: view.tableId?.toString() || '',
    name: view.name,
    hiddenFields: view.hiddenFields,
    filters: view.filters,
    sorts: view.sorts,
    rowHeight: view.rowHeight,
    colorRules: view.colorRules,
    ...(view.isDefault !== undefined && { isDefault: view.isDefault }),
    version: view.version || 0, // Include version for optimistic concurrency control
    ...(view.createdAt && { createdAt: view.createdAt.toISOString() }),
    ...(view.updatedAt && { updatedAt: view.updatedAt.toISOString() }),
  })),
});

// Helper: Mark conflicted items and refresh from server
async function handleSyncConflicts(conflicts: unknown[]) {
  const { setSyncNotification } = useAppStore.getState();
  let hadConflict = false;
  for (const conflict of conflicts) {
    if (!conflict || typeof conflict !== 'object' || !('type' in conflict) || !('id' in conflict)) continue;
    const c = conflict as { type: string; id: string; message?: string };
    hadConflict = true;
    try {
      if (c.type === 'table') {
        await tableOperations.update(Number(c.id), { syncConflict: true, syncError: c.message });
        // Try to fetch latest from server
        try {
          const serverTable = await ApiService.getTableFromCloud(c.id);
          if (serverTable) {
            await tableOperations.update(Number(c.id), { ...serverTable, syncConflict: false, syncError: undefined });
          } else {
            await tableOperations.delete(Number(c.id));
          }
        } catch {}
      } else if (c.type === 'row') {
        await rowOperations.update(Number(c.id), { syncConflict: true, syncError: c.message });
        try {
          const serverRow = await ApiService.getTableRowFromCloud(c.id);
          if (serverRow) {
            await rowOperations.update(Number(c.id), { ...serverRow, syncConflict: false, syncError: undefined });
          } else {
            await rowOperations.delete(Number(c.id));
          }
        } catch {}
      } else if (c.type === 'view') {
        await viewOperations.update(Number(c.id), { syncConflict: true, syncError: c.message });
        try {
          const serverView = await ApiService.getTableViewFromCloud(c.id);
          if (serverView) {
            await viewOperations.update(Number(c.id), { ...serverView, syncConflict: false, syncError: undefined });
          } else {
            await viewOperations.delete(Number(c.id));
          }
        } catch {}
      }
    } catch {
      // Ignore errors in marking conflicts
    }
  }
  if (hadConflict) {
    if (setSyncNotification) setSyncNotification('Some items could not be synced. Click to review.');
  }
}


class TableSyncService {
  private isRunning = false;

  /**
   * Check if backend is available and update store
   * Pure function that doesn't mutate external state
   */
  async checkBackendAvailability(): Promise<boolean> {
    try {
      const status = await ApiService.getBackendStatus();
      const isAvailable = status.available;
      useCloudSyncStore.getState().setBackendAvailable(isAvailable);
      return isAvailable;
    } catch (error) {
      console.error('[TableSyncService] Failed to check backend availability:', error);
      useCloudSyncStore.getState().setBackendAvailable(false);
      return false;
    }
  }

  /**
   * Check if sync should be enabled based on current state
   * Pure function that doesn't mutate state
   */
  private shouldSync(isOnline: boolean): boolean {
    const state = useCloudSyncStore.getState();
    const syncStatus = getSyncStatus(state, isOnline);
    return syncStatus.shouldSync;
  }

  /**
   * Sync all local data to cloud
   * Returns a result object instead of throwing
   */
  async syncToCloud(isOnline: boolean): Promise<SyncResult> {
    if (this.isRunning) {
      console.log('[TableSyncService] Sync already in progress, skipping...');
      return { success: false, syncedTables: 0, syncedRows: 0, syncedViews: 0, error: 'Sync already in progress' };
    }

    if (!this.shouldSync(isOnline)) {
      console.log('[TableSyncService] Cloud sync not enabled or backend unavailable');
      return { success: false, syncedTables: 0, syncedRows: 0, syncedViews: 0, error: 'Sync not enabled' };
    }

    // Prevent duplicate syncing within 5 seconds
    const lastSyncTime = useCloudSyncStore.getState().lastTableSyncTime;
    if (lastSyncTime) {
      const timeSinceLastSync = Date.now() - new Date(lastSyncTime).getTime();
      if (timeSinceLastSync < 5000) { // 5 seconds
        console.log('[TableSyncService] Sync skipped - too soon since last sync');
        return { success: false, syncedTables: 0, syncedRows: 0, syncedViews: 0, error: 'Sync too soon' };
      }
    }

    this.isRunning = true;
    useCloudSyncStore.getState().setSyncInProgress(true);

    try {
      console.log('[TableSyncService] Starting sync to cloud...');

      // Get all local data
      const { tables, rows, views } = useAppStore.getState();
      
      // Check if there's any data to sync
      if (tables.length === 0 && rows.length === 0 && views.length === 0) {
        console.log('[TableSyncService] No data to sync - all collections are empty');
        return { success: true, syncedTables: 0, syncedRows: 0, syncedViews: 0 };
      }
      
      // Transform data using pure function
      const syncData = transformLocalDataToSyncFormat(tables, rows, views);

      // Debug: Log what we're sending
      console.log('[TableSyncService] Sending sync data:', {
        tablesCount: syncData.tables.length,
        rowsCount: syncData.rows.length,
        viewsCount: syncData.views.length,
        sampleTable: syncData.tables[0],
        sampleRow: syncData.rows[0],
        sampleView: syncData.views[0],
      });

      // Send to backend
      const result = await ApiService.syncTablesToCloud(syncData);
      // Handle conflicts robustly
      if (result.conflicts && result.conflicts.length > 0) {
        await handleSyncConflicts(result.conflicts);
      }
      
      console.log('[TableSyncService] Sync completed:', {
        tables: result.tables.length,
        rows: result.rows.length,
        views: result.views.length,
      });

      // Update local data with server versions to resolve conflicts
      if (result.tables.length > 0 || result.rows.length > 0 || result.views.length > 0) {
        console.log('[TableSyncService] Updating local data with server versions');
        
        // Update tables with server versions
        for (const serverTable of result.tables) {
          const localTable = tables.find(t => t.id?.toString() === (serverTable.id as string));
          if (localTable) {
            await tableOperations.update(localTable.id!, {
              version: (serverTable.version as number) || 0,
              updatedAt: new Date((serverTable.updatedAt as string) || (serverTable.createdAt as string) || Date.now()),
            });
          }
        }
        
        // Update rows with server versions
        for (const serverRow of result.rows) {
          const localRow = rows.find(r => r.id?.toString() === (serverRow.id as string));
          if (localRow) {
            await rowOperations.update(localRow.id!, {
              rowKey: (serverRow.rowKey as string) || localRow.rowKey,
              version: (serverRow.version as number) || 0,
              updatedAt: new Date((serverRow.updatedAt as string) || (serverRow.createdAt as string) || Date.now()),
            });
          }
        }
        
        // Update views with server versions
        for (const serverView of result.views) {
          const localView = views.find(v => v.id?.toString() === (serverView.id as string));
          if (localView) {
            await viewOperations.update(localView.id!, {
              version: (serverView.version as number) || 0,
              updatedAt: new Date((serverView.updatedAt as string) || (serverView.createdAt as string) || Date.now()),
            });
          }
        }
        
        // Refresh app state to reflect updated versions
        await useAppStore.getState().refreshTables();
      }
      
      // Only increment synced changes if backend actually processed data
      const actualSyncedChanges = result.tables.length + result.rows.length + result.views.length;
      
      if (actualSyncedChanges > 0) {
        // Update last sync time only if data was actually synced
        useCloudSyncStore.getState().setLastTableSyncTime(new Date().toISOString());
        
        // Reset pending changes count
        useCloudSyncStore.getState().setPendingTableChanges(0);
        
        // Increment synced changes based on actual backend response
        useCloudSyncStore.getState().setSyncedTableChanges(
          useCloudSyncStore.getState().syncedTableChanges + actualSyncedChanges
        );
      } else {
        console.log('[TableSyncService] No data was actually synced to backend');
      }

      return {
        success: true,
        syncedTables: result.tables.length,
        syncedRows: result.rows.length,
        syncedViews: result.views.length,
      };

    } catch (error) {
      console.error('[TableSyncService] Sync to cloud failed:', error);
      return {
        success: false,
        syncedTables: 0,
        syncedRows: 0,
        syncedViews: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    } finally {
      this.isRunning = false;
      useCloudSyncStore.getState().setSyncInProgress(false);
    }
  }

  /**
   * Sync data from cloud to local
   * Returns a result object instead of throwing
   */
  async syncFromCloud(isOnline: boolean): Promise<SyncResult> {
    if (this.isRunning) {
      console.log('[TableSyncService] Sync already in progress, skipping...');
      return { success: false, syncedTables: 0, syncedRows: 0, syncedViews: 0, error: 'Sync already in progress' };
    }

    if (!this.shouldSync(isOnline)) {
      console.log('[TableSyncService] Cloud sync not enabled or backend unavailable');
      return { success: false, syncedTables: 0, syncedRows: 0, syncedViews: 0, error: 'Sync not enabled' };
    }

    this.isRunning = true;
    useCloudSyncStore.getState().setSyncInProgress(true);

    try {
      console.log('[TableSyncService] Starting sync from cloud...');

      // Get all data from backend
      const cloudTables = await ApiService.getTablesFromCloud();
      
      // For each table, get its rows and views
      const allRows: Record<string, unknown>[] = [];
      const allViews: Record<string, unknown>[] = [];
      
      for (const table of cloudTables) {
        const tableId = (table as Record<string, unknown>).id as number;
        if (tableId) {
          const rows = await ApiService.getTableRowsFromCloud(tableId);
          const views = await ApiService.getTableViewsFromCloud(tableId);
          allRows.push(...rows);
          allViews.push(...views);
        }
      }

      // Clear existing data
      const { resetState } = useAppStore.getState();
      resetState();

      // Import tables
      for (const tableData of cloudTables) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const table = tableData as any;
        await tableOperations.add({
          name: table.name,
          description: table.description,
          fields: table.fields,
          colWidths: table.colWidths,
          rowHeights: table.rowHeights,
          version: table.version ?? 0,
        });
      }

      // Import rows
      for (const rowData of allRows) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const row = rowData as any;
        await rowOperations.add({
          tableId: row.tableId,
          rowKey: row.rowKey,
          data: row.data,
          order: row.order,
          version: row.version ?? 0,
        });
      }

      // Import views
      for (const viewData of allViews) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const view = viewData as any;
        await viewOperations.add({
          tableId: view.tableId,
          name: view.name,
          hiddenFields: view.hiddenFields,
          filters: view.filters,
          sorts: view.sorts,
          rowHeight: view.rowHeight,
          colorRules: view.colorRules,
          isDefault: view.isDefault,
          version: view.version ?? 0,
        });
      }

      // Refresh app state
      await useAppStore.getState().refreshTables();

      console.log('[TableSyncService] Sync from cloud completed:', {
        tables: cloudTables.length,
        rows: allRows.length,
        views: allViews.length,
      });

      // Update last sync time
      useCloudSyncStore.getState().setLastTableSyncTime(new Date().toISOString());

      return {
        success: true,
        syncedTables: cloudTables.length,
        syncedRows: allRows.length,
        syncedViews: allViews.length,
      };

    } catch (error) {
      console.error('[TableSyncService] Sync from cloud failed:', error);
      return {
        success: false,
        syncedTables: 0,
        syncedRows: 0,
        syncedViews: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    } finally {
      this.isRunning = false;
      useCloudSyncStore.getState().setSyncInProgress(false);
    }
  }

  /**
   * Trigger sync based on current settings
   * Pure function that doesn't mutate external state
   */
  async triggerSync(isOnline: boolean): Promise<SyncResult> {
    const state = useCloudSyncStore.getState();
    const syncStatus = getSyncStatus(state, isOnline);
    
    if (!syncStatus.canAutoSync) {
      return { success: false, syncedTables: 0, syncedRows: 0, syncedViews: 0, error: 'Auto sync not enabled' };
    }

    return this.syncToCloud(isOnline);
  }

  /**
   * Increment pending changes count
   * Pure function that doesn't mutate external state
   */
  incrementPendingChanges(): void {
    useCloudSyncStore.getState().incrementPendingChanges();
  }

  /**
   * Decrement pending changes count
   * Pure function that doesn't mutate external state
   */
  decrementPendingChanges(): void {
    useCloudSyncStore.getState().decrementPendingChanges();
  }

  /**
   * Reset sync counts
   * Pure function that doesn't mutate external state
   */
  resetSyncCounts(): void {
    useCloudSyncStore.getState().resetSyncCounts();
  }
}

// Export singleton instance
export const tableSyncService = new TableSyncService(); 