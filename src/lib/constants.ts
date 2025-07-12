/**
 * Application constants
 */

// Database
export const DATABASE_NAME = 'OffrowsDatabase';
export const DATABASE_VERSION = 4;

// Table names
export const TABLE_NAMES = {
  TABLES: 'tables',
  ROWS: 'rows',
  VIEWS: 'views',
  FILES: 'files',
} as const;

// Field types
export const FIELD_TYPES = {
  TEXT: 'text',
  NUMBER: 'number',
  BOOLEAN: 'boolean',
  DATE: 'date',
  DROPDOWN: 'dropdown',
  IMAGE: 'image',
  FILE: 'file',
  IMAGES: 'images',
  FILES: 'files',
} as const;

// SQL data types
export const SQL_DATA_TYPES = {
  TEXT: 'TEXT',
  DECIMAL: 'DECIMAL(15,2)',
  BOOLEAN: 'BOOLEAN',
  DATE: 'DATE',
  VARCHAR: 'VARCHAR(255)',
  INTEGER: 'INTEGER',
} as const;

// UI constants
export const UI = {
  MODAL_Z_INDEX: 50,
  TOAST_DURATION: 3000,
  ANIMATION_DURATION: 200,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
} as const;

// Validation
export const VALIDATION = {
  MAX_TABLE_NAME_LENGTH: 100,
  MAX_FIELD_NAME_LENGTH: 50,
  MIN_TABLE_NAME_LENGTH: 1,
  MIN_FIELD_NAME_LENGTH: 1,
} as const;

// Default values
export const DEFAULTS = {
  ROW_HEIGHT: 36,
  COLUMN_WIDTH: 140,
  ITEMS_PER_PAGE: 50,
} as const;

// Error messages
export const ERROR_MESSAGES = {
  TABLE_NAME_REQUIRED: 'Table name is required',
  FIELD_NAME_REQUIRED: 'Field name is required',
  AT_LEAST_ONE_FIELD: 'At least one field is required',
  INVALID_TABLE_NAME: 'Invalid table name',
  INVALID_FIELD_NAME: 'Invalid field name',
  FILE_TOO_LARGE: 'File is too large',
  UNSUPPORTED_FILE_TYPE: 'Unsupported file type',
  NETWORK_ERROR: 'Network error occurred',
  DATABASE_ERROR: 'Database error occurred',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  TABLE_CREATED: 'Table created successfully',
  TABLE_UPDATED: 'Table updated successfully',
  TABLE_DELETED: 'Table deleted successfully',
  ROW_ADDED: 'Row added successfully',
  ROW_UPDATED: 'Row updated successfully',
  ROW_DELETED: 'Row deleted successfully',
  COLUMN_ADDED: 'Column added successfully',
  COLUMN_DELETED: 'Column deleted successfully',
  FILE_UPLOADED: 'File uploaded successfully',
  COPIED_TO_CLIPBOARD: 'Copied to clipboard',
} as const;

// File types
export const SUPPORTED_FILE_TYPES = {
  IMAGES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  DOCUMENTS: ['application/pdf', 'text/plain', 'application/msword'],
  SPREADSHEETS: [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
} as const;

// Theme
export const THEME = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
} as const;

// Local storage keys
export const STORAGE_KEYS = {
  THEME: 'offrows-theme',
  SIDEBAR_COLLAPSED: 'offrows-sidebar-collapsed',
  SELECTED_ROWS: 'offrows-selected-rows',
} as const;
