import Dexie from 'dexie';
import {
  Table,
  TableRow,
  ViewSettings,
  TableSchema as TableSchemaType,
  TableRowSchema as TableRowSchemaType,
  ViewSettingsSchema as ViewSettingsSchemaType,
} from './schemas';

// Only initialize Dexie in the browser
declare global {
  // eslint-disable-next-line no-var
  var __offrows_db__: Dexie | undefined;
}

function createDB() {
  const db = new Dexie('OffrowsDatabase');
  db.version(11).stores({
    tables: '++id, name, description, colWidths, rowHeights',
    rows: '++id, tableId, data, order',
    views: '++id, tableId, name, isDefault',
    files: '++id, name, type, s3Key, synced, syncStatus, lastSyncAttempt, createdAt, updatedAt',
    images: '++id, filename, synced, syncStatus, s3Key, lastSyncAttempt, createdAt, updatedAt',
    deleted_files: '++id, fileId, filename, s3Key, deletedAt, synced, syncStatus',
    file_operations: '++id, fileId, operation, status, createdAt, retryCount',
    settings: 'key, value',
  });
  return db;
}

export function getDB(): Dexie | undefined {
  if (typeof window !== 'undefined' && 'indexedDB' in window) {
    if (!globalThis.__offrows_db__) {
      globalThis.__offrows_db__ = createDB();
    }
    return globalThis.__offrows_db__;
  }
  return undefined;
}

// --- All DB operations below use getDB() ---

// Enhanced schema for images with comprehensive tracking
if (!getDB()?.tables.some((t) => t.name === 'images')) {
  console.log('Creating images table with enhanced schema...');
  getDB()?.version(7).stores({
    images: '++id, filename, synced, syncStatus, s3Key, lastSyncAttempt, createdAt, updatedAt',
  });
} else {
  console.log('Images table already exists');
}

// Add deleted_files table for tracking deletions
if (!getDB()?.tables.some((t) => t.name === 'deleted_files')) {
  console.log('Creating deleted_files table...');
  getDB()?.version(8).stores({
    deleted_files: '++id, fileId, filename, s3Key, deletedAt, synced, syncStatus',
  });
} else {
  console.log('Deleted_files table already exists');
}

// Add file_operations table for tracking pending operations
if (!getDB()?.tables.some((t) => t.name === 'file_operations')) {
  console.log('Creating file_operations table...');
  getDB()?.version(9).stores({
    file_operations: '++id, fileId, operation, status, createdAt, retryCount',
  });
} else {
  console.log('File_operations table already exists');
}

// Extend files table schema for S3 sync meta
if (!getDB()?.tables.some((t) => t.name === 'files')) {
  getDB()?.version(10).stores({
    files: '++id, name, type, s3Key, synced, syncStatus, lastSyncAttempt, createdAt, updatedAt',
  });
} else {
  getDB()?.version(10).stores({
    files: '++id, name, type, s3Key, synced, syncStatus, lastSyncAttempt, createdAt, updatedAt',
  });
}

console.log('Database schema version:', getDB()?.verno);
console.log('Available tables:', getDB()?.tables.map(t => t.name));

// Initialize with sample data if database is empty
export async function initializeDatabase() {
  const tableCount = await getDB()?.table('tables').count();

  // Check if we should skip initialization (after clearing storage)
  const skipInitialization = sessionStorage.getItem('skipInitialization');
  if (skipInitialization === 'true') {
    sessionStorage.removeItem('skipInitialization');
    return;
  }

  if (tableCount === 0) {
    const sampleTables: Omit<Table, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        name: 'Project Tracker',
        description: 'Track project tasks and progress',
        fields: [
          { id: 'taskName', name: 'Task Name', type: 'text', required: true },
          {
            id: 'status',
            name: 'Status',
            type: 'dropdown',
            options: ['In Progress', 'Completed', 'Pending', 'Blocked'],
            required: true,
          },
          { id: 'dueDate', name: 'Due Date', type: 'date' },
          {
            id: 'priority',
            name: 'Priority',
            type: 'dropdown',
            options: ['High', 'Medium', 'Low'],
            required: true,
          },
          { id: 'assignee', name: 'Assignee', type: 'text' },
          { id: 'progress', name: 'Progress', type: 'number', defaultValue: 0 },
          { id: 'completed', name: 'Completed', type: 'boolean', defaultValue: false },
          { id: 'attachments', name: 'Attachments', type: 'file' },
        ],
      },
      {
        name: 'User Management',
        description: 'Manage user accounts and permissions',
        fields: [
          { id: 'name', name: 'Name', type: 'text', required: true },
          { id: 'email', name: 'Email', type: 'text', required: true },
          {
            id: 'role',
            name: 'Role',
            type: 'dropdown',
            options: ['Admin', 'User', 'Guest'],
            required: true,
          },
          { id: 'active', name: 'Active', type: 'boolean', defaultValue: true },
          { id: 'lastLogin', name: 'Last Login', type: 'date' },
          { id: 'avatar', name: 'Avatar', type: 'image' },
        ],
      },
      {
        name: 'Inventory System',
        description: 'Track inventory items and stock levels',
        fields: [
          { id: 'itemName', name: 'Item Name', type: 'text', required: true },
          {
            id: 'category',
            name: 'Category',
            type: 'dropdown',
            options: ['Electronics', 'Clothing', 'Books', 'Other'],
            required: true,
          },
          { id: 'quantity', name: 'Quantity', type: 'number', defaultValue: 0 },
          { id: 'price', name: 'Price', type: 'number', defaultValue: 0 },
          { id: 'inStock', name: 'In Stock', type: 'boolean', defaultValue: true },
          { id: 'lastUpdated', name: 'Last Updated', type: 'date' },
          { id: 'image', name: 'Product Image', type: 'image' },
        ],
      },
    ];

    const createdTables = await getDB()?.table('tables').bulkAdd(sampleTables);
    const tableIds = Array.isArray(createdTables) ? createdTables : [createdTables];

    // Add sample rows for each table
    const sampleRows: Omit<TableRow, 'id' | 'createdAt' | 'updatedAt'>[] = [
      // Project Tracker rows
      {
        tableId: tableIds[0] as number,
        data: {
          taskName: 'Design new landing page',
          status: 'In Progress',
          dueDate: '2024-01-15',
          priority: 'High',
          assignee: 'John Doe',
          progress: 75,
          completed: false,
          attachments: null,
        },
      },
      {
        tableId: tableIds[0] as number,
        data: {
          taskName: 'Implement user authentication',
          status: 'Completed',
          dueDate: '2024-01-10',
          priority: 'High',
          assignee: 'Jane Smith',
          progress: 100,
          completed: true,
          attachments: null,
        },
      },
      {
        tableId: tableIds[0] as number,
        data: {
          taskName: 'Write API documentation',
          status: 'Pending',
          dueDate: '2024-01-20',
          priority: 'Medium',
          assignee: 'Mike Johnson',
          progress: 25,
          completed: false,
          attachments: null,
        },
      },
      // User Management rows
      {
        tableId: tableIds[1] as number,
        data: {
          name: 'John Doe',
          email: 'john@example.com',
          role: 'Admin',
          active: true,
          lastLogin: '2024-01-10',
          avatar: null,
        },
      },
      {
        tableId: tableIds[1] as number,
        data: {
          name: 'Jane Smith',
          email: 'jane@example.com',
          role: 'User',
          active: true,
          lastLogin: '2024-01-12',
          avatar: null,
        },
      },
      // Inventory rows
      {
        tableId: tableIds[2] as number,
        data: {
          itemName: 'Laptop',
          category: 'Electronics',
          quantity: 10,
          price: 999.99,
          inStock: true,
          lastUpdated: '2024-01-10',
          image: null,
        },
      },
      {
        tableId: tableIds[2] as number,
        data: {
          itemName: 'T-Shirt',
          category: 'Clothing',
          quantity: 50,
          price: 19.99,
          inStock: true,
          lastUpdated: '2024-01-12',
          image: null,
        },
      },
    ];

    await getDB()?.table('rows').bulkAdd(sampleRows);

    // Create default views for each table
    const defaultViews: Omit<ViewSettings, 'id' | 'createdAt' | 'updatedAt'>[] = (
      tableIds as number[]
    ).map((tableId: number) => ({
      tableId,
      name: 'Default View',
      hiddenFields: [],
      filters: [],
      sorts: [],
      rowHeight: 'default',
      colorRules: [],
      isDefault: true,
    }));

    await getDB()?.table('views').bulkAdd(defaultViews);
  }
}

// Utility functions for date handling
const createTimestamp = () => new Date();
const parseDate = (date: string | Date) => new Date(date);

// Utility function for adding timestamps to objects
const addTimestamps = <T extends object>(obj: T) => ({
  ...obj,
  createdAt: createTimestamp(),
  updatedAt: createTimestamp(),
});

// Utility function for updating timestamps
const updateTimestamp = <T extends object>(obj: T) => ({
  ...obj,
  updatedAt: createTimestamp(),
});

// Utility function for parsing dates in database results
const parseDates = <T extends { createdAt: string | Date; updatedAt: string | Date }>(obj: T) => ({
  ...obj,
  createdAt: parseDate(obj.createdAt),
  updatedAt: parseDate(obj.updatedAt),
});

// Table operations
export const tableOperations = {
  async getAll(): Promise<Table[]> {
    const db = getDB();
    if (!db) return [];
    const tables = (await db.table('tables').toArray()) as Table[];
    return tables.map(parseDates);
  },

  async getById(id: number): Promise<Table | undefined> {
    const db = getDB();
    if (!db) return undefined;
    const table = (await db.table('tables').get(id)) as Table | undefined;
    return table ? parseDates(table) : undefined;
  },

  async add(table: Omit<Table, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
    const db = getDB();
    if (!db) throw new Error('Database not initialized');
    // Validate with Zod
    const validatedTable = TableSchemaType.parse(addTimestamps(table));

    const tableId = (await db.table('tables').add(validatedTable)) as number;

    // Create default view for new table
    const defaultView = addTimestamps({
      tableId,
      name: 'Default View',
      hiddenFields: [],
      filters: [],
      sorts: [],
      rowHeight: 'default',
      colorRules: [],
      isDefault: true,
    });
    await getDB()?.table('views').add(defaultView);

    return tableId;
  },

  async update(id: number, updates: Partial<Omit<Table, 'id' | 'createdAt'>>): Promise<void> {
    const db = getDB();
    if (!db) throw new Error('Database not initialized');
    await db.table('tables').update(id, updateTimestamp(updates));
  },

  async delete(id: number): Promise<void> {
    const db = getDB();
    if (!db) throw new Error('Database not initialized');
    await db.table('tables').delete(id);
    await getDB()?.table('rows').where('tableId').equals(id).delete();
    await getDB()?.table('views').where('tableId').equals(id).delete();
  },

  async updateColWidths(tableId: number, colWidths: Record<string, number>) {
    const db = getDB();
    if (!db) throw new Error('Database not initialized');
    await db.table('tables').update(tableId, updateTimestamp({ colWidths }));
  },

  async updateRowHeights(tableId: number, rowHeights: Record<string, number>) {
    const db = getDB();
    if (!db) throw new Error('Database not initialized');
    await db.table('tables').update(tableId, updateTimestamp({ rowHeights }));
  },
};

// Row operations
export const rowOperations = {
  async getByTableId(tableId: number): Promise<TableRow[]> {
    const db = getDB();
    if (!db) return [];
    const rows = (await db.table('rows').where('tableId').equals(tableId).toArray()) as TableRow[];
    // Always sort by 'order' (fallback to id)
    return rows.map(parseDates).sort((a, b) => (a.order ?? a.id ?? 0) - (b.order ?? b.id ?? 0));
  },

  async getById(id: number): Promise<TableRow | undefined> {
    const db = getDB();
    if (!db) return undefined;
    const row = (await db.table('rows').get(id)) as TableRow | undefined;
    return row ? parseDates(row) : undefined;
  },

  async add(row: Omit<TableRow, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
    const db = getDB();
    if (!db) throw new Error('Database not initialized');
    // Find max order for this table
    const maxOrder = await db
      .table('rows')
      .where('tableId')
      .equals(row.tableId)
      .toArray()
      .then((rs) => rs.reduce((max, r) => Math.max(max, r.order ?? 0), 0));
    const validatedRow = TableRowSchemaType.parse(
      addTimestamps({
        ...row,
        order: maxOrder + 1,
      }),
    );
    return (await db.table('rows').add(validatedRow)) as number;
  },

  async update(id: number, updates: Partial<Omit<TableRow, 'id' | 'createdAt'>>): Promise<void> {
    const db = getDB();
    if (!db) throw new Error('Database not initialized');
    await db.table('rows').update(id, updateTimestamp(updates));
  },

  async delete(id: number): Promise<void> {
    const db = getDB();
    if (!db) throw new Error('Database not initialized');
    await db.table('rows').delete(id);
  },

  async bulkUpdate(rows: TableRow[]): Promise<void> {
    const db = getDB();
    if (!db) throw new Error('Database not initialized');
    await db.table('rows').bulkPut(rows);
  },
};

// View operations
export const viewOperations = {
  async getByTableId(tableId: number): Promise<ViewSettings[]> {
    const db = getDB();
    if (!db) return [];
    const views = (await db
      .table('views')
      .where('tableId')
      .equals(tableId)
      .toArray()) as ViewSettings[];
    return views.map(parseDates);
  },

  async getDefaultView(tableId: number): Promise<ViewSettings | undefined> {
    const db = getDB();
    if (!db) return undefined;
    const view = (await db
      .table('views')
      .where('tableId')
      .equals(tableId)
      .filter((view) => view.isDefault === true)
      .first()) as ViewSettings | undefined;
    return view ? parseDates(view) : undefined;
  },

  async getById(id: number): Promise<ViewSettings | undefined> {
    const db = getDB();
    if (!db) return undefined;
    const view = (await db.table('views').get(id)) as ViewSettings | undefined;
    return view ? parseDates(view) : undefined;
  },

  async add(view: Omit<ViewSettings, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
    const db = getDB();
    if (!db) throw new Error('Database not initialized');
    // Validate with Zod
    const validatedView = ViewSettingsSchemaType.parse(addTimestamps(view));

    return (await db.table('views').add(validatedView)) as number;
  },

  async update(
    id: number,
    updates: Partial<Omit<ViewSettings, 'id' | 'createdAt'>>,
  ): Promise<void> {
    const db = getDB();
    if (!db) throw new Error('Database not initialized');
    await db.table('views').update(id, updateTimestamp(updates));
  },

  async delete(id: number): Promise<void> {
    const db = getDB();
    if (!db) throw new Error('Database not initialized');
    await db.table('views').delete(id);
  },
};

// File operations for offline blob storage with meta tracking
export const fileOperations = {
  async addFile(file: File): Promise<number> {
    const db = getDB();
    if (!db) throw new Error('Database not initialized');
    const now = new Date().toISOString();
    const s3Key = `files/${Date.now()}_${file.name}`;
    const id = await db.table('files').add({
      name: file.name,
      type: file.type,
      blob: file,
      s3Key,
      synced: false,
      syncStatus: 'pending',
      lastSyncAttempt: '',
      createdAt: now,
      updatedAt: now,
    });
    return id as number;
  },
  async updateFile(id: number, file: File): Promise<void> {
    const db = getDB();
    if (!db) throw new Error('Database not initialized');
    const now = new Date().toISOString();
    await db.table('files').update(id, {
      name: file.name,
      type: file.type,
      blob: file,
      synced: false,
      syncStatus: 'pending',
      lastSyncAttempt: '',
      updatedAt: now,
    });
  },
  async getFileById(id: number): Promise<{ name: string; type: string; blob: Blob; s3Key?: string } | undefined> {
    const db = getDB();
    if (!db) return undefined;
    const file = await db.table('files').get(id);
    if (!file) return undefined;
    return { name: file.name, type: file.type, blob: file.blob, s3Key: file.s3Key };
  },
  async deleteFile(id: number): Promise<void> {
    const db = getDB();
    if (!db) throw new Error('Database not initialized');
    await db.table('files').delete(id);
  },
  async getUnsyncedFiles(): Promise<import('./syncOrchestrator').SyncedFileRecord[]> {
    const db = getDB();
    if (!db) return [];
    return db.table('files').filter(f => f.syncStatus === 'pending' || f.syncStatus === 'failed').toArray();
  },
  async markFileAsSynced(id: number): Promise<void> {
    const db = getDB();
    if (!db) throw new Error('Database not initialized');
    await db.table('files').update(id, { synced: true, syncStatus: 'synced' });
  },
  async markFileAsFailed(id: number): Promise<void> {
    const db = getDB();
    if (!db) throw new Error('Database not initialized');
    await db.table('files').update(id, { syncStatus: 'failed' });
  },
};

// File meta management for S3 sync (mirroring images)
export async function saveFileToIDB({ filename, data }: { filename: string; data: Uint8Array }): Promise<number> {
  const db = getDB();
  if (!db) throw new Error('Database not initialized');
  const now = new Date().toISOString();
  const s3Key = `files/${Date.now()}_${filename}`;
  const file = new File([data], filename);
  const id = await db.table('files').add({
    name: filename,
    type: file.type,
    blob: file,
    s3Key,
    synced: false,
    syncStatus: 'pending',
    lastSyncAttempt: '',
    createdAt: now,
    updatedAt: now,
  });
  return id as number;
}

export async function updateFileInIDB({ id, filename, data }: { id: number; filename: string; data: Uint8Array }): Promise<void> {
  const db = getDB();
  if (!db) throw new Error('Database not initialized');
  const now = new Date().toISOString();
  const file = new File([data], filename);
  await db.table('files').update(id, {
    name: filename,
    type: file.type,
    blob: file,
    synced: false,
    syncStatus: 'pending',
    lastSyncAttempt: '',
    updatedAt: now,
  });
}

export async function deleteFileFromIDB(id: number): Promise<void> {
  const db = getDB();
  if (!db) throw new Error('Database not initialized');
  await db.table('files').delete(id);
}

// Migration: update existing files with meta fields
(async function migrateFilesTable() {
  const db = getDB();
  if (!db) return;
  const files = await db.table('files').toArray();
  for (const file of files) {
    if (!file.s3Key) {
      const s3Key = `files/${Date.now()}_${file.name}`;
      await db.table('files').update(file.id, {
        s3Key,
        synced: false,
        syncStatus: 'pending',
        lastSyncAttempt: '',
        createdAt: file.createdAt || new Date().toISOString(),
        updatedAt: file.updatedAt || new Date().toISOString(),
      });
    }
  }
})();

// Enhanced file/image management functions - Single Purpose Functions

// === IMAGE STORAGE FUNCTIONS ===
export async function saveImageToIDB({
  filename,
  data,
}: {
  filename: string;
  data: Uint8Array;
}): Promise<number> {
  const db = getDB();
  if (!db) throw new Error('Database not initialized');
  const now = new Date().toISOString();
  const s3Key = `images/${Date.now()}_${filename}`;
  
  const id = await db.table('images').add({
    filename,
    data,
    synced: false,
    syncStatus: 'pending',
    s3Key,
    lastSyncAttempt: '',
    createdAt: now,
    updatedAt: now,
  } as ImageRecord);
  
  return id as number;
}

export async function updateImageInIDB({
  id,
  filename,
  data,
}: {
  id: number;
  filename: string;
  data: Uint8Array;
}): Promise<void> {
  const db = getDB();
  if (!db) throw new Error('Database not initialized');
  const now = new Date().toISOString();
  
  await db.table('images').update(id, {
    filename,
    data,
    synced: false,
    syncStatus: 'pending',
    lastSyncAttempt: '',
    updatedAt: now,
  });
}

export async function deleteImageFromIDB(id: number): Promise<void> {
  const db = getDB();
  if (!db) throw new Error('Database not initialized');
  await db.table('images').delete(id);
}

// === SYNC TRACKING FUNCTIONS ===
export async function createUploadOperation(fileId: number): Promise<number> {
  const db = getDB();
  if (!db) throw new Error('Database not initialized');
  const now = new Date().toISOString();
  
  const operationId = await db.table('file_operations').add({
    fileId,
    operation: 'upload',
    status: 'pending',
    createdAt: now,
    retryCount: 0,
  } as FileOperation);
  
  return operationId as number;
}

export async function createUpdateOperation(fileId: number): Promise<number> {
  const db = getDB();
  if (!db) throw new Error('Database not initialized');
  const now = new Date().toISOString();
  
  const operationId = await db.table('file_operations').add({
    fileId,
    operation: 'update',
    status: 'pending',
    createdAt: now,
    retryCount: 0,
  } as FileOperation);
  
  return operationId as number;
}

export async function createDeleteOperation(fileId: number, filename: string, s3Key?: string): Promise<number> {
  const db = getDB();
  if (!db) throw new Error('Database not initialized');
  const now = new Date().toISOString();
  
  // Add to deleted_files table
  await db.table('deleted_files').add({
    fileId,
    filename,
    s3Key,
    deletedAt: now,
    synced: false,
    syncStatus: 'pending',
  } as DeletedFileRecord);
  
  // Create delete operation
  const operationId = await db.table('file_operations').add({
    fileId,
    operation: 'delete',
    status: 'pending',
    createdAt: now,
    retryCount: 0,
  } as FileOperation);
  
  return operationId as number;
}

// === SYNC STATUS FUNCTIONS ===
export async function markImageAsSynced(id: number): Promise<void> {
  const db = getDB();
  if (!db) throw new Error('Database not initialized');
  const now = new Date().toISOString();
  await db.table('images').update(id, {
    synced: true,
    syncStatus: 'synced',
    lastSyncAttempt: now,
    updatedAt: now,
  });
}

export async function markImageSyncFailed(id: number): Promise<void> {
  const db = getDB();
  if (!db) throw new Error('Database not initialized');
  const now = new Date().toISOString();
  await db.table('images').update(id, {
    syncStatus: 'failed',
    lastSyncAttempt: now,
    updatedAt: now,
  });
}

export async function markImageAsSyncing(id: number): Promise<void> {
  const db = getDB();
  if (!db) throw new Error('Database not initialized');
  const now = new Date().toISOString();
  await db.table('images').update(id, {
    syncStatus: 'syncing',
    lastSyncAttempt: now,
    updatedAt: now,
  });
}

export async function markOperationAsCompleted(operationId: number): Promise<void> {
  const db = getDB();
  if (!db) throw new Error('Database not initialized');
  await db.table('file_operations').update(operationId, {
    status: 'completed',
  });
}

export async function markOperationAsFailed(operationId: number): Promise<void> {
  const db = getDB();
  if (!db) throw new Error('Database not initialized');
  await db.table('file_operations').update(operationId, {
    status: 'failed',
  });
}

export async function markOperationAsProcessing(operationId: number): Promise<void> {
  const db = getDB();
  if (!db) throw new Error('Database not initialized');
  await db.table('file_operations').update(operationId, {
    status: 'processing',
  });
}

export async function markDeletionAsSynced(id: number): Promise<void> {
  const db = getDB();
  if (!db) throw new Error('Database not initialized');
  await db.table('deleted_files').update(id, {
    synced: true,
    syncStatus: 'synced',
  });
}

export async function incrementRetryCount(operationId: number): Promise<void> {
  const db = getDB();
  if (!db) throw new Error('Database not initialized');
  const operation = await db.table('file_operations').get(operationId) as FileOperation;
  if (operation) {
    await db.table('file_operations').update(operationId, {
      retryCount: operation.retryCount + 1,
    });
  }
}

// === QUERY FUNCTIONS ===
export async function getUnsyncedImages(): Promise<ImageRecord[]> {
  const db = getDB();
  if (!db) return [];
  return db.table('images')
    .filter(img => img.syncStatus === 'pending' || img.syncStatus === 'failed')
    .toArray() as Promise<ImageRecord[]>;
}

export async function getPendingOperations(): Promise<FileOperation[]> {
  const db = getDB();
  if (!db) return [];
  return db.table('file_operations')
    .filter(op => op.status === 'pending' || op.status === 'processing')
    .toArray() as Promise<FileOperation[]>;
}

export async function getUnsyncedDeletions(): Promise<DeletedFileRecord[]> {
  const db = getDB();
  if (!db) return [];
  return db.table('deleted_files')
    .filter(record => record.syncStatus === 'pending' || record.syncStatus === 'failed')
    .toArray() as Promise<DeletedFileRecord[]>;
}

export async function getImageById(id: number): Promise<ImageRecord | null> {
  const db = getDB();
  if (!db) return null;
  try {
    return await db.table('images').get(id) as ImageRecord;
  } catch {
    return null;
  }
}

export async function getFailedOperations(): Promise<FileOperation[]> {
  const db = getDB();
  if (!db) return [];
  return db.table('file_operations')
    .filter(op => op.status === 'failed' && op.retryCount < 3)
    .toArray() as Promise<FileOperation[]>;
}

// Enhanced types for file/image tracking
export interface ImageRecord {
  id?: number;
  filename: string;
  data: Uint8Array;
  synced: boolean;
  syncStatus: 'pending' | 'syncing' | 'synced' | 'failed';
  s3Key?: string;
  lastSyncAttempt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeletedFileRecord {
  id?: number;
  fileId: number;
  filename: string;
  s3Key?: string;
  deletedAt: string;
  synced: boolean;
  syncStatus: 'pending' | 'syncing' | 'synced' | 'failed';
}

export interface FileOperation {
  id?: number;
  fileId: number;
  operation: 'upload' | 'update' | 'delete';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  retryCount: number;
}

// Settings operations for key-value settings
export const settingsOperations = {
  async get(key: string): Promise<unknown> {
    const db = getDB();
    if (!db) return undefined;
    const record = await db.table('settings').get(key);
    return record ? record.value : undefined;
  },
  async set(key: string, value: unknown): Promise<void> {
    const db = getDB();
    if (!db) return;
    await db.table('settings').put({ key, value });
  },
  async getAll() {
    const db = getDB();
    if (!db) return {};
    const all = await db.table('settings').toArray();
    return Object.fromEntries(all.map(({ key, value }) => [key, value]));
  },
};
