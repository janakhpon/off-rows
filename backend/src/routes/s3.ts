import { Router } from "express";
import * as s3Controller from "../controllers/s3";

/**
 * @openapi
 * /api/s3/upload:
 *   post:
 *     summary: Upload image to S3
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - filename
 *               - data
 *             properties:
 *               filename:
 *                 type: string
 *                 description: Name of the file to upload
 *               data:
 *                 type: string
 *                 description: Base64 encoded image data
 *               contentType:
 *                 type: string
 *                 description: MIME type of the image (optional)
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 filename:
 *                   type: string
 *                 s3Url:
 *                   type: string
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad request - missing or invalid data
 *       500:
 *         description: Server error - S3 configuration or upload failed
 *
 * /api/s3/delete:
 *   delete:
 *     summary: Delete image from S3
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - s3Key
 *             properties:
 *               s3Key:
 *                 type: string
 *                 description: S3 key of the file to delete
 *               filename:
 *                 type: string
 *                 description: Alternative to s3Key - filename to delete
 *     responses:
 *       200:
 *         description: Image deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 deletedKey:
 *                   type: string
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad request - missing s3Key or filename
 *       500:
 *         description: Server error - S3 configuration or delete failed
 *
 * /api/s3/status:
 *   get:
 *     summary: Check S3 configuration status
 *     responses:
 *       200:
 *         description: S3 configuration status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 configured:
 *                   type: boolean
 *                 hasRegion:
 *                   type: boolean
 *                 hasAccessKey:
 *                   type: boolean
 *                 hasSecretKey:
 *                   type: boolean
 *                 hasBucket:
 *                   type: boolean
 */
const router = Router();

router.post("/upload", s3Controller.uploadImage);
router.delete("/delete", s3Controller.deleteImage);
router.get("/status", s3Controller.getS3Status);

export default router; 