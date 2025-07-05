# Offrows - Offline-first Project Tracker

A modern, offline-first project tracking application built with Next.js, TypeScript, and IndexedDB for local data storage.

## Features

- **Offline-first**: Works completely offline with IndexedDB storage
- **Modern UI**: Clean, responsive interface with dark/light theme support
- **Flexible Data Grid**: Excel-like spreadsheet interface with multiple data types
- **File Management**: Upload and manage images and files
- **Search & Filter**: Real-time search across text fields
- **Export/Import**: CSV and JSON data export/import capabilities
- **PWA Ready**: Progressive Web App with offline capabilities

## Project Structure

The codebase follows modern React/Next.js best practices with a well-organized component structure:

```
src/
├── app/                    # Next.js app directory
│   ├── contexts/          # React contexts
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main page
├── components/            # All React components
│   ├── ui/               # Reusable UI components
│   │   ├── button.tsx
│   │   ├── image.tsx
│   │   ├── ThemeToggle.tsx
│   │   └── OfflineIndicator.tsx
│   ├── layout/           # Layout components
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── Toolbar.tsx
│   ├── data-grid/        # Data grid components
│   │   ├── DataGrid.tsx
│   │   └── celleditors/  # Cell editor components
│   │       ├── TextCellEditor.tsx
│   │       ├── NumberCellEditor.tsx
│   │       ├── DateCellEditor.tsx
│   │       ├── BooleanCellEditor.tsx
│   │       ├── DropdownCellEditor.tsx
│   │       ├── FileCellEditor.tsx
│   │       ├── FilesCellEditor.tsx
│   │       ├── ImageCellEditor.tsx
│   │       └── ImagesCellEditor.tsx
│   ├── modals/           # Modal components
│   │   ├── AddColumnModal.tsx
│   │   └── DeleteColumnModal.tsx
│   ├── ClientApp.tsx     # Main app component
│   ├── ErrorBoundary.tsx # Error boundary
│   └── index.ts          # Component exports
└── lib/                  # Utility libraries
    ├── database.ts       # IndexedDB operations
    ├── schemas.ts        # Zod schemas
    ├── store.ts          # Zustand store
    └── utils.ts          # Utility functions
```

## Key Improvements

### 1. Component Organization
- **Unified Structure**: All components are now in a single `src/components/` directory
- **Logical Grouping**: Components are organized by purpose (ui, layout, data-grid, modals)
- **Clean Imports**: Centralized exports via `src/components/index.ts`

### 2. Cell Selection Fix
- **Improved UX**: Cells now show plain text when not editing, input fields only when editing
- **Better Focus Management**: Clicking a cell highlights the entire cell, not just the input
- **Keyboard Navigation**: Escape key to cancel editing, Enter to save
- **Click Outside**: Clicking outside a cell stops editing

### 3. Modern Best Practices
- **TypeScript**: Full type safety throughout the application
- **Component Composition**: Reusable, composable components
- **Performance**: Optimized rendering with proper dependency arrays
- **Accessibility**: ARIA labels and keyboard navigation support

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run the development server**:
   ```bash
   npm run dev
   ```

3. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## Development

### Component Development
- All components are in `src/components/`
- Use the index file for clean imports: `import { ComponentName } from '@/components'`
- Follow the established patterns for new components

### Data Grid Customization
- Cell editors are in `src/components/data-grid/celleditors/`
- Each editor supports both display and edit modes
- Add new field types by creating new cell editors

### Styling
- Uses Tailwind CSS for styling
- Theme support via CSS custom properties
- Responsive design with mobile-first approach

## Data Types Supported

- **Text**: Simple text input
- **Number**: Numeric values with validation
- **Date**: Date picker with formatting
- **Boolean**: Checkbox/toggle
- **Dropdown**: Select from predefined options
- **Image**: Single image upload with preview
- **Images**: Multiple image uploads
- **File**: Single file upload
- **Files**: Multiple file uploads

## Browser Support

- Modern browsers with IndexedDB support
- Progressive Web App capabilities
- Offline functionality
- Mobile responsive design

## License

This project is licensed under the MIT License.