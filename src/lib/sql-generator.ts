import { Table, Field } from './schemas';

/**
 * SQL Generator for dynamic tables
 * Converts the flexible schema structure to SQL DDL statements
 */

// Types
type SqlDataType = 'TEXT' | 'DECIMAL(15,2)' | 'BOOLEAN' | 'DATE' | 'VARCHAR(255)' | 'INTEGER';
type FieldValue =
  | string
  | number
  | boolean
  | null
  | { name: string; type: string; fileId: number }
  | { name: string; type: string; fileId: number }[];
type RowData = Record<string, FieldValue>;

// Constants
const SQL_DATA_TYPES = {
  TEXT: 'TEXT' as const,
  DECIMAL: 'DECIMAL(15,2)' as const,
  BOOLEAN: 'BOOLEAN' as const,
  DATE: 'DATE' as const,
  VARCHAR: 'VARCHAR(255)' as const,
  INTEGER: 'INTEGER' as const,
} as const;

const STANDARD_COLUMNS = [
  '  id INTEGER PRIMARY KEY AUTOINCREMENT',
  '  table_id INTEGER NOT NULL',
  '  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
  '  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
] as const;

// Utility functions
const sanitizeTableName = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
};

const escapeSqlString = (value: string): string => {
  return value.replace(/'/g, "''");
};

const getFieldTypeMapping = (fieldType: Field['type']): SqlDataType => {
  const typeMap: Record<Field['type'], SqlDataType> = {
    text: SQL_DATA_TYPES.TEXT,
    number: SQL_DATA_TYPES.DECIMAL,
    boolean: SQL_DATA_TYPES.BOOLEAN,
    date: SQL_DATA_TYPES.DATE,
    dropdown: SQL_DATA_TYPES.VARCHAR,
    image: SQL_DATA_TYPES.TEXT,
    file: SQL_DATA_TYPES.TEXT,
    images: SQL_DATA_TYPES.TEXT,
    files: SQL_DATA_TYPES.TEXT,
  };

  return typeMap[fieldType] || SQL_DATA_TYPES.TEXT;
};

const generateFieldConstraints = (field: Field): string[] => {
  const constraints: string[] = [];

  if (field.required) {
    constraints.push('NOT NULL');
  }

  if (field.type === 'dropdown' && field.options?.length) {
    const escapedOptions = field.options.map((opt) => `'${escapeSqlString(opt)}'`).join(', ');
    constraints.push(`CHECK (${field.id} IN (${escapedOptions}))`);
  }

  if (field.type === 'number') {
    constraints.push(`CHECK (typeof(${field.id}) = 'numeric')`);
  }

  return constraints;
};

const generateDefaultValue = (field: Field): string => {
  if (field.defaultValue === undefined || field.defaultValue === null) {
    return '';
  }

  const valueMap: Record<Field['type'], (value: FieldValue) => string> = {
    text: (value) => `DEFAULT '${escapeSqlString(String(value))}'`,
    number: (value) => `DEFAULT ${Number(value)}`,
    boolean: (value) => `DEFAULT ${value ? 1 : 0}`,
    date: (value) => `DEFAULT '${String(value)}'`,
    dropdown: (value) => `DEFAULT '${escapeSqlString(String(value))}'`,
    image: (value) => `DEFAULT '${escapeSqlString(JSON.stringify(value))}'`,
    file: (value) => `DEFAULT '${escapeSqlString(JSON.stringify(value))}'`,
    images: (value) => `DEFAULT '${escapeSqlString(JSON.stringify(value))}'`,
    files: (value) => `DEFAULT '${escapeSqlString(JSON.stringify(value))}'`,
  };

  return valueMap[field.type]?.(field.defaultValue) || '';
};

const formatFieldValue = (field: Field, value: FieldValue): string => {
  if (value === null || value === undefined) {
    return 'NULL';
  }

  const formatters: Record<Field['type'], (value: FieldValue) => string> = {
    text: (value) => `'${escapeSqlString(String(value))}'`,
    number: (value) => String(Number(value)),
    boolean: (value) => (value ? '1' : '0'),
    date: (value) => `'${escapeSqlString(String(value))}'`,
    dropdown: (value) => `'${escapeSqlString(String(value))}'`,
    image: (value) => `'${escapeSqlString(JSON.stringify(value))}'`,
    file: (value) => `'${escapeSqlString(JSON.stringify(value))}'`,
    images: (value) => `'${escapeSqlString(JSON.stringify(value))}'`,
    files: (value) => `'${escapeSqlString(JSON.stringify(value))}'`,
  };

  return formatters[field.type]?.(value) || `'${escapeSqlString(String(value))}'`;
};

/**
 * Generate CREATE TABLE statement for a dynamic table
 */
export const generateCreateTableSQL = (table: Table): string => {
  if (!table.fields.length) {
    throw new Error('Table must have at least one field');
  }

  const tableName = sanitizeTableName(table.name);

  const fieldDefinitions = table.fields.map((field) => {
    const dataType = getFieldTypeMapping(field.type);
    const constraints = generateFieldConstraints(field);
    const defaultValue = generateDefaultValue(field);

    let definition = `  ${field.id} ${dataType}`;

    if (defaultValue) {
      definition += ` ${defaultValue}`;
    }

    if (constraints.length > 0) {
      definition += ` ${constraints.join(' ')}`;
    }

    return definition;
  });

  const allColumns = [...STANDARD_COLUMNS, ...fieldDefinitions];

  return `CREATE TABLE ${tableName} (
${allColumns.join(',\n')}
);

-- Indexes for performance
CREATE INDEX idx_${tableName}_table_id ON ${tableName}(table_id);
CREATE INDEX idx_${tableName}_created_at ON ${tableName}(created_at);

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_${tableName}_updated_at
  AFTER UPDATE ON ${tableName}
  FOR EACH ROW
BEGIN
  UPDATE ${tableName} SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;`;
};

/**
 * Generate INSERT statement for a table row
 */
export const generateInsertSQL = (table: Table, rowData: RowData): string => {
  const tableName = sanitizeTableName(table.name);
  const fieldNames = table.fields.map((f) => f.id);
  const values = table.fields.map((field) => formatFieldValue(field, rowData[field.id] ?? null));

  return `INSERT INTO ${tableName} (table_id, ${fieldNames.join(', ')}) 
VALUES (${table.id}, ${values.join(', ')});`;
};

/**
 * Generate SELECT statement for a table
 */
export const generateSelectSQL = (
  table: Table,
  options: {
    where?: Record<string, FieldValue>;
    orderBy?: string;
    limit?: number;
  } = {},
): string => {
  const tableName = sanitizeTableName(table.name);
  const fieldNames = table.fields.map((f) => f.id);

  let sql = `SELECT id, table_id, ${fieldNames.join(', ')}, created_at, updated_at 
FROM ${tableName}`;

  if (options.where && Object.keys(options.where).length > 0) {
    const whereConditions = Object.entries(options.where).map(([key, value]) => {
      if (value === null) {
        return `${key} IS NULL`;
      }
      return `${key} = '${escapeSqlString(String(value))}'`;
    });
    sql += ` WHERE ${whereConditions.join(' AND ')}`;
  }

  if (options.orderBy) {
    sql += ` ORDER BY ${options.orderBy}`;
  } else {
    sql += ` ORDER BY created_at DESC`;
  }

  if (options.limit) {
    sql += ` LIMIT ${options.limit}`;
  }

  return sql + ';';
};

/**
 * Generate UPDATE statement for a table row
 */
export const generateUpdateSQL = (table: Table, rowId: number, updates: RowData): string => {
  const tableName = sanitizeTableName(table.name);

  const setClauses = Object.entries(updates).map(([key, value]) => {
    const field = table.fields.find((f) => f.id === key);
    if (!field) {
      return `${key} = '${escapeSqlString(String(value))}'`;
    }

    return `${key} = ${formatFieldValue(field, value)}`;
  });

  return `UPDATE ${tableName} 
SET ${setClauses.join(', ')}
WHERE id = ${rowId};`;
};

/**
 * Generate DELETE statement for a table row
 */
export const generateDeleteSQL = (table: Table, rowId: number): string => {
  const tableName = sanitizeTableName(table.name);
  return `DELETE FROM ${tableName} WHERE id = ${rowId};`;
};

/**
 * Generate complete database schema for all tables
 */
export const generateCompleteDatabaseSchema = (tables: Table[]): string => {
  if (!tables.length) {
    return '-- No tables to generate schema for';
  }

  const createStatements = tables.map((table) => generateCreateTableSQL(table));

  const viewStatements = tables.map((table) => {
    const tableName = sanitizeTableName(table.name);
    const fieldNames = table.fields.map((f) => f.id);

    return `CREATE VIEW v_${tableName} AS
SELECT id, table_id, ${fieldNames.join(', ')}, created_at, updated_at
FROM ${tableName}
WHERE table_id = ${table.id};`;
  });

  return `-- Offrows Database Schema
-- Generated from dynamic table definitions
-- Generated on: ${new Date().toISOString()}

${createStatements.join('\n\n')}

-- Views for easier data access
${viewStatements.join('\n\n')}`;
};

/**
 * Generate migration script to add a new column
 */
export const generateAddColumnMigration = (table: Table, newField: Field): string => {
  const tableName = sanitizeTableName(table.name);
  const dataType = getFieldTypeMapping(newField.type);
  const constraints = generateFieldConstraints(newField);
  const defaultValue = generateDefaultValue(newField);

  let sql = `ALTER TABLE ${tableName} ADD COLUMN ${newField.id} ${dataType}`;

  if (defaultValue) {
    sql += ` ${defaultValue}`;
  }

  if (constraints.length > 0) {
    sql += ` ${constraints.join(' ')}`;
  }

  return sql + ';';
};

/**
 * Generate migration script to drop a column
 */
export const generateDropColumnMigration = (table: Table, fieldId: string): string => {
  const tableName = sanitizeTableName(table.name);

  return `-- Note: SQLite doesn't support DROP COLUMN directly
-- You would need to recreate the table without this column
-- This is a placeholder for the migration logic

-- 1. Create new table without the column
-- 2. Copy data from old table to new table
-- 3. Drop old table
-- 4. Rename new table to old table name

-- Example:
-- CREATE TABLE ${tableName}_new AS SELECT * FROM ${tableName} WHERE 1=0;
-- INSERT INTO ${tableName}_new SELECT [columns_except_${fieldId}] FROM ${tableName};
-- DROP TABLE ${tableName};
-- ALTER TABLE ${tableName}_new RENAME TO ${tableName};`;
};

/**
 * Export utility functions for use in the application
 */
export const SQLGenerator = {
  generateCreateTableSQL,
  generateInsertSQL,
  generateSelectSQL,
  generateUpdateSQL,
  generateDeleteSQL,
  generateCompleteDatabaseSchema,
  generateAddColumnMigration,
  generateDropColumnMigration,
} as const;
