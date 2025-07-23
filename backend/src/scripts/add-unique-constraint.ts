import { db } from '../db/client';

async function addUniqueConstraint() {
  console.log('Adding unique constraint to table names...');

  try {
    // Add unique constraint to table names
    await db.execute(`
      ALTER TABLE tables ADD CONSTRAINT tables_name_unique UNIQUE (name);
    `);
    
    console.log('Successfully added unique constraint to table names');
    
    // Verify the constraint was added
    const result = await db.execute(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'tables' 
      AND constraint_type = 'UNIQUE' 
      AND constraint_name = 'tables_name_unique';
    `);
    
    if (result.rows && result.rows.length > 0) {
      console.log('Unique constraint verified successfully');
    } else {
      console.log('Warning: Could not verify unique constraint');
    }

  } catch (error) {
    console.error('Error adding unique constraint:', error);
    throw error;
  }
}

// Run the migration if this script is executed directly
if (require.main === module) {
  addUniqueConstraint()
    .then(() => {
      console.log('Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

export { addUniqueConstraint }; 