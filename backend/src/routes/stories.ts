import { Router } from "express";
import * as storiesController from "../controllers/stories";
import { storyZodSchema } from "../db/schema";
import { validate } from "../middleware/validate";

/**
 * @openapi
 * /api/stories:
 *   get:
 *     summary: List all stories
 *     responses:
 *       200:
 *         description: A list of stories
 *   post:
 *     summary: Create a story
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StoryInput'
 *     responses:
 *       201:
 *         description: The created story
 *
 * /api/stories/{id}:
 *   get:
 *     summary: Get a story
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: A story
 *       404:
 *         description: Not found
 *   put:
 *     summary: Update a story
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StoryInput'
 *     responses:
 *       200:
 *         description: The updated story
 *       404:
 *         description: Not found
 *   delete:
 *     summary: Delete a story
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Deleted
 *       404:
 *         description: Not found
 *
 * components:
 *   schemas:
 *     StoryInput:
 *       type: object
 *       required:
 *         - header
 *         - paragraphs
 *         - tags
 *       properties:
 *         header:
 *           type: string
 *         paragraphs:
 *           type: array
 *           items:
 *             type: string
 *         tags:
 *           type: array
 *           items:
 *             type: string
 */
const router = Router();

router.get("/", storiesController.listStories);
router.get("/:id", storiesController.getStory);
router.post("/", validate(storyZodSchema), storiesController.createStory);
router.put(
  "/:id",
  validate(storyZodSchema.partial()),
  storiesController.updateStory,
);
router.delete("/:id", storiesController.deleteStory);

export default router;
