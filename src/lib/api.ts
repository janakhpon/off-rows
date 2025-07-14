const getApiBaseUrl = () => {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) {
    console.warn('[ApiService] NEXT_PUBLIC_API_URL is not set! Falling back to http://localhost:3001/api');
    return 'http://localhost:3001/api';
  }
  if (!/^https?:\/\//.test(url)) {
    console.warn('[ApiService] NEXT_PUBLIC_API_URL does not look like a valid URL:', url);
  }
  return url.replace(/\/$/, ''); // Remove trailing slash
};

const API_BASE_URL = getApiBaseUrl();

export interface S3UploadResponse {
  success: boolean;
  filename: string;
  s3Url: string;
  message: string;
}

export interface S3DeleteResponse {
  success: boolean;
  deletedKey: string;
  message: string;
}

export interface S3StatusResponse {
  configured: boolean;
  hasRegion: boolean;
  hasAccessKey: boolean;
  hasSecretKey: boolean;
  hasBucket: boolean;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url: string, options: RequestInit, retries = 3, backoff = 500): Promise<Response> {
  let lastError;
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res;
    } catch (err) {
      lastError = err;
      if (i < retries - 1) {
        await delay(backoff * Math.pow(2, i));
      }
    }
  }
  throw lastError;
}

export class ApiService {
  /**
   * Upload image to S3 via backend API
   */
  static async uploadImageToS3(filename: string, data: Uint8Array): Promise<S3UploadResponse> {
    // Convert Uint8Array to base64 safely (chunked)
    function uint8ToBase64(u8Arr: Uint8Array) {
      const CHUNK_SIZE = 0x8000; // 32kB
      let index = 0;
      const length = u8Arr.length;
      let result = '';
      let slice;
      while (index < length) {
        slice = u8Arr.subarray(index, Math.min(index + CHUNK_SIZE, length));
        // Convert Uint8Array to number[] for fromCharCode
        result += String.fromCharCode.apply(null, Array.prototype.slice.call(slice));
        index += CHUNK_SIZE;
      }
      return btoa(result);
    }
    const base64Data = uint8ToBase64(data);
    try {
      const response = await fetchWithRetry(`${API_BASE_URL}/s3/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename,
          data: base64Data,
          contentType: filename.endsWith('.webp') ? 'image/webp' : 'image/jpeg',
        }),
      });
      return await response.json();
    } catch (error) {
      console.error('[ApiService] Failed to upload image to S3:', error);
      throw error;
    }
  }

  /**
   * Delete image from S3 via backend API
   */
  static async deleteImageFromS3(s3Key: string): Promise<S3DeleteResponse> {
    try {
      const response = await fetchWithRetry(`${API_BASE_URL}/s3/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          s3Key,
        }),
      });
      return await response.json();
    } catch (error) {
      console.error('[ApiService] Failed to delete image from S3:', error);
      throw error;
    }
  }

  /**
   * Check S3 configuration status
   */
  static async getS3Status(): Promise<S3StatusResponse> {
    try {
      const response = await fetchWithRetry(`${API_BASE_URL}/s3/status`, {}, 2, 300);
      return await response.json();
    } catch (error) {
      console.error('[ApiService] Failed to get S3 status:', error);
      throw error;
    }
  }
} 