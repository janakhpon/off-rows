import { Request, Response } from 'express';
import { S3Service } from '../services/s3';

/**
 * Upload image to S3
 * POST /api/s3/upload
 */
export const uploadImage = async (req: Request, res: Response) => {
  try {
    const { filename, data, contentType } = req.body;

    // Validate required fields
    if (!filename || !data) {
      return res.status(400).json({
        error: 'Missing required fields: filename and data are required'
      });
    }

    // Validate AWS configuration
    if (!S3Service.validateConfig()) {
      return res.status(500).json({
        error: 'S3 configuration is incomplete. Please check AWS credentials and bucket name.'
      });
    }

    // Convert base64 data to Buffer if needed
    let imageBuffer: Buffer;
    if (typeof data === 'string') {
      // Handle base64 data
      const base64Data = data.replace(/^data:image\/[a-z]+;base64,/, '');
      imageBuffer = Buffer.from(base64Data, 'base64');
    } else if (Buffer.isBuffer(data)) {
      imageBuffer = data;
    } else {
      return res.status(400).json({
        error: 'Invalid data format. Expected base64 string or Buffer.'
      });
    }

    // Upload to S3
    const s3Url = await S3Service.uploadImage({
      filename,
      data: imageBuffer,
      contentType
    });

    return res.json({
      success: true,
      filename,
      s3Url,
      message: 'Image uploaded successfully'
    });

  } catch (error) {
    console.error('S3 upload error:', error);
    return res.status(500).json({
      error: 'Failed to upload image to S3',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Delete image from S3
 * DELETE /api/s3/delete
 */
export const deleteImage = async (req: Request, res: Response) => {
  try {
    const { s3Key, filename } = req.body;

    // Validate required fields
    if (!s3Key && !filename) {
      return res.status(400).json({
        error: 'Missing required fields: s3Key or filename is required'
      });
    }

    // Validate AWS configuration
    if (!S3Service.validateConfig()) {
      return res.status(500).json({
        error: 'S3 configuration is incomplete. Please check AWS credentials and bucket name.'
      });
    }

    const keyToDelete = s3Key || filename;

    // Delete from S3
    await S3Service.deleteImage(keyToDelete);

    return res.json({
      success: true,
      deletedKey: keyToDelete,
      message: 'Image deleted successfully from S3'
    });

  } catch (error) {
    console.error('S3 delete error:', error);
    return res.status(500).json({
      error: 'Failed to delete image from S3',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get S3 configuration status
 * GET /api/s3/status
 */
export const getS3Status = async (req: Request, res: Response) => {
  try {
    const isConfigured = S3Service.validateConfig();
    
    res.json({
      configured: isConfigured,
      hasRegion: !!process.env.AWS_REGION,
      hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
      hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
      hasBucket: !!process.env.AWS_BUCKET_NAME,
    });
  } catch (error) {
    console.error('S3 status check error:', error);
    res.status(500).json({
      error: 'Failed to check S3 configuration'
    });
  }
}; 