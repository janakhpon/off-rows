import { Router } from "express";
import * as s3Controller from "../controllers/s3";

/**
 * @openapi
 * /api/s3/upload:
 *   post:
 *     summary: Upload image to S3
 *     tags: [S3]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/S3UploadRequest'
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
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 * /api/s3/delete:
 *   delete:
 *     summary: Delete image from S3
 *     tags: [S3]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/S3DeleteRequest'
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
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 * /api/s3/status:
 *   get:
 *     summary: Check S3 configuration status
 *     tags: [S3]
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