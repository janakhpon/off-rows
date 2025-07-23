import { db } from '../db/client';
import { tables, tableRows, tableViews } from '../db/schema';
import { eq, and } from 'drizzle-orm';

async function cleanupDuplicateTables() {
  console.log('Starting cleanup of duplicate tables...');

  try {
    // Get all tables
    const allTables = await db.select().from(tables);
    console.log(`Found ${allTables.length} tables`);

    // Group tables by name
    const tablesByName = new Map<string, typeof allTables>();
    for (const table of allTables) {
      if (!tablesByName.has(table.name)) {
        tablesByName.set(table.name, []);
      }
      tablesByName.get(table.name)!.push(table);
    }

    // Find tables with duplicates
    const duplicates = Array.from(tablesByName.entries()).filter(([name, tables]) => tables.length > 1);
    
    if (duplicates.length === 0) {
      console.log('No duplicate tables found');
      return;
    }

    console.log(`Found ${duplicates.length} table names with duplicates:`);
    duplicates.forEach(([name, tables]) => {
      console.log(`  ${name}: ${tables.length} tables (IDs: ${tables.map((t: any) => t.id).join(', ')})`);
    });

    // Process each duplicate group
    for (const [tableName, duplicateTables] of duplicates) {
      console.log(`\nProcessing duplicates for table: ${tableName}`);
      
      // Sort by updatedAt to find the most recent table
      const sortedTables = duplicateTables.sort((a: any, b: any) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      
      const keepTable = sortedTables[0]; // Keep the most recent one
      const deleteTables = sortedTables.slice(1); // Delete the rest
      
      console.log(`  Keeping table ID ${keepTable.id} (most recent)`);
      console.log(`  Deleting table IDs: ${deleteTables.map((t: any) => t.id).join(', ')}`);
      
      // Delete the duplicate tables (this will cascade delete their rows and views)
      for (const deleteTable of deleteTables) {
        await db.delete(tables).where(eq(tables.id, deleteTable.id));
        console.log(`    Deleted table ID ${deleteTable.id}`);
      }
    }

    console.log('\nCleanup completed successfully!');
    
    // Verify the cleanup
    const remainingTables = await db.select().from(tables);
    console.log(`\nRemaining tables: ${remainingTables.length}`);
    remainingTables.forEach((table: any) => {
      console.log(`  ID ${table.id}: ${table.name}`);
    });

  } catch (error) {
    console.error('Error during cleanup:', error);
    throw error;
  }
}

// Run the cleanup if this script is executed directly
if (require.main === module) {
  cleanupDuplicateTables()
    .then(() => {
      console.log('Cleanup script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Cleanup script failed:', error);
      process.exit(1);
    });
}

export { cleanupDuplicateTables }; 