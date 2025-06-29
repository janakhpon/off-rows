import Dexie from 'dexie';
import { 
  Table, 
  TableRow, 
  ViewSettings,
  TableSchema as TableSchemaType,
  TableRowSchema as TableRowSchemaType,
  ViewSettingsSchema as ViewSettingsSchemaType
} from './schemas';

// Create database instance
const db = new Dexie('OffrowsDatabase');

// Define database schema
db.version(4).stores({
  tables: '++id, name, description, colWidths, rowHeights',
  rows: '++id, tableId, data, order',
  views: '++id, tableId, name, isDefault',
  files: '++id, name, type',
});

// Initialize with sample data if database is empty
export async function initializeDatabase() {
  const tableCount = await db.table('tables').count();
  
  if (tableCount === 0) {
    const sampleTables: Omit<Table, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        name: 'Project Tracker',
        description: 'Track project tasks and progress',
        fields: [
          { id: 'taskName', name: 'Task Name', type: 'text', required: true },
          { id: 'status', name: 'Status', type: 'dropdown', options: ['In Progress', 'Completed', 'Pending', 'Blocked'], required: true },
          { id: 'dueDate', name: 'Due Date', type: 'date' },
          { id: 'priority', name: 'Priority', type: 'dropdown', options: ['High', 'Medium', 'Low'], required: true },
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
          { id: 'role', name: 'Role', type: 'dropdown', options: ['Admin', 'User', 'Guest'], required: true },
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
          { id: 'category', name: 'Category', type: 'dropdown', options: ['Electronics', 'Clothing', 'Books', 'Other'], required: true },
          { id: 'quantity', name: 'Quantity', type: 'number', defaultValue: 0 },
          { id: 'price', name: 'Price', type: 'number', defaultValue: 0 },
          { id: 'inStock', name: 'In Stock', type: 'boolean', defaultValue: true },
          { id: 'lastUpdated', name: 'Last Updated', type: 'date' },
          { id: 'image', name: 'Product Image', type: 'image' },
        ],
      },
    ];

    const createdTables = await db.table('tables').bulkAdd(sampleTables);
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

    await db.table('rows').bulkAdd(sampleRows);

    // Create default views for each table
    const defaultViews: Omit<ViewSettings, 'id' | 'createdAt' | 'updatedAt'>[] = (tableIds as number[]).map((tableId: number) => ({
      tableId,
      name: 'Default View',
      hiddenFields: [],
      filters: [],
      sorts: [],
      rowHeight: 'default',
      colorRules: [],
      isDefault: true,
    }));

    await db.table('views').bulkAdd(defaultViews);
  }
}

// Table operations
export const tableOperations = {
  async getAll(): Promise<Table[]> {
    const tables = await db.table('tables').toArray() as Table[];
    return tables.map(table => ({
      ...table,
      createdAt: new Date(table.createdAt),
      updatedAt: new Date(table.updatedAt),
    }));
  },

  async getById(id: number): Promise<Table | undefined> {
    const table = await db.table('tables').get(id) as Table | undefined;
    if (table) {
      return {
        ...table,
        createdAt: new Date(table.createdAt),
        updatedAt: new Date(table.updatedAt),
      };
    }
    return undefined;
  },

  async add(table: Omit<Table, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
    // Validate with Zod
    const validatedTable = TableSchemaType.parse({
      ...table,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const tableId = await db.table('tables').add(validatedTable) as number;

    // Create default view for new table
    await db.table('views').add({
      tableId,
      name: 'Default View',
      hiddenFields: [],
      filters: [],
      sorts: [],
      rowHeight: 'default',
      colorRules: [],
      isDefault: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return tableId;
  },

  async update(id: number, updates: Partial<Omit<Table, 'id' | 'createdAt'>>): Promise<void> {
    await db.table('tables').update(id, {
      ...updates,
      updatedAt: new Date(),
    });
  },

  async delete(id: number): Promise<void> {
    await db.table('tables').delete(id);
    await db.table('rows').where('tableId').equals(id).delete();
    await db.table('views').where('tableId').equals(id).delete();
  },

  async updateColWidths(tableId: number, colWidths: Record<string, number>) {
    await db.table('tables').update(tableId, { colWidths, updatedAt: new Date() });
  },

  async updateRowHeights(tableId: number, rowHeights: Record<string, number>) {
    await db.table('tables').update(tableId, { rowHeights, updatedAt: new Date() });
  },
};

// Row operations
export const rowOperations = {
  async getByTableId(tableId: number): Promise<TableRow[]> {
    const rows = await db.table('rows').where('tableId').equals(tableId).toArray() as TableRow[];
    // Always sort by 'order' (fallback to id)
    return rows.sort((a, b) => (a.order ?? a.id ?? 0) - (b.order ?? b.id ?? 0));
  },

  async getById(id: number): Promise<TableRow | undefined> {
    const row = await db.table('rows').get(id) as TableRow | undefined;
    if (row) {
      return {
        ...row,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      };
    }
    return undefined;
  },

  async add(row: Omit<TableRow, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
    // Find max order for this table
    const maxOrder = await db.table('rows').where('tableId').equals(row.tableId).toArray().then(rs => rs.reduce((max, r) => Math.max(max, r.order ?? 0), 0));
    const validatedRow = TableRowSchemaType.parse({
      ...row,
      order: maxOrder + 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return await db.table('rows').add(validatedRow) as number;
  },

  async update(id: number, updates: Partial<Omit<TableRow, 'id' | 'createdAt'>>): Promise<void> {
    await db.table('rows').update(id, {
      ...updates,
      updatedAt: new Date(),
    });
  },

  async delete(id: number): Promise<void> {
    await db.table('rows').delete(id);
  },

  async bulkUpdate(rows: TableRow[]): Promise<void> {
    await db.table('rows').bulkPut(rows);
  },
};

// View operations
export const viewOperations = {
  async getByTableId(tableId: number): Promise<ViewSettings[]> {
    const views = await db.table('views').where('tableId').equals(tableId).toArray() as ViewSettings[];
    return views.map(view => ({
      ...view,
      createdAt: new Date(view.createdAt),
      updatedAt: new Date(view.updatedAt),
    }));
  },

  async getDefaultView(tableId: number): Promise<ViewSettings | undefined> {
    const view = await db.table('views').where('tableId').equals(tableId).filter(view => view.isDefault === true).first() as ViewSettings | undefined;
    if (view) {
      return {
        ...view,
        createdAt: new Date(view.createdAt),
        updatedAt: new Date(view.updatedAt),
      };
    }
    return undefined;
  },

  async getById(id: number): Promise<ViewSettings | undefined> {
    const view = await db.table('views').get(id) as ViewSettings | undefined;
    if (view) {
      return {
        ...view,
        createdAt: new Date(view.createdAt),
        updatedAt: new Date(view.updatedAt),
      };
    }
    return undefined;
  },

  async add(view: Omit<ViewSettings, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
    // Validate with Zod
    const validatedView = ViewSettingsSchemaType.parse({
      ...view,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return await db.table('views').add(validatedView) as number;
  },

  async update(id: number, updates: Partial<Omit<ViewSettings, 'id' | 'createdAt'>>): Promise<void> {
    await db.table('views').update(id, {
      ...updates,
      updatedAt: new Date(),
    });
  },

  async delete(id: number): Promise<void> {
    await db.table('views').delete(id);
  },
};

// File operations for offline blob storage
export const fileOperations = {
  async addFile(file: File): Promise<number> {
    const id = await db.table('files').add({
      name: file.name,
      type: file.type,
      blob: file,
    });
    return id as number;
  },
  async getFileById(id: number): Promise<{ name: string; type: string; blob: Blob } | undefined> {
    const file = await db.table('files').get(id);
    if (!file) return undefined;
    return { name: file.name, type: file.type, blob: file.blob };
  },
  async deleteFile(id: number): Promise<void> {
    await db.table('files').delete(id);
  },
}; 