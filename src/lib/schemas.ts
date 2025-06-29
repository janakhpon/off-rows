import { z } from 'zod';

// Field type schema
export const FieldTypeSchema = z.enum(['text', 'number', 'boolean', 'date', 'dropdown', 'image', 'file']);

// File/Image value schema
export const FileValueSchema = z.object({
  name: z.string(),
  type: z.string(),
  fileId: z.number(),
});

export type FileValueWithId = z.infer<typeof FileValueSchema>;

// Field schema
export const FieldSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Field name is required'),
  type: FieldTypeSchema,
  required: z.boolean().optional(),
  options: z.array(z.string()).optional(), // For dropdown type
  defaultValue: z.union([z.string(), z.number(), z.boolean(), z.null(), FileValueSchema]).optional(), // Only allow single file objects, not arrays
});

// Table schema
export const TableSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, 'Table name is required'),
  description: z.string().optional(),
  fields: z.array(FieldSchema).min(1, 'At least one field is required'),
  colWidths: z.record(z.string(), z.number()).optional(),
  rowHeights: z.record(z.string(), z.number()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Table row schema
export const TableRowSchema = z.object({
  id: z.number().optional(),
  tableId: z.number(),
  data: z.record(z.string(), z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    FileValueSchema // Only allow a single file object for file/image fields
  ])),
  order: z.number().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Filter rule schema
export const FilterRuleSchema = z.object({
  fieldId: z.string(),
  operator: z.enum(['equals', 'contains', 'greater', 'less', 'startsWith', 'endsWith']),
  value: z.union([z.string(), z.number(), z.boolean(), z.null()]),
});

// Sort rule schema
export const SortRuleSchema = z.object({
  fieldId: z.string(),
  direction: z.enum(['asc', 'desc']),
});

// Color rule schema
export const ColorRuleSchema = z.object({
  fieldId: z.string(),
  operator: z.enum(['equals', 'contains', 'greater', 'less']),
  value: z.union([z.string(), z.number(), z.boolean(), z.null()]),
  color: z.string(),
});

// View settings schema
export const ViewSettingsSchema = z.object({
  id: z.number().optional(),
  tableId: z.number(),
  name: z.string().min(1, 'View name is required'),
  hiddenFields: z.array(z.string()),
  filters: z.array(FilterRuleSchema),
  sorts: z.array(SortRuleSchema),
  rowHeight: z.enum(['compact', 'default', 'large']),
  colorRules: z.array(ColorRuleSchema),
  isDefault: z.boolean().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// New table form schema
export const NewTableFormSchema = z.object({
  name: z.string().min(1, 'Table name is required').max(100, 'Table name must be less than 100 characters'),
  description: z.string().optional(),
  fields: z.array(FieldSchema).min(1, 'At least one field is required'),
});

// New row form schema
export const NewRowFormSchema = z.object({
  tableId: z.number(),
  data: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])),
});

// Export types
export type Field = z.infer<typeof FieldSchema>;
export type Table = z.infer<typeof TableSchema>;
export type TableRow = z.infer<typeof TableRowSchema>;
export type FilterRule = z.infer<typeof FilterRuleSchema>;
export type SortRule = z.infer<typeof SortRuleSchema>;
export type ColorRule = z.infer<typeof ColorRuleSchema>;
export type ViewSettings = z.infer<typeof ViewSettingsSchema>;
export type NewTableForm = z.infer<typeof NewTableFormSchema>;
export type NewRowForm = z.infer<typeof NewRowFormSchema>; 