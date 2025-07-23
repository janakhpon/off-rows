import { pgTable, serial, text, timestamp, integer, jsonb, boolean, uniqueIndex } from "drizzle-orm/pg-core";
import { z } from "zod";

export const stories = pgTable("stories", {
  id: serial("id").primaryKey(),
  header: text("header").notNull(),
  paragraphs: text("paragraphs").array().notNull(),
  tags: text("tags").array().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const storyZodSchema = z.object({
  header: z.string().min(1),
  paragraphs: z.array(z.string().min(1)),
  tags: z.array(z.string().min(1)),
});

// Table schema for cloud sync
export const tables = pgTable("tables", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  fields: jsonb("fields").notNull(), // Array of field objects
  colWidths: jsonb("col_widths"), // Record of column widths
  rowHeights: jsonb("row_heights"), // Record of row heights
  version: integer("version").default(0).notNull(), // For optimistic concurrency control
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Table rows schema for cloud sync
export const tableRows = pgTable("table_rows", {
  id: serial("id").primaryKey(),
  tableId: integer("table_id").notNull().references(() => tables.id, { onDelete: "cascade" }),
  rowKey: text("row_key"), // Unique stable identifier for deduplication
  data: jsonb("data").notNull(), // Record of field values
  order: integer("order"),
  version: integer("version").default(0).notNull(), // For optimistic concurrency control
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  tableRowKeyUnique: uniqueIndex('table_row_key_unique').on(table.tableId, table.rowKey),
}));

// Table views schema for cloud sync
export const tableViews = pgTable("table_views", {
  id: serial("id").primaryKey(),
  tableId: integer("table_id").notNull().references(() => tables.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  hiddenFields: jsonb("hidden_fields").notNull(), // Array of field IDs
  filters: jsonb("filters").notNull(), // Array of filter objects
  sorts: jsonb("sorts").notNull(), // Array of sort objects
  rowHeight: text("row_height").notNull(), // 'compact', 'default', 'large'
  colorRules: jsonb("color_rules").notNull(), // Array of color rule objects
  isDefault: boolean("is_default").default(false),
  version: integer("version").default(0).notNull(), // For optimistic concurrency control
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Zod schemas for validation
export const tableZodSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  fields: z.array(z.object({
    id: z.string(),
    name: z.string().min(1),
    type: z.enum(['text', 'number', 'boolean', 'date', 'dropdown', 'image', 'file', 'images', 'files']),
    required: z.boolean().optional(),
    options: z.array(z.string()).optional(),
    defaultValue: z.any().optional(),
  })).min(1),
  colWidths: z.record(z.string(), z.number()).optional(),
  rowHeights: z.record(z.string(), z.number()).optional(),
});

export const tableRowZodSchema = z.object({
  tableId: z.number(),
  rowKey: z.string().optional(), // Optional for backward compatibility
  data: z.record(z.string(), z.any()),
  order: z.number().optional(),
});

export const tableViewZodSchema = z.object({
  tableId: z.number(),
  name: z.string().min(1),
  hiddenFields: z.array(z.string()),
  filters: z.array(z.object({
    fieldId: z.string(),
    operator: z.enum(['equals', 'contains', 'greater', 'less', 'startsWith', 'endsWith']),
    value: z.any(),
  })),
  sorts: z.array(z.object({
    fieldId: z.string(),
    direction: z.enum(['asc', 'desc']),
  })),
  rowHeight: z.enum(['compact', 'default', 'large']),
  colorRules: z.array(z.object({
    fieldId: z.string(),
    operator: z.enum(['equals', 'contains', 'greater', 'less']),
    value: z.any(),
    color: z.string(),
  })),
  isDefault: z.boolean().optional(),
});
