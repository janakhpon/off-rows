import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
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
