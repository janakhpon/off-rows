ALTER TABLE "table_rows" ADD COLUMN "row_key" text;--> statement-breakpoint
ALTER TABLE "tables" ADD CONSTRAINT "tables_name_unique" UNIQUE("name");