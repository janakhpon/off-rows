import { Router } from "express";
import * as storiesController from "../controllers/stories";
import { storyZodSchema } from "../db/schema";
import { validate } from "../middleware/validate";

/**
 * @openapi
 * /api/stories:
 *   get:
 *     summary: List all stories
 *     tags: [Stories]
 *     responses:
 *       200:
 *         description: A list of stories
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/StoryInput'
 *   post:
 *     summary: Create a story
 *     tags: [Stories]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StoryInput'
 *     responses:
 *       201:
 *         description: The created story
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StoryInput'
 *
 * /api/stories/{id}:
 *   get:
 *     summary: Get a story
 *     tags: [Stories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Story ID
 *     responses:
 *       200:
 *         description: A story
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StoryInput'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     summary: Update a story
 *     tags: [Stories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Story ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StoryInput'
 *     responses:
 *       200:
 *         description: The updated story
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StoryInput'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   delete:
 *     summary: Delete a story
 *     tags: [Stories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Story ID
 *     responses:
 *       204:
 *         description: Story deleted successfully
 *       404:
 *         $ref: '#/components/responses/NotFound'
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
