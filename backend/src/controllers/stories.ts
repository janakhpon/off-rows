import { Request, Response } from "express";
import * as storiesService from "../services/stories";
import { redis } from "../db/redis";

const LIST_CACHE_KEY = "stories:list";
const ITEM_CACHE_PREFIX = "stories:item:";

export const listStories = async (req: Request, res: Response) => {
  const cached = await redis.get(LIST_CACHE_KEY);
  if (cached) return res.json(JSON.parse(cached));
  const stories = await storiesService.listStories();
  await redis.setEx(LIST_CACHE_KEY, 30, JSON.stringify(stories));
  res.json(stories);
};

export const getStory = async (req: Request, res: Response) => {
  const cacheKey = ITEM_CACHE_PREFIX + req.params.id;
  const cached = await redis.get(cacheKey);
  if (cached) return res.json(JSON.parse(cached));
  const story = await storiesService.getStory(Number(req.params.id));
  if (!story) return res.status(404).json({ error: "Story not found" });
  await redis.setEx(cacheKey, 60, JSON.stringify(story));
  res.json(story);
};

export const createStory = async (req: Request, res: Response) => {
  const story = await storiesService.createStory(req.body);
  await redis.del(LIST_CACHE_KEY);
  res.status(201).json(story);
};

export const updateStory = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const story = await storiesService.updateStory(id, req.body);
  if (!story) return res.status(404).json({ error: "Story not found" });
  await redis.del(LIST_CACHE_KEY);
  await redis.del(ITEM_CACHE_PREFIX + id);
  res.json(story);
};

export const deleteStory = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const ok = await storiesService.deleteStory(id);
  if (!ok) return res.status(404).json({ error: "Story not found" });
  await redis.del(LIST_CACHE_KEY);
  await redis.del(ITEM_CACHE_PREFIX + id);
  res.status(204).send();
};
