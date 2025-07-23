import { db } from '../db/client';
import { tables, tableRows, tableViews } from '../db/schema';
import { eq, and, isNull, not } from 'drizzle-orm';

async function resolveSyncConflicts() {
  console.log('Starting sync conflict resolution...');

  try {
    // 1. Find and clean up orphaned rows (rows without valid table references)
    console.log('\n1. Checking for orphaned rows...');
    const allRows = await db.select().from(tableRows);
    const allTableIds = await db.select({ id: tables.id }).from(tables);
    const validTableIds = new Set(allTableIds.map(t => t.id));
    
    const orphanedRows = allRows.filter(row => !validTableIds.has(row.tableId));
    console.log(`Found ${orphanedRows.length} orphaned rows`);
    
    if (orphanedRows.length > 0) {
      for (const row of orphanedRows) {
        console.log(`  Deleting orphaned row ID ${row.id} (tableId: ${row.tableId})`);
        await db.delete(tableRows).where(eq(tableRows.id, row.id));
      }
    }

    // 2. Find and clean up orphaned views (views without valid table references)
    console.log('\n2. Checking for orphaned views...');
    const allViews = await db.select().from(tableViews);
    const orphanedViews = allViews.filter(view => !validTableIds.has(view.tableId));
    console.log(`Found ${orphanedViews.length} orphaned views`);
    
    if (orphanedViews.length > 0) {
      for (const view of orphanedViews) {
        console.log(`  Deleting orphaned view ID ${view.id} (tableId: ${view.tableId})`);
        await db.delete(tableViews).where(eq(tableViews.id, view.id));
      }
    }

    // 3. Find rows with missing rowKey and generate them
    console.log('\n3. Checking for rows with missing rowKey...');
    const rowsWithoutKey = await db.select().from(tableRows).where(isNull(tableRows.rowKey));
    console.log(`Found ${rowsWithoutKey.length} rows without rowKey`);
    
    if (rowsWithoutKey.length > 0) {
      for (const row of rowsWithoutKey) {
        // Generate a simple rowKey based on data content
        const rowKey = `generated_${row.id}_${Date.now()}`;
        console.log(`  Generating rowKey for row ID ${row.id}: ${rowKey}`);
        await db.update(tableRows)
          .set({ rowKey })
          .where(eq(tableRows.id, row.id));
      }
    }

    // 4. Check for duplicate table names and resolve them
    console.log('\n4. Checking for duplicate table names...');
    const allTables = await db.select().from(tables);
    const tableNames = new Map<string, typeof allTables>();
    
    for (const table of allTables) {
      if (!tableNames.has(table.name)) {
        tableNames.set(table.name, []);
      }
      tableNames.get(table.name)!.push(table);
    }
    
    const duplicates = Array.from(tableNames.entries()).filter(([name, tables]) => tables.length > 1);
    console.log(`Found ${duplicates.length} table names with duplicates`);
    
    for (const [tableName, duplicateTables] of duplicates) {
      console.log(`  Resolving duplicates for table name: ${tableName}`);
      
      // Sort by updatedAt to find the most recent table
      const sortedTables = duplicateTables.sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      
      const keepTable = sortedTables[0]; // Keep the most recent one
      const deleteTables = sortedTables.slice(1); // Delete the rest
      
      console.log(`    Keeping table ID ${keepTable.id} (most recent)`);
      console.log(`    Deleting table IDs: ${deleteTables.map(t => t.id).join(', ')}`);
      
      for (const deleteTable of deleteTables) {
        await db.delete(tables).where(eq(tables.id, deleteTable.id));
      }
    }

    // 5. Verify data consistency
    console.log('\n5. Verifying data consistency...');
    const finalTables = await db.select().from(tables);
    const finalRows = await db.select().from(tableRows);
    const finalViews = await db.select().from(tableViews);
    
    console.log(`Final counts:`);
    console.log(`  Tables: ${finalTables.length}`);
    console.log(`  Rows: ${finalRows.length}`);
    console.log(`  Views: ${finalViews.length}`);
    
    // Check for any remaining orphaned data
    const remainingOrphanedRows = finalRows.filter(row => !finalTables.some(t => t.id === row.tableId));
    const remainingOrphanedViews = finalViews.filter(view => !finalTables.some(t => t.id === view.tableId));
    
    if (remainingOrphanedRows.length > 0) {
      console.log(`  WARNING: ${remainingOrphanedRows.length} orphaned rows still exist`);
    }
    
    if (remainingOrphanedViews.length > 0) {
      console.log(`  WARNING: ${remainingOrphanedViews.length} orphaned views still exist`);
    }

    console.log('\nSync conflict resolution completed successfully!');

  } catch (error) {
    console.error('Error during sync conflict resolution:', error);
    throw error;
  }
}

// Run the resolution if this script is executed directly
if (require.main === module) {
  resolveSyncConflicts()
    .then(() => {
      console.log('Conflict resolution script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Conflict resolution script failed:', error);
      process.exit(1);
    });
}

export { resolveSyncConflicts }; 