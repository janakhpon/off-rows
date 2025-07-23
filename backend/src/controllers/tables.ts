import { Request, Response } from "express";
import { db } from "../db/client";
import { tables, tableRows, tableViews } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { generateRowKey } from "../utils/rowKey";

// Get all tables
export const listTables = async (req: Request, res: Response) => {
  try {
    const allTables = await db.select().from(tables).orderBy(tables.createdAt);
    res.json(allTables);
  } catch (error) {
    console.error("Error listing tables:", error);
    res.status(500).json({ error: "Failed to list tables" });
  }
};

// Get a single table by ID
export const getTable = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const table = await db.select().from(tables).where(eq(tables.id, parseInt(id))).limit(1);
    
    if (table.length === 0) {
      return res.status(404).json({ error: "Table not found" });
    }
    
    res.json(table[0]);
  } catch (error) {
    console.error("Error getting table:", error);
    res.status(500).json({ error: "Failed to get table" });
  }
};

// Create a new table
export const createTable = async (req: Request, res: Response) => {
  try {
    const tableData = req.body;
    const [newTable] = await db.insert(tables).values(tableData).returning();
    res.status(201).json(newTable);
  } catch (error) {
    console.error("Error creating table:", error);
    
    // Check if it's a unique constraint violation
    if (error instanceof Error && error.message.includes('tables_name_unique')) {
      return res.status(409).json({ 
        error: "Table name already exists",
        message: `A table with the name "${req.body.name}" already exists. Please choose a different name.`
      });
    }
    
    res.status(500).json({ error: "Failed to create table" });
  }
};

// Update a table
export const updateTable = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const [updatedTable] = await db
      .update(tables)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(tables.id, parseInt(id)))
      .returning();
    
    if (!updatedTable) {
      return res.status(404).json({ error: "Table not found" });
    }
    
    res.json(updatedTable);
  } catch (error) {
    console.error("Error updating table:", error);
    res.status(500).json({ error: "Failed to update table" });
  }
};

// Delete a table
export const deleteTable = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Delete related rows and views first (cascade should handle this, but being explicit)
    await db.delete(tableRows).where(eq(tableRows.tableId, parseInt(id)));
    await db.delete(tableViews).where(eq(tableViews.tableId, parseInt(id)));
    
    const [deletedTable] = await db
      .delete(tables)
      .where(eq(tables.id, parseInt(id)))
      .returning();
    
    if (!deletedTable) {
      return res.status(404).json({ error: "Table not found" });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting table:", error);
    res.status(500).json({ error: "Failed to delete table" });
  }
};

// Get all rows for a table
export const getTableRows = async (req: Request, res: Response) => {
  try {
    const { tableId } = req.params;
    const rows = await db
      .select()
      .from(tableRows)
      .where(eq(tableRows.tableId, parseInt(tableId)))
      .orderBy(tableRows.order, tableRows.createdAt);
    
    res.json(rows);
  } catch (error) {
    console.error("Error getting table rows:", error);
    res.status(500).json({ error: "Failed to get table rows" });
  }
};

// Create a new row
export const createTableRow = async (req: Request, res: Response) => {
  try {
    const rowData = req.body;
    const [newRow] = await db.insert(tableRows).values(rowData).returning();
    res.status(201).json(newRow);
  } catch (error) {
    console.error("Error creating table row:", error);
    res.status(500).json({ error: "Failed to create table row" });
  }
};

// Update a row
export const updateTableRow = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const [updatedRow] = await db
      .update(tableRows)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(tableRows.id, parseInt(id)))
      .returning();
    
    if (!updatedRow) {
      return res.status(404).json({ error: "Row not found" });
    }
    
    res.json(updatedRow);
  } catch (error) {
    console.error("Error updating table row:", error);
    res.status(500).json({ error: "Failed to update table row" });
  }
};

// Delete a row
export const deleteTableRow = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const [deletedRow] = await db
      .delete(tableRows)
      .where(eq(tableRows.id, parseInt(id)))
      .returning();
    
    if (!deletedRow) {
      return res.status(404).json({ error: "Row not found" });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting table row:", error);
    res.status(500).json({ error: "Failed to delete table row" });
  }
};

// Bulk upsert rows (for sync)
export const bulkUpsertRows = async (req: Request, res: Response) => {
  try {
    const { tableId, rows } = req.body;
    
    if (!Array.isArray(rows)) {
      return res.status(400).json({ error: "Rows must be an array" });
    }
    
    const results = [];
    
    for (const row of rows) {
      if (row.id) {
        // Update existing row
        const [updatedRow] = await db
          .update(tableRows)
          .set({ ...row, updatedAt: new Date() })
          .where(eq(tableRows.id, row.id))
          .returning();
        
        if (updatedRow) {
          results.push(updatedRow);
        }
      } else {
        // Create new row with rowKey
        const rowKey = row.rowKey || generateRowKey(parseInt(tableId), row.data);
        const [newRow] = await db
          .insert(tableRows)
          .values({ ...row, tableId: parseInt(tableId), rowKey })
          .returning();
        
        if (newRow) {
          results.push(newRow);
        }
      }
    }
    
    res.json(results);
  } catch (error) {
    console.error("Error bulk upserting rows:", error);
    res.status(500).json({ error: "Failed to bulk upsert rows" });
  }
};

// Get all views for a table
export const getTableViews = async (req: Request, res: Response) => {
  try {
    const { tableId } = req.params;
    const views = await db
      .select()
      .from(tableViews)
      .where(eq(tableViews.tableId, parseInt(tableId)))
      .orderBy(tableViews.createdAt);
    
    res.json(views);
  } catch (error) {
    console.error("Error getting table views:", error);
    res.status(500).json({ error: "Failed to get table views" });
  }
};

// Create a new view
export const createTableView = async (req: Request, res: Response) => {
  try {
    const viewData = req.body;
    const [newView] = await db.insert(tableViews).values(viewData).returning();
    res.status(201).json(newView);
  } catch (error) {
    console.error("Error creating table view:", error);
    res.status(500).json({ error: "Failed to create table view" });
  }
};

// Update a view
export const updateTableView = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const [updatedView] = await db
      .update(tableViews)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(tableViews.id, parseInt(id)))
      .returning();
    
    if (!updatedView) {
      return res.status(404).json({ error: "View not found" });
    }
    
    res.json(updatedView);
  } catch (error) {
    console.error("Error updating table view:", error);
    res.status(500).json({ error: "Failed to update table view" });
  }
};

// Delete a view
export const deleteTableView = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const [deletedView] = await db
      .delete(tableViews)
      .where(eq(tableViews.id, parseInt(id)))
      .returning();
    
    if (!deletedView) {
      return res.status(404).json({ error: "View not found" });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting table view:", error);
    res.status(500).json({ error: "Failed to delete table view" });
  }
};

// --- Robust, idempotent sync helpers ---
async function findOrUpsertTableByName(tx: any, table: any, results: any) {
  // Try to find by ID first
  let dbTable = null;
  if (table.id) {
    const byId = await tx.select().from(tables).where(eq(tables.id, table.id)).limit(1);
    if (byId.length > 0) dbTable = byId[0];
  }
  // Try to find by name (idempotency)
  if (!dbTable && table.name) {
    const byName = await tx.select().from(tables).where(eq(tables.name, table.name)).limit(1);
    if (byName.length > 0) dbTable = byName[0];
  }
  // If found, return it
  if (dbTable) {
    // TODO: Optionally check schema compatibility here
    results.tables.push(dbTable);
    return dbTable;
  }
  // Not found, try to insert
  try {
    const { id, createdAt, updatedAt, version, ...tableFields } = table;
    const [newTable] = await tx.insert(tables).values(tableFields).returning();
    if (newTable) {
      results.tables.push(newTable);
      return newTable;
    }
  } catch (error) {
    // If unique constraint, fetch and use existing
    if (error instanceof Error && error.message.includes('tables_name_unique')) {
      const byName = await tx.select().from(tables).where(eq(tables.name, table.name)).limit(1);
      if (byName.length > 0) {
        results.tables.push(byName[0]);
        results.conflicts.push({
          type: 'table',
          id: table.id,
          message: `Table name '${table.name}' already exists, using existing table with id ${byName[0].id}`
        });
        return byName[0];
      }
    }
    results.conflicts.push({
      type: 'table',
      id: table.id,
      message: `Sync error: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
  return null;
}

// Sync all data (tables, rows, views) with optimistic concurrency control
export const syncAllData = async (req: Request, res: Response) => {
  try {
    const { tables: tablesData, rows: rowsData, views: viewsData } = req.body;
    
    console.log('[Backend] Received sync request:', {
      tablesCount: Array.isArray(tablesData) ? tablesData.length : 0,
      rowsCount: Array.isArray(rowsData) ? rowsData.length : 0,
      viewsCount: Array.isArray(viewsData) ? viewsData.length : 0,
      sampleTable: Array.isArray(tablesData) && tablesData.length > 0 ? tablesData[0] : null,
      sampleRow: Array.isArray(rowsData) && rowsData.length > 0 ? rowsData[0] : null,
      sampleView: Array.isArray(viewsData) && viewsData.length > 0 ? viewsData[0] : null,
    });
    
    const results: {
      tables: any[];
      rows: any[];
      views: any[];
      conflicts: Array<{ type: string; id: string; message: string }>;
    } = {
      tables: [],
      rows: [],
      views: [],
      conflicts: []
    };
    
    // Use database transaction for atomicity
    await db.transaction(async (tx) => {
      // --- Robust Table Sync ---
      const tableIdMap: Record<string, any> = {};
      if (Array.isArray(tablesData)) {
        for (const table of tablesData) {
          const dbTable = await findOrUpsertTableByName(tx, table, results);
          if (dbTable) {
            tableIdMap[table.id] = dbTable.id;
          }
        }
      }
      
      // Sync rows with version checking
      if (Array.isArray(rowsData)) {
        for (const row of rowsData) {
          try {
            const origTableId = row.tableId;
            const tableId = tableIdMap[origTableId] || parseInt(origTableId as string);
            // Check parent table exists
            const parentTable = await tx.select().from(tables).where(eq(tables.id, tableId)).limit(1);
            if (!parentTable.length) {
              results.conflicts.push({
                type: 'row',
                id: row.id as string,
                message: `Parent table (id: ${tableId}) does not exist, skipping row.`
              });
              continue;
            }
            if (row.id && row.id !== '') {
              const rowId = parseInt(row.id as string);
              if (!isNaN(rowId) && !isNaN(tableId)) {
                // Check if row exists and compare versions
                const existingRow = await tx
                  .select()
                  .from(tableRows)
                  .where(eq(tableRows.id, rowId))
                  .limit(1);
                
                if (existingRow.length === 0) {
                  // Row was deleted on server, try to create new with rowKey
                  const { id, createdAt, updatedAt, version, ...rowFields } = row;
                  const rowKey = rowFields.rowKey || generateRowKey(tableId, rowFields.data);
                  console.log('[Backend] Creating new row (was deleted on server):', { rowId: row.id, tableId, rowKey, rowFields });
                  
                  try {
                    const [newRow] = await tx
                      .insert(tableRows)
                      .values({ ...rowFields, tableId, rowKey })
                      .returning();
                    
                    if (newRow) {
                      results.rows.push(newRow);
                      console.log('[Backend] Successfully created row:', newRow.id);
                    }
                  } catch (error) {
                    if (error instanceof Error && error.message.includes('table_row_key_unique')) {
                      console.log(`[Backend] Row key conflict for table ${tableId}, rowKey: ${rowKey}, skipping`);
                      results.conflicts.push({
                        type: 'row',
                        id: row.id as string,
                        message: `Row key conflict for table ${tableId}, rowKey: ${rowKey}, skipping.`
                      });
                      // Don't add to conflicts since this is expected behavior during sync
                    } else {
                      throw error; // Re-throw other errors
                    }
                  }
                } else {
                  // Check version conflict
                  const serverVersion = existingRow[0].version || 0;
                  const clientVersion = row.version || 0;
                  
                  console.log('[Backend] Row version check:', { 
                    rowId: row.id, 
                    tableId, 
                    serverVersion, 
                    clientVersion 
                  });
                  
                  if (clientVersion >= serverVersion) {
                    // Client has newer or same version, safe to update
                    const { id, createdAt, updatedAt, version, ...rowFields } = row;
                    // Ensure rowKey is preserved or generated
                    const rowKey = rowFields.rowKey || existingRow[0].rowKey || generateRowKey(tableId, rowFields.data);
                    console.log('[Backend] Updating row:', { rowId: row.id, tableId, rowKey, rowFields });
                    const [updatedRow] = await tx
                      .update(tableRows)
                      .set({ 
                        ...rowFields, 
                        tableId, 
                        rowKey,
                        updatedAt: new Date(),
                        version: serverVersion + 1 
                      })
                      .where(eq(tableRows.id, rowId))
                      .returning();
                    
                    if (updatedRow) {
                      results.rows.push(updatedRow);
                      console.log('[Backend] Successfully updated row:', updatedRow.id);
                    }
                  } else {
                    // Version conflict - resolve by taking the latest version
                    console.log('[Backend] Row version conflict - resolving by taking latest:', { 
                      rowId: row.id, 
                      tableId, 
                      serverVersion, 
                      clientVersion 
                    });
                    
                    // Check if client data is newer based on updatedAt timestamp
                    const clientUpdatedAt = new Date(row.updatedAt || row.createdAt || 0);
                    const serverUpdatedAt = new Date(existingRow[0].updatedAt || existingRow[0].createdAt || 0);
                    
                    if (clientUpdatedAt > serverUpdatedAt) {
                      // Client has newer data, update server
                      const { id, createdAt, updatedAt, version, ...rowFields } = row;
                      // Ensure rowKey is preserved or generated
                      const rowKey = rowFields.rowKey || existingRow[0].rowKey || generateRowKey(tableId, rowFields.data);
                      console.log('[Backend] Client data is newer, updating server row:', { rowId: row.id, tableId, rowKey, rowFields });
                      const [updatedRow] = await tx
                        .update(tableRows)
                        .set({ 
                          ...rowFields, 
                          tableId, 
                          rowKey,
                          updatedAt: new Date(),
                          version: Math.max(serverVersion, clientVersion) + 1 
                        })
                        .where(eq(tableRows.id, rowId))
                        .returning();
                      
                      if (updatedRow) {
                        results.rows.push(updatedRow);
                        console.log('[Backend] Successfully updated row after conflict resolution:', updatedRow.id);
                      }
                    } else {
                      // Server has newer data, keep server version
                      console.log('[Backend] Server data is newer, keeping server version');
                      results.rows.push(existingRow[0]);
                    }
                  }
                }
              }
            } else {
              // New row - use rowKey for deduplication
              const { id, createdAt, updatedAt, version, ...rowFields } = row;
              if (!isNaN(tableId)) {
                // Generate rowKey if not provided
                const rowKey = rowFields.rowKey || generateRowKey(tableId, rowFields.data);
                
                // Check if a row with this rowKey already exists
                const existingRow = await tx
                  .select()
                  .from(tableRows)
                  .where(and(
                    eq(tableRows.tableId, tableId),
                    eq(tableRows.rowKey, rowKey)
                  ))
                  .limit(1);
                
                if (existingRow.length === 0) {
                  // No existing row with this rowKey, create new
                  console.log('[Backend] Creating new row with rowKey:', { tableId, rowKey, rowFields });
                  
                  try {
                    const [newRow] = await tx
                      .insert(tableRows)
                      .values({ ...rowFields, tableId, rowKey })
                      .returning();
                    
                    if (newRow) {
                      results.rows.push(newRow);
                      console.log('[Backend] Successfully created new row:', newRow.id);
                    }
                  } catch (error) {
                    if (error instanceof Error && error.message.includes('table_row_key_unique')) {
                      console.log(`[Backend] Row key conflict for table ${tableId}, rowKey: ${rowKey}, skipping`);
                      results.conflicts.push({
                        type: 'row',
                        id: row.id as string,
                        message: `Row key conflict for table ${tableId}, rowKey: ${rowKey}, skipping.`
                      });
                      // Don't add to conflicts since this is expected behavior during sync
                    } else {
                      throw error; // Re-throw other errors
                    }
                  }
                } else {
                  // Row with this rowKey already exists, update it if client version is newer
                  const existing = existingRow[0];
                  const clientVersion = row.version || 0;
                  const serverVersion = existing.version || 0;
                  
                  if (clientVersion > serverVersion) {
                    console.log('[Backend] Updating existing row with rowKey:', { tableId, rowKey, existingId: existing.id });
                    const [updatedRow] = await tx
                      .update(tableRows)
                      .set({ 
                        ...rowFields, 
                        tableId, 
                        rowKey,
                        updatedAt: new Date(),
                        version: Math.max(serverVersion, clientVersion) + 1 
                      })
                      .where(eq(tableRows.id, existing.id))
                      .returning();
                    
                    if (updatedRow) {
                      results.rows.push(updatedRow);
                      console.log('[Backend] Successfully updated existing row:', updatedRow.id);
                    }
                  } else {
                    // Server version is newer or same, keep existing
                    console.log('[Backend] Keeping existing row (server version newer):', { tableId, rowKey, existingId: existing.id });
                    results.rows.push(existing);
                  }
                }
              }
            }
          } catch (error) {
            console.error(`Error syncing row ${row.id}:`, error);
            results.conflicts.push({
              type: 'row',
              id: row.id as string,
              message: `Sync error: ${error instanceof Error ? error.message : 'Unknown error'}`
            });
          }
        }
      }
      
      // --- Robust View Sync ---
      if (Array.isArray(viewsData)) {
        for (const view of viewsData) {
          try {
            const origTableId = view.tableId;
            const tableId = tableIdMap[origTableId] || parseInt(origTableId as string);
            // Check parent table exists
            const parentTable = await tx.select().from(tables).where(eq(tables.id, tableId)).limit(1);
            if (!parentTable.length) {
              results.conflicts.push({
                type: 'view',
                id: view.id as string,
                message: `Parent table (id: ${tableId}) does not exist, skipping view.`
              });
              continue;
            }
            if (view.id && view.id !== '') {
              const viewId = parseInt(view.id as string);
              if (!isNaN(viewId) && !isNaN(tableId)) {
                // Check if view exists and compare versions
                const existingView = await tx
                  .select()
                  .from(tableViews)
                  .where(eq(tableViews.id, viewId))
                  .limit(1);
                
                if (existingView.length === 0) {
                  // View was deleted on server, try to create new
                  const { id, createdAt, updatedAt, version, ...viewFields } = view;
                  console.log('[Backend] Creating new view (was deleted on server):', { viewId: view.id, tableId, viewFields });
                  
                  try {
                    const [newView] = await tx
                      .insert(tableViews)
                      .values({ ...viewFields, tableId })
                      .returning();
                    
                    if (newView) {
                      results.views.push(newView);
                      console.log('[Backend] Successfully created view:', newView.id);
                    }
                  } catch (error) {
                    console.log(`[Backend] Error creating view: ${error instanceof Error ? error.message : 'Unknown error'}, skipping`);
                    results.conflicts.push({
                      type: 'view',
                      id: view.id as string,
                      message: `View creation error: ${error instanceof Error ? error.message : 'Unknown error'}`
                    });
                    // Don't add to conflicts since this might be due to missing table reference
                  }
                } else {
                  // Check version conflict
                  const serverVersion = existingView[0].version || 0;
                  const clientVersion = view.version || 0;
                  
                  if (clientVersion >= serverVersion) {
                    // Client has newer or same version, safe to update
                    const { id, createdAt, updatedAt, version, ...viewFields } = view;
                    const [updatedView] = await tx
                      .update(tableViews)
                      .set({ 
                        ...viewFields, 
                        tableId, 
                        updatedAt: new Date(),
                        version: serverVersion + 1 
                      })
                      .where(eq(tableViews.id, viewId))
                      .returning();
                    
                    if (updatedView) {
                      results.views.push(updatedView);
                    }
                  } else {
                    // Version conflict - resolve by taking the latest version
                    console.log('[Backend] View version conflict - resolving by taking latest:', { 
                      viewId: view.id, 
                      tableId, 
                      serverVersion, 
                      clientVersion 
                    });
                    
                    // Check if client data is newer based on updatedAt timestamp
                    const clientUpdatedAt = new Date(view.updatedAt || view.createdAt || 0);
                    const serverUpdatedAt = new Date(existingView[0].updatedAt || existingView[0].createdAt || 0);
                    
                    if (clientUpdatedAt > serverUpdatedAt) {
                      // Client has newer data, update server
                      const { id, createdAt, updatedAt, version, ...viewFields } = view;
                      console.log('[Backend] Client data is newer, updating server view:', { viewId: view.id, tableId, viewFields });
                      const [updatedView] = await tx
                        .update(tableViews)
                        .set({ 
                          ...viewFields, 
                          tableId, 
                          updatedAt: new Date(),
                          version: Math.max(serverVersion, clientVersion) + 1 
                        })
                        .where(eq(tableViews.id, viewId))
                        .returning();
                      
                      if (updatedView) {
                        results.views.push(updatedView);
                        console.log('[Backend] Successfully updated view after conflict resolution:', updatedView.id);
                      }
                    } else {
                      // Server has newer data, keep server version
                      console.log('[Backend] Server data is newer, keeping server version');
                      results.views.push(existingView[0]);
                    }
                  }
                }
              }
            } else {
              // New view
              const { id, createdAt, updatedAt, version, ...viewFields } = view;
              if (!isNaN(tableId)) {
                console.log('[Backend] Creating new view:', { tableId, viewFields });
                
                try {
                  const [newView] = await tx
                    .insert(tableViews)
                    .values({ ...viewFields, tableId })
                    .returning();
                  
                  if (newView) {
                    results.views.push(newView);
                    console.log('[Backend] Successfully created new view:', newView.id);
                  }
                } catch (error) {
                  console.log(`[Backend] Error creating new view: ${error instanceof Error ? error.message : 'Unknown error'}, skipping`);
                  results.conflicts.push({
                    type: 'view',
                    id: view.id as string,
                    message: `View creation error: ${error instanceof Error ? error.message : 'Unknown error'}`
                  });
                  // Don't add to conflicts since this might be due to missing table reference
                }
              }
            }
          } catch (error) {
            console.error(`Error syncing view ${view.id}:`, error);
            results.conflicts.push({
              type: 'view',
              id: view.id as string,
              message: `Sync error: ${error instanceof Error ? error.message : 'Unknown error'}`
            });
          }
        }
      }
    });
    
    console.log('[Backend] Sync completed with results:', {
      tablesProcessed: results.tables.length,
      rowsProcessed: results.rows.length,
      viewsProcessed: results.views.length,
      conflicts: results.conflicts.length,
      conflictDetails: results.conflicts,
    });
    
    res.json(results);
  } catch (error) {
    console.error("Error syncing all data:", error);
    res.status(500).json({ error: "Failed to sync data" });
  }
}; 