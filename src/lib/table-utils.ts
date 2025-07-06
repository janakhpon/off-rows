import { Table, Field } from './schemas';
import { VALIDATION } from './constants';

// Types
type RowData = Record<string, string | number | boolean | null | { name: string; type: string; fileId: number } | { name: string; type: string; fileId: number }[]>;

/**
 * Table utility functions
 */

// Validation functions
export const validateTableName = (name: string): { isValid: boolean; error?: string } => {
  if (!name || name.trim().length === 0) {
    return { isValid: false, error: 'Table name is required' };
  }
  
  if (name.length > VALIDATION.MAX_TABLE_NAME_LENGTH) {
    return { isValid: false, error: `Table name must be less than ${VALIDATION.MAX_TABLE_NAME_LENGTH} characters` };
  }
  
  if (name.length < VALIDATION.MIN_TABLE_NAME_LENGTH) {
    return { isValid: false, error: `Table name must be at least ${VALIDATION.MIN_TABLE_NAME_LENGTH} character` };
  }
  
  // Check for invalid characters
  const invalidChars = /[<>:"/\\|?*]/;
  if (invalidChars.test(name)) {
    return { isValid: false, error: 'Table name contains invalid characters' };
  }
  
  return { isValid: true };
};

export const validateFieldName = (name: string): { isValid: boolean; error?: string } => {
  if (!name || name.trim().length === 0) {
    return { isValid: false, error: 'Field name is required' };
  }
  
  if (name.length > VALIDATION.MAX_FIELD_NAME_LENGTH) {
    return { isValid: false, error: `Field name must be less than ${VALIDATION.MAX_FIELD_NAME_LENGTH} characters` };
  }
  
  if (name.length < VALIDATION.MIN_FIELD_NAME_LENGTH) {
    return { isValid: false, error: `Field name must be at least ${VALIDATION.MIN_FIELD_NAME_LENGTH} character` };
  }
  
  // Check for invalid characters
  const invalidChars = /[<>:"/\\|?*]/;
  if (invalidChars.test(name)) {
    return { isValid: false, error: 'Field name contains invalid characters' };
  }
  
  return { isValid: true };
};

// Field utility functions
export const generateFieldId = (name: string): string => {
  return name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
};

export const getFieldTypeLabel = (type: Field['type']): string => {
  const typeLabels: Record<Field['type'], string> = {
    text: 'Text',
    number: 'Number',
    boolean: 'Boolean',
    date: 'Date',
    dropdown: 'Dropdown',
    image: 'Image',
    file: 'File',
    images: 'Images',
    files: 'Files',
  };
  
  return typeLabels[type] || 'Unknown';
};

export const getFieldTypeDescription = (type: Field['type']): string => {
  const descriptions: Record<Field['type'], string> = {
    text: 'Single line text input',
    number: 'Numeric value with decimal support',
    boolean: 'True/false checkbox',
    date: 'Date picker',
    dropdown: 'Select from predefined options',
    image: 'Single image upload',
    file: 'Single file upload',
    images: 'Multiple image uploads',
    files: 'Multiple file uploads',
  };
  
  return descriptions[type] || 'Unknown field type';
};

// Table utility functions
export const sanitizeTableName = (name: string): string => {
  return name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
};

export const createDefaultTable = (name: string): Omit<Table, 'id' | 'createdAt' | 'updatedAt'> => {
  return {
    name: name.trim(),
    description: '',
    fields: [
      { id: 'name', name: 'Name', type: 'text', required: true },
      { id: 'description', name: 'Description', type: 'text' },
    ],
    colWidths: {},
    rowHeights: {},
  };
};

export const getTableStats = (table: Table) => {
  const fieldCount = table.fields.length;
  const requiredFields = table.fields.filter(f => f.required).length;
  const optionalFields = fieldCount - requiredFields;
  
  const fieldTypes = table.fields.reduce((acc, field) => {
    acc[field.type] = (acc[field.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return {
    fieldCount,
    requiredFields,
    optionalFields,
    fieldTypes,
  };
};

// Data utility functions
export const createEmptyRowData = (table: Table): RowData => {
  return table.fields.reduce((acc, field) => {
    switch (field.type) {
      case 'text':
        acc[field.id] = (field.defaultValue as string) || '';
        break;
      case 'number':
        acc[field.id] = (field.defaultValue as number) || 0;
        break;
      case 'boolean':
        acc[field.id] = (field.defaultValue as boolean) || false;
        break;
      case 'date':
        acc[field.id] = (field.defaultValue as string) ?? new Date().toISOString().split('T')[0];
        break;
      case 'dropdown':
        let dropdownVal = field.defaultValue !== undefined ? field.defaultValue : (field.options?.[0] !== undefined ? field.options[0] : '');
        if (dropdownVal === undefined || dropdownVal === null) dropdownVal = '';
        acc[field.id] = String(dropdownVal);
        break;
      case 'image':
      case 'file':
        acc[field.id] = field.defaultValue || null;
        break;
      case 'images':
      case 'files':
        acc[field.id] = Array.isArray(field.defaultValue) ? field.defaultValue : [];
        break;
      default:
        acc[field.id] = field.defaultValue || null;
    }
    return acc;
  }, {} as RowData);
};

export const validateRowData = (table: Table, data: RowData): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  for (const field of table.fields) {
    if (field.required) {
      const value = data[field.id];
      if (value === null || value === undefined || value === '') {
        errors.push(`${field.name} is required`);
      }
    }
    
    // Type validation
    const value = data[field.id];
    if (value !== null && value !== undefined) {
      switch (field.type) {
        case 'number':
          if (typeof value !== 'number' || isNaN(value)) {
            errors.push(`${field.name} must be a valid number`);
          }
          break;
        case 'boolean':
          if (typeof value !== 'boolean') {
            errors.push(`${field.name} must be a boolean`);
          }
          break;
        case 'dropdown':
          if (field.options && !field.options.includes(String(value))) {
            errors.push(`${field.name} must be one of: ${field.options.join(', ')}`);
          }
          break;
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Search and filter functions
export const searchTableRows = (
  rows: { data: RowData }[],
  table: Table,
  searchQuery: string
): { data: RowData }[] => {
  if (!searchQuery.trim()) return rows;
  
  const query = searchQuery.toLowerCase();
  const textFields = table.fields.filter(f => f.type === 'text').map(f => f.id);
  
  return rows.filter(row => {
    return textFields.some(fieldId => {
      const value = row.data[fieldId];
      return value && String(value).toLowerCase().includes(query);
    });
  });
};

export const sortTableRows = (
  rows: { data: RowData }[],
  sortBy: string,
  sortOrder: 'asc' | 'desc' = 'asc'
): { data: RowData }[] => {
  return [...rows].sort((a, b) => {
    const aValue = a.data[sortBy];
    const bValue = b.data[sortBy];
    
    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;
    
    let comparison = 0;
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      comparison = aValue.localeCompare(bValue);
    } else if (typeof aValue === 'number' && typeof bValue === 'number') {
      comparison = aValue - bValue;
    } else {
      comparison = String(aValue).localeCompare(String(bValue));
    }
    
    return sortOrder === 'desc' ? -comparison : comparison;
  });
};

// Export functions
export const exportTableToCSV = (table: Table, rows: { data: RowData }[]): string => {
  const headers = table.fields.map(f => f.name);
  const csvRows = [headers.join(',')];
  
  for (const row of rows) {
    const values = table.fields.map(field => {
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
  const data = rows.map(row => {
    const obj: RowData = {};
    for (const field of table.fields) {
      obj[field.id] = row.data[field.id] ?? null;
    }
    return obj;
  });
  
  return JSON.stringify(data, null, 2);
}; 