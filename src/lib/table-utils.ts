import { Table, Field } from './schemas';
import { VALIDATION } from './constants';

// Types
type RowData = Record<
  string,
  | string
  | number
  | boolean
  | null
  | { name: string; type: string; fileId: number }
  | { name: string; type: string; fileId: number }[]
>;

/**
 * Table utility functions
 */

// Validation functions
export const validateTableName = (name: string): { isValid: boolean; error?: string } =>
  !name || name.trim().length === 0
    ? { isValid: false, error: 'Table name is required' }
    : name.length > VALIDATION.MAX_TABLE_NAME_LENGTH
    ? {
        isValid: false,
        error: `Table name must be less than ${VALIDATION.MAX_TABLE_NAME_LENGTH} characters`,
      }
    : name.length < VALIDATION.MIN_TABLE_NAME_LENGTH
    ? {
        isValid: false,
        error: `Table name must be at least ${VALIDATION.MIN_TABLE_NAME_LENGTH} character`,
      }
    : /[<>:"/\\|?*]/.test(name)
    ? { isValid: false, error: 'Table name contains invalid characters' }
    : { isValid: true };

export const validateFieldName = (name: string): { isValid: boolean; error?: string } =>
  !name || name.trim().length === 0
    ? { isValid: false, error: 'Field name is required' }
    : name.length > VALIDATION.MAX_FIELD_NAME_LENGTH
    ? {
        isValid: false,
        error: `Field name must be less than ${VALIDATION.MAX_FIELD_NAME_LENGTH} characters`,
      }
    : name.length < VALIDATION.MIN_FIELD_NAME_LENGTH
    ? {
        isValid: false,
        error: `Field name must be at least ${VALIDATION.MIN_FIELD_NAME_LENGTH} character`,
      }
    : /[<>:"/\\|?*]/.test(name)
    ? { isValid: false, error: 'Field name contains invalid characters' }
    : { isValid: true };

// Field utility functions
export const generateFieldId = (name: string): string =>
  name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

export const getFieldTypeLabel = (type: Field['type']): string =>
  ({
    text: 'Text',
    number: 'Number',
    boolean: 'Boolean',
    date: 'Date',
    dropdown: 'Dropdown',
    image: 'Image',
    file: 'File',
    images: 'Images',
    files: 'Files',
  }[type] || 'Unknown');

export const getFieldTypeDescription = (type: Field['type']): string =>
  ({
    text: 'Single line text input',
    number: 'Numeric value with decimal support',
    boolean: 'True/false checkbox',
    date: 'Date picker',
    dropdown: 'Select from predefined options',
    image: 'Single image upload',
    file: 'Single file upload',
    images: 'Multiple image uploads',
    files: 'Multiple file uploads',
  }[type] || 'Unknown field type');

// Table utility functions
export const sanitizeTableName = (name: string): string =>
  name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

export const createDefaultTable = (name: string): Omit<Table, 'id' | 'createdAt' | 'updatedAt'> => ({
  name: name.trim(),
  description: '',
  fields: [
    { id: 'name', name: 'Name', type: 'text', required: true },
    { id: 'description', name: 'Description', type: 'text' },
  ],
  colWidths: {},
  rowHeights: {},
  version: 0,
});

export const getTableStats = (table: Table) => {
  const fieldCount = table.fields.length;
  const requiredFields = table.fields.filter((f) => f.required).length;
  const optionalFields = fieldCount - requiredFields;
  const fieldTypes = table.fields.reduce(
    (acc, field) => ({ ...acc, [field.type]: (acc[field.type] || 0) + 1 }),
    {} as Record<string, number>
  );
  return { fieldCount, requiredFields, optionalFields, fieldTypes };
};

// Data utility functions
export const createEmptyRowData = (table: Table): RowData =>
  table.fields.reduce((acc, field) => {
    const getDefault = () => {
      switch (field.type) {
        case 'text':
          return (field.defaultValue as string) || '';
        case 'number':
          return (field.defaultValue as number) || 0;
        case 'boolean':
          return (field.defaultValue as boolean) || false;
        case 'date':
          return (field.defaultValue as string) ?? new Date().toISOString().split('T')[0];
        case 'dropdown': {
          let dropdownVal =
            field.defaultValue !== undefined
              ? field.defaultValue
              : field.options?.[0] !== undefined
              ? field.options[0]
              : '';
          if (dropdownVal === undefined || dropdownVal === null) dropdownVal = '';
          return String(dropdownVal);
        }
        case 'image':
        case 'file':
          return field.defaultValue || null;
        case 'images':
        case 'files':
          return Array.isArray(field.defaultValue) ? field.defaultValue : [];
        default:
          return field.defaultValue || null;
      }
    };
    return { ...acc, [field.id]: getDefault() };
  }, {} as RowData);

export const validateRowData = (
  table: Table,
  data: RowData,
): { isValid: boolean; errors: string[] } => {
  // Use reduce to accumulate errors in a functional way
  const errors = table.fields.reduce<string[]>((errs, field) => {
    const value = data[field.id];
    if (field.required && (value === null || value === undefined || value === '')) {
      return [...errs, `${field.name} is required`];
    }
    if (value !== null && value !== undefined) {
      switch (field.type) {
        case 'number':
          if (typeof value !== 'number' || isNaN(value)) {
            return [...errs, `${field.name} must be a valid number`];
          }
          break;
        case 'boolean':
          if (typeof value !== 'boolean') {
            return [...errs, `${field.name} must be a boolean`];
          }
          break;
        case 'dropdown':
          if (field.options && !field.options.includes(String(value))) {
            return [...errs, `${field.name} must be one of: ${field.options.join(', ')}`];
          }
          break;
      }
    }
    return errs;
  }, []);
  return { isValid: errors.length === 0, errors };
};

// Search and filter functions
export const searchTableRows = (
  rows: { data: RowData }[],
  table: Table,
  searchQuery: string,
): { data: RowData }[] =>
  !searchQuery.trim()
    ? rows
    : rows.filter((row) => {
        const query = searchQuery.toLowerCase();
        const textFields = table.fields.filter((f) => f.type === 'text').map((f) => f.id);
        return textFields.some((fieldId) => {
          const value = row.data[fieldId];
          return value && String(value).toLowerCase().includes(query);
        });
      });

export const sortTableRows = (
  rows: { data: RowData }[],
  sortBy: string,
  sortOrder: 'asc' | 'desc' = 'asc',
): { data: RowData }[] =>
  [...rows].sort((a, b) => {
    const aValue = a.data[sortBy];
    const bValue = b.data[sortBy];
    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;
    const comparison =
      typeof aValue === 'string' && typeof bValue === 'string'
        ? aValue.localeCompare(bValue)
        : typeof aValue === 'number' && typeof bValue === 'number'
        ? aValue - bValue
        : String(aValue).localeCompare(String(bValue));
    return sortOrder === 'desc' ? -comparison : comparison;
  });

// Export functions
export const exportTableToCSV = (table: Table, rows: { data: RowData }[]): string => {
  const headers = table.fields.map((f) => f.name);
  const csvRows = [headers.join(',')];

  for (const row of rows) {
    const values = table.fields.map((field) => {
      let value = row.data[field.id];
      if (value === null || value === undefined) {
        value = '';
      } else if (typeof value === 'object') {
        value = JSON.stringify(value);
      }
      return `"${String(value).replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
};

export const exportTableToJSON = (table: Table, rows: { data: RowData }[]): string => {
  const data = rows.map((row) => {
    const obj: RowData = {};
    for (const field of table.fields) {
      obj[field.id] = row.data[field.id] ?? null;
    }
    return obj;
  });

  return JSON.stringify(data, null, 2);
};
