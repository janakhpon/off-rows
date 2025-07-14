import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_BUCKET_NAME } from '../config';

// Initialize S3 client
const s3Client = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
});

export interface ImageUploadData {
  filename: string;
  data: Buffer;
  contentType?: string;
}

export class S3Service {
  /**
   * Upload an image to S3
   */
  static async uploadImage({ filename, data, contentType }: ImageUploadData): Promise<string> {
    if (!AWS_BUCKET_NAME) {
      throw new Error('AWS_BUCKET_NAME is not configured');
    }

    const command = new PutObjectCommand({
      Bucket: AWS_BUCKET_NAME,
      Key: filename,
      Body: data,
      ContentType: contentType || this.getContentType(filename),
    });

    await s3Client.send(command);
    
    // Return the S3 URL
    return `https://${AWS_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${filename}`;
  }

  /**
   * Delete an image from S3
   */
  static async deleteImage(s3Key: string): Promise<void> {
    if (!AWS_BUCKET_NAME) {
      throw new Error('AWS_BUCKET_NAME is not configured');
    }

    const command = new DeleteObjectCommand({
      Bucket: AWS_BUCKET_NAME,
      Key: s3Key,
    });

    await s3Client.send(command);
  }

  /**
   * Get content type based on file extension
   */
  private static getContentType(filename: string): string {
    if (filename.endsWith('.webp')) {
      return 'image/webp';
    }
    if (filename.endsWith('.png')) {
      return 'image/png';
    }
    if (filename.endsWith('.gif')) {
      return 'image/gif';
    }
    // Default to JPEG
    return 'image/jpeg';
  }

  /**
   * Validate AWS configuration
   */
  static validateConfig(): boolean {
    return !!(AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY && AWS_BUCKET_NAME);
  }
} 