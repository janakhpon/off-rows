import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getUnsyncedImages, markImageAsSynced } from './database';
import { getImageSettingsSnapshot } from './imageSettingsStore';

const s3 = new S3Client({
  region: process.env.NEXT_PUBLIC_AWS_REGION!,
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY!,
  },
});

export async function uploadImageToS3({ filename, data }: { filename: string; data: Uint8Array }) {
  const command = new PutObjectCommand({
    Bucket: process.env.NEXT_PUBLIC_AWS_BUCKET_NAME!,
    Key: filename,
    Body: data,
    ContentType: filename.endsWith('.webp') ? 'image/webp' : 'image/jpeg',
  });
  await s3.send(command);
}

export async function syncImagesToS3IfNeeded() {
  const { syncImagesToS3 } = getImageSettingsSnapshot();
  if (!syncImagesToS3 || !navigator.onLine) return;
  const unsynced = await getUnsyncedImages();
  for (const img of unsynced) {
    try {
      await uploadImageToS3({ filename: img.filename, data: img.data });
      if (typeof img.id === 'number') {
        await markImageAsSynced(img.id);
      }
    } catch {
      // Optionally log or show error
    }
  }
}
