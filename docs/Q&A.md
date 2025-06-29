# OffRows Codebase Documentation

## 1. Types Used in the Current Codebase

### 1.1 Zod Schema Types
**Why**: We use Zod for runtime type validation and TypeScript type inference, ensuring data integrity across the application.

**How**: 
```typescript
// Schema definition with Zod
export const FieldTypeSchema = z.enum(['text', 'number', 'boolean', 'date', 'dropdown', 'image', 'file']);
export const FileValueSchema = z.object({
  name: z.string(),
  type: z.string(),
  fileId: z.number(),
});

// Type inference from schema
export type Field = z.infer<typeof FieldSchema>;
export type TableRow = z.infer<typeof TableRowSchema>;
```

**Issues Solved**:
- Runtime type safety for database operations
- Automatic TypeScript type generation
- Validation of user input and data persistence

### 1.2 Union Types
**Why**: Handle multiple possible value types for table cell data.

**How**:
```typescript
// Union type for cell values
type CellValue = string | number | boolean | FileValueWithId | null;

// Union type for field types
type FieldType = 'text' | 'number' | 'boolean' | 'date' | 'dropdown' | 'image' | 'file';
```

**Issues Solved**:
- Type-safe handling of different data types in cells
- Prevents invalid data assignments

### 1.3 Generic Types
**Why**: Create reusable, type-safe components and functions.

**How**:
```typescript
// Generic record type for dynamic data
Record<string, string | number | boolean | FileValueWithId | null>

// Generic state management
useState<Record<string, number>>({})
```

**Issues Solved**:
- Flexible data structures that maintain type safety
- Reusable components with different data types

### 1.4 Type Assertions
**Why**: Safely convert between compatible types when we know the structure.

**How**:
```typescript
// Safe type assertion for file objects
if (value && typeof value === 'object' && !Array.isArray(value) && 'fileId' in value) {
  return value as FileValueWithId;
}
```

**Issues Solved**:
- Safe conversion between related types
- Runtime type checking before assertion

### 1.5 Fallback Types
**Why**: Provide default values and handle undefined/null cases gracefully.

**How**:
```typescript
// Fallback for missing values
const value = row.data[field.id] || null;
const width = colWidths[fieldId] || defaultColWidth;
```

**Issues Solved**:
- Graceful handling of missing data
- Consistent default behavior

## 2. Error Handling Methods

### 2.1 Try-Catch Blocks
**Why**: Handle asynchronous operations and potential failures gracefully.

**How**:
```typescript
const handleCellValueChange = async (rowIdx: number, colKey: string, value: CellValue) => {
  try {
    const row = rows[rowIdx];
    if (!row) return; // Early return for invalid data
    
    const field = activeTable?.fields.find(f => f.id === colKey);
    if (!field) return;
    
    // Process and save data
    await updateRow(row.id!, { data: updatedRow.data });
  } catch (error) {
    console.error('Failed to update cell value:', error);
    // Could add user notification here
  }
};
```

**Issues Solved**:
- Prevents app crashes from database errors
- Graceful degradation when operations fail

### 2.2 Early Returns
**Why**: Fail fast and avoid unnecessary processing.

**How**:
```typescript
const handleAddRow = async () => {
  if (!activeTable) return; // Early return if no active table
  
  // Continue with row creation...
};
```

**Issues Solved**:
- Prevents invalid operations
- Improves performance by avoiding unnecessary work

### 2.3 Null Checks
**Why**: Prevent runtime errors from accessing undefined properties.

**How**:
```typescript
// Safe property access
const imgUrl = getFileUrl(v.fileId);
if (imgUrl) {
  // Use the URL safely
}

// Optional chaining
const field = activeTable?.fields.find(f => f.id === colKey);
```

**Issues Solved**:
- Prevents "Cannot read property of undefined" errors
- Safe navigation through object properties

### 2.4 Type Guards
**Why**: Ensure type safety at runtime before performing operations.

**How**:
```typescript
// Type guard for file objects
if (typeof value === 'object' && !Array.isArray(value) && 'fileId' in value) {
  // Safe to use as FileValueWithId
}
```

**Issues Solved**:
- Runtime type safety
- Prevents type-related runtime errors

## 3. Design Patterns

### 3.1 Context Pattern (React Context)
**Why**: Share state across components without prop drilling.

**How**:
```typescript
// Context provider
export const TableProvider = ({ children }: { children: React.ReactNode }) => {
  const [tables, setTables] = useState<Table[]>([]);
  const [activeTable, setActiveTable] = useState<Table | null>(null);
  
  return (
    <TableContext.Provider value={{ tables, activeTable, setActiveTable, refreshTables }}>
      {children}
    </TableContext.Provider>
  );
};

// Context consumer
const { activeTable, refreshTables } = useTables();
```

**Issues Solved**:
- Eliminates prop drilling
- Centralized state management
- Easy access to shared data

### 3.2 Observer Pattern (React Hooks)
**Why**: React to state changes and trigger side effects.

**How**:
```typescript
// Effect hook for side effects
useEffect(() => {
  if (activeTable && activeTable.colWidths) {
    setColWidths(activeTable.colWidths);
  }
}, [activeTable]);

// Effect for data persistence
useEffect(() => {
  if (activeTable) {
    updateColWidths(activeTable.id!, colWidths);
  }
}, [colWidths, activeTable, updateColWidths]);
```

**Issues Solved**:
- Automatic synchronization of state
- Side effect management
- Data persistence

### 3.3 Factory Pattern (Component Creation)
**Why**: Create different types of form inputs based on field type.

**How**:
```typescript
const renderEditableCell = (field: Field, value: CellValue, rowIdx: number, colKey: string) => {
  switch (field.type) {
    case 'boolean':
      return <input type="checkbox" ... />;
    case 'dropdown':
      return <select ... />;
    case 'date':
      return <input type="date" ... />;
    default:
      return <input type="text" ... />;
  }
};
```

**Issues Solved**:
- Dynamic component creation
- Consistent interface for different input types
- Easy extensibility for new field types

### 3.4 State Machine Pattern
**Why**: Manage complex component states (editing, loading, error).

**How**:
```typescript
// State management for editing
const [editingCell, setEditingCell] = useState<{ rowIdx: number; colKey: string } | null>(null);
const [editValue, setEditValue] = useState<CellValue>(null);

// State transitions
const startEditing = () => setEditingCell({ rowIdx, colKey });
const saveEdit = () => { /* save logic */; setEditingCell(null); };
const cancelEdit = () => setEditingCell(null);
```

**Issues Solved**:
- Predictable state transitions
- Clear component behavior
- Easy debugging

## 4. Data Structures

### 4.1 Hash Maps (Objects)
**Why**: Fast lookups and key-value storage for dynamic data.

**How**:
```typescript
// Column widths storage
const [colWidths, setColWidths] = useState<Record<string, number>>({});

// Row heights storage
const [rowHeights, setRowHeights] = useState<Record<string, number>>({});

// File URL cache
const [fileUrls, setFileUrls] = useState<Record<number, string>>({});
```

**Issues Solved**:
- O(1) lookup time for column/row properties
- Efficient caching of file URLs
- Dynamic property access

### 4.2 Arrays with Order Preservation
**Why**: Maintain row order and enable efficient rendering.

**How**:
```typescript
// Row order state
const [rowOrder, setRowOrder] = useState<number[]>([]);

// Ordered rows computation
const orderedRows = useMemo(() => {
  if (!rowOrder.length) return rows;
  const rowMap = Object.fromEntries(rows.map(r => [r.id!, r]));
  return rowOrder.map(id => rowMap[id]).filter(Boolean);
}, [rows, rowOrder]);
```

**Issues Solved**:
- Stable row ordering
- Efficient re-rendering
- Drag-and-drop ready structure

### 4.3 Nested Objects (Tree Structure)
**Why**: Represent hierarchical data (tables → fields → data).

**How**:
```typescript
// Table structure
interface Table {
  id: number;
  name: string;
  fields: Field[]; // Array of field definitions
  // ...
}

// Row data structure
interface TableRow {
  id: number;
  tableId: number;
  data: Record<string, CellValue>; // Field ID → Value mapping
  // ...
}
```

**Issues Solved**:
- Natural representation of table structure
- Easy navigation and manipulation
- Scalable data model

### 4.4 Linked References (Foreign Keys)
**Why**: Maintain relationships between entities.

**How**:
```typescript
// Foreign key relationships
interface TableRow {
  tableId: number; // References Table.id
  // ...
}

interface FileValueWithId {
  fileId: number; // References File.id in database
  // ...
}
```

**Issues Solved**:
- Data integrity
- Efficient queries
- Normalized data structure

## 5. Algorithms

### 5.1 Memoization (useMemo)
**Why**: Avoid expensive recalculations on every render.

**How**:
```typescript
// Memoized ordered rows
const orderedRows = useMemo(() => {
  if (!rowOrder.length) return rows;
  const rowMap = Object.fromEntries(rows.map(r => [r.id!, r]));
  return rowOrder.map(id => rowMap[id]).filter(Boolean);
}, [rows, rowOrder]);

// Memoized column width calculation
const getColWidth = (fieldId: string, fieldType?: string) =>
  colWidths[fieldId] || (fieldType ? getColumnWidth(fieldType) : defaultColWidth);
```

**Issues Solved**:
- Performance optimization
- Prevents unnecessary re-renders
- Efficient data processing

### 5.2 Binary Search (Array.find)
**Why**: Efficient lookup in sorted arrays.

**How**:
```typescript
// Find field by ID
const field = activeTable?.fields.find(f => f.id === colKey);

// Find table by ID
const table = tables.find(t => t.id === tableId);
```

**Issues Solved**:
- Fast field/table lookups
- Efficient data retrieval

### 5.3 Reduce Algorithm
**Why**: Transform data structures efficiently.

**How**:
```typescript
// Create new row data
const newRowData = activeTable.fields.reduce((acc, field) => {
  acc[field.id] = field.defaultValue || null;
  return acc;
}, {} as Record<string, CellValue>);

// Collect file IDs
const fileIds = orderedRows.reduce((ids: number[], row) => {
  activeTable.fields.forEach(field => {
    const val = row.data[field.id];
    if (val && typeof val === 'object' && 'fileId' in val) {
      ids.push(val.fileId);
    }
  });
  return ids;
}, []);
```

**Issues Solved**:
- Efficient data transformation
- Functional programming approach
- Clean, readable code

### 5.4 Event Delegation
**Why**: Handle multiple similar events efficiently.

**How**:
```typescript
// Column resize event delegation
const handleResizeStart = (e: React.MouseEvent, fieldId: string) => {
  document.addEventListener('mousemove', handleResizeMove);
  document.addEventListener('mouseup', handleResizeEnd);
};

const handleResizeMove = (e: MouseEvent) => {
  if (!resizingCol.current) return;
  setResizeLine(e.clientX);
};
```

**Issues Solved**:
- Efficient event handling
- Smooth user interactions
- Memory management

## 6. Best Practices and Conventions

### 6.1 Component Composition
**Why**: Create reusable, maintainable components.

**How**:
```typescript
// Modular component structure
<DataGridComponent>
  <Header />
  <Grid>
    <ColumnHeaders />
    <DataRows />
    <AddRowButton />
  </Grid>
  <Modals />
</DataGridComponent>
```

**Issues Solved**:
- Code reusability
- Easy testing
- Clear separation of concerns

### 6.2 Custom Hooks
**Why**: Encapsulate complex logic and state management.

**How**:
```typescript
// Custom hook for table management
const useTables = () => {
  const [tables, setTables] = useState<Table[]>([]);
  const [activeTable, setActiveTable] = useState<Table | null>(null);
  
  const refreshTables = useCallback(async () => {
    // Implementation
  }, []);
  
  return { tables, activeTable, setActiveTable, refreshTables };
};
```

**Issues Solved**:
- Logic reusability
- Clean component code
- Easy testing

### 6.3 Type Safety
**Why**: Prevent runtime errors and improve developer experience.

**How**:
```typescript
// Strict typing throughout
interface EditorProps {
  row: Record<string, unknown>;
  column: { key: string };
  onRowChange: (row: Record<string, unknown>) => void;
  onClose: () => void;
}

// Type-safe function signatures
const handleCellValueChange = async (
  rowIdx: number, 
  colKey: string, 
  value: string | number | boolean | FileValueWithId | null
) => {
  // Implementation
};
```

**Issues Solved**:
- Catch errors at compile time
- Better IDE support
- Self-documenting code

### 6.4 Performance Optimization
**Why**: Ensure smooth user experience with large datasets.

**How**:
```typescript
// Memoization for expensive calculations
const orderedRows = useMemo(() => {
  // Expensive computation
}, [dependencies]);

// Callback memoization
const handleResizeStart = useCallback((e: React.MouseEvent, fieldId: string) => {
  // Implementation
}, []);
```

**Issues Solved**:
- Smooth scrolling and interactions
- Efficient re-rendering
- Better user experience

### 6.5 Accessibility
**Why**: Make the application usable for all users.

**How**:
```typescript
// Keyboard navigation
onKeyDown={e => {
  if (e.key === 'Enter') {
    setEditingCell({ rowIdx, colKey });
  }
}}

// ARIA labels and roles
<button
  aria-label="Add column"
  title="Add Column"
  type="button"
>
  <Plus className="h-4 w-4" />
</button>
```

**Issues Solved**:
- Screen reader compatibility
- Keyboard navigation
- Inclusive design

## 7. Dynamic Table Creation and Management

### 7.1 Dynamic Table Creation
**Why**: Allow users to create custom tables with different structures.

**How**:
```typescript
// Table creation with dynamic fields
const handleCreateTable = async () => {
  const newTable: Omit<Table, 'id' | 'createdAt' | 'updatedAt'> = {
    name: newTableName.trim(),
    description: '',
    fields: [
      { id: 'name', name: 'Name', type: 'text', required: true },
      { id: 'status', name: 'Status', type: 'dropdown', options: ['Active', 'Inactive'] },
      { id: 'priority', name: 'Priority', type: 'number' },
      { id: 'due_date', name: 'Due Date', type: 'date' },
      { id: 'completed', name: 'Completed', type: 'boolean' },
    ],
    colWidths: {},
    rowHeights: {},
  };
  
  await addTable(newTable);
};
```

**Issues Solved**:
- Flexible table structures
- User-defined schemas
- Extensible field types

### 7.2 Dynamic Column Management
**Why**: Allow users to add, remove, and modify columns at runtime.

**How**:
```typescript
// Add column modal
<AddColumnModal 
  open={showAddColumn} 
  onClose={() => setShowAddColumn(false)}
  onAddColumn={async (field) => {
    await addColumn(field);
    await refreshTables();
    setShowAddColumn(false);
  }}
/>

// Column rendering based on active table
{activeTable.fields.map((field) => (
  <div key={field.id} style={{ width: getColWidth(field.id, field.type) }}>
    {/* Column content */}
  </div>
))}
```

**Issues Solved**:
- Runtime column addition
- Dynamic column sizing
- Flexible table layouts

### 7.3 Dynamic Row Management
**Why**: Allow users to add and remove rows dynamically.

**How**:
```typescript
// Add row functionality
const handleAddRow = async () => {
  const newRow: Omit<TableRow, 'id' | 'createdAt' | 'updatedAt'> = {
    tableId: activeTable.id!,
    data: activeTable.fields.reduce((acc, field) => {
      acc[field.id] = field.defaultValue || null;
      return acc;
    }, {} as Record<string, CellValue>),
  };
  
  await addRow(newRow);
};

// Row rendering with dynamic data
{orderedRows.map((row, rowIndex) => (
  <div key={row.id || rowIndex}>
    {activeTable.fields.map((field) => (
      <div key={field.id}>
        {renderEditableCell(field, row.data[field.id], rowIndex, field.id)}
      </div>
    ))}
  </div>
))}
```

**Issues Solved**:
- Runtime row addition
- Dynamic data binding
- Flexible data entry

### 7.4 Schema Evolution
**Why**: Handle changes to table structure over time.

**How**:
```typescript
// Field type validation
const renderEditableCell = (field: Field, value: CellValue, rowIdx: number, colKey: string) => {
  switch (field.type) {
    case 'boolean':
      return <input type="checkbox" ... />;
    case 'dropdown':
      return <select ... />;
    case 'date':
      return <input type="date" ... />;
    case 'image':
    case 'file':
      return <input type="file" ... />;
    default:
      return <input type="text" ... />;
  }
};
```

**Issues Solved**:
- Backward compatibility
- Schema migration support
- Extensible field types

### 7.5 Data Persistence
**Why**: Ensure data survives page reloads and app restarts.

**How**:
```typescript
// IndexedDB storage with Dexie
export class OffRowsDatabase extends Dexie {
  tables!: Table<Table>;
  rows!: Table<TableRow>;
  files!: Table<FileRecord>;
  
  constructor() {
    super('OffRowsDatabase');
    this.version(1).stores({
      tables: '++id, name',
      rows: '++id, tableId',
      files: '++id, name, type'
    });
  }
}
```

**Issues Solved**:
- Offline data persistence
- Large file storage
- Reliable data recovery

This implementation provides a robust, scalable foundation for dynamic spreadsheet-like functionality with full offline support and type safety. 