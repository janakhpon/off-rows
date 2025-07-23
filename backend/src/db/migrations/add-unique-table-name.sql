-- Add unique constraint to table names to prevent duplicates
ALTER TABLE tables ADD CONSTRAINT tables_name_unique UNIQUE (name); 