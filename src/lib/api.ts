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

export interface TableSyncResponse {
  tables: Record<string, unknown>[];
  rows: Record<string, unknown>[];
  views: Record<string, unknown>[];
  conflicts?: Array<{ type: string; id: string; message?: string }>;
}

export interface BackendStatusResponse {
  available: boolean;
  version?: string;
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

  /**
   * Check backend availability
   */
  static async getBackendStatus(): Promise<BackendStatusResponse> {
    try {
      const response = await fetchWithRetry(`${API_BASE_URL}/health`, {}, 2, 300);
      const data = await response.json();
      return { available: true, version: data.version };
    } catch (error) {
      console.error('[ApiService] Failed to get backend status:', error);
      return { available: false };
    }
  }

  /**
   * Sync all table data to backend
   */
  static async syncTablesToCloud(data: {
    tables: Record<string, unknown>[];
    rows: Record<string, unknown>[];
    views: Record<string, unknown>[];
  }): Promise<TableSyncResponse> {
    try {
      console.log('[ApiService] Sending sync request to:', `${API_BASE_URL}/tables/sync`);
      console.log('[ApiService] Request data:', JSON.stringify(data, null, 2));
      
      const response = await fetchWithRetry(`${API_BASE_URL}/tables/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      const result = await response.json();
      console.log('[ApiService] Sync response:', result);
      return result;
    } catch {
      console.error('[ApiService] Failed to sync tables to cloud');
      throw new Error('Failed to sync tables to cloud');
    }
  }

  /**
   * Get all tables from backend
   */
  static async getTablesFromCloud(): Promise<Record<string, unknown>[]> {
    try {
      const response = await fetchWithRetry(`${API_BASE_URL}/tables`, {}, 2, 300);
      return await response.json();
    } catch {
      console.error('[ApiService] Failed to get tables from cloud');
      throw new Error('Failed to get tables from cloud');
    }
  }

  /**
   * Get all rows for a table from backend
   */
  static async getTableRowsFromCloud(tableId: number): Promise<Record<string, unknown>[]> {
    try {
      const response = await fetchWithRetry(`${API_BASE_URL}/tables/${tableId}/rows`, {}, 2, 300);
      return await response.json();
    } catch {
      console.error('[ApiService] Failed to get table rows from cloud');
      throw new Error('Failed to get table rows from cloud');
    }
  }

  /**
   * Get all views for a table from backend
   */
  static async getTableViewsFromCloud(tableId: number): Promise<Record<string, unknown>[]> {
    try {
      const response = await fetchWithRetry(`${API_BASE_URL}/tables/${tableId}/views`, {}, 2, 300);
      return await response.json();
    } catch {
      console.error('[ApiService] Failed to get table views from cloud');
      throw new Error('Failed to get table views from cloud');
    }
  }

  /**
   * Get a single table by ID from backend
   */
  static async getTableFromCloud(tableId: string | number): Promise<Record<string, unknown> | null> {
    try {
      const response = await fetchWithRetry(`${API_BASE_URL}/tables/${tableId}`, {}, 2, 300);
      if (response.status === 404) return null;
      return await response.json();
    } catch {
      return null;
    }
  }
  /**
   * Get a single row by ID from backend
   */
  static async getTableRowFromCloud(rowId: string | number): Promise<Record<string, unknown> | null> {
    try {
      const response = await fetchWithRetry(`${API_BASE_URL}/tables/rows/${rowId}`, {}, 2, 300);
      if (response.status === 404) return null;
      return await response.json();
    } catch {
      return null;
    }
  }
  /**
   * Get a single view by ID from backend
   */
  static async getTableViewFromCloud(viewId: string | number): Promise<Record<string, unknown> | null> {
    try {
      const response = await fetchWithRetry(`${API_BASE_URL}/tables/views/${viewId}`, {}, 2, 300);
      if (response.status === 404) return null;
      return await response.json();
    } catch {
      return null;
    }
  }
} 