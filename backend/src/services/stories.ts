import { db } from "../db/client";
import { stories } from "../db/schema";
import { eq } from "drizzle-orm";

export const listStories = async () => {
  return db.select().from(stories);
};

export const getStory = async (id: number) => {
  const result = await db.select().from(stories).where(eq(stories.id, id));
  return result[0] || null;
};

export const createStory = async (data: {
  header: string;
  paragraphs: string[];
  tags: string[];
}) => {
  const [story] = await db.insert(stories).values(data).returning();
  return story;
};

export const updateStory = async (
  id: number,
  data: { header?: string; paragraphs?: string[]; tags?: string[] },
) => {
  const [story] = await db
    .update(stories)
    .set(data)
    .where(eq(stories.id, id))
    .returning();
  return story || null;
};

export const deleteStory = async (id: number) => {
  const result = await db.delete(stories).where(eq(stories.id, id)).returning();
  return result.length > 0;
};
