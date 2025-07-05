# Offrows - Modern Offline-First Spreadsheet & Database App

A powerful, offline-first alternative to Airtable and Google Sheets built with Next.js 15, TypeScript, and IndexedDB. Designed for users in regions with limited internet connectivity, Offrows provides a complete data management solution that works seamlessly offline.

![Offrows Preview](public/preview.png)

## ✨ Features

### 🚀 Core Functionality
- **Offline-First Architecture**: Works completely offline with local IndexedDB storage
- **Modern Data Grid**: Excel-like spreadsheet interface with real-time editing
- **Multiple Data Types**: Text, Number, Date, Boolean, Dropdown, Images, Files
- **File Management**: Upload and manage images and files directly in your data
- **Search & Filter**: Real-time search and filtering across all data
- **Export/Import**: CSV and JSON data export/import capabilities

### 🎨 User Experience
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Dark/Light Themes**: Automatic theme switching with manual override
- **Modern UI**: Clean, intuitive interface with smooth animations
- **Keyboard Navigation**: Full keyboard support for power users
- **Real-time Updates**: Instant data synchronization across tabs

### 📱 Progressive Web App (PWA)
- **Offline Access**: All routes precached for instant offline access
- **Installable**: Add to home screen on mobile and desktop
- **Service Worker**: Automatic caching and background updates
- **Push Notifications**: Get notified of app updates
- **App-like Experience**: Native app feel with web technologies

### 🔧 Technical Features
- **TypeScript**: Full type safety and better developer experience
- **Next.js 15**: Latest React framework with App Router
- **Static Generation**: Fast loading with pre-rendered pages
- **Client-Side Hydration**: Smooth interactivity after initial load
- **IndexedDB**: Robust local database for offline storage

## 🏗️ Architecture

### Project Structure
```
off-rows/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── about/             # About page
│   │   ├── offline/           # Offline fallback page
│   │   ├── contexts/          # React contexts (Theme, Table)
│   │   ├── globals.css        # Global styles
│   │   ├── layout.tsx         # Root layout with PWA setup
│   │   └── page.tsx           # Main application page
│   ├── components/            # React components
│   │   ├── ui/               # Reusable UI components
│   │   │   ├── button.tsx
│   │   │   ├── image.tsx
│   │   │   ├── ThemeToggle.tsx
│   │   │   └── OfflineIndicator.tsx
│   │   ├── layout/           # Layout components
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Toolbar.tsx
│   │   ├── data-grid/        # Data grid system
│   │   │   ├── DataGrid.tsx
│   │   │   └── celleditors/  # Cell editor components
│   │   │       ├── TextCellEditor.tsx
│   │   │       ├── NumberCellEditor.tsx
│   │   │       ├── DateCellEditor.tsx
│   │   │       ├── BooleanCellEditor.tsx
│   │   │       ├── DropdownCellEditor.tsx
│   │   │       ├── FileCellEditor.tsx
│   │   │       ├── FilesCellEditor.tsx
│   │   │       ├── ImageCellEditor.tsx
│   │   │       └── ImagesCellEditor.tsx
│   │   ├── modals/           # Modal components
│   │   │   ├── AddColumnModal.tsx
│   │   │   └── DeleteColumnModal.tsx
│   │   ├── ClientApp.tsx     # Main app component
│   │   ├── ClientProviders.tsx # Client-side providers
│   │   ├── ServiceWorkerRegistration.tsx # PWA registration
│   │   ├── ErrorBoundary.tsx # Error boundary
│   │   └── index.ts          # Component exports
│   └── lib/                  # Utility libraries
│       ├── database.ts       # IndexedDB operations
│       ├── offline.ts        # Offline utilities and caching
│       ├── schemas.ts        # Zod schemas for validation
│       ├── store.ts          # Zustand state management
│       ├── fonts.ts          # Font configuration
│       └── utils.ts          # Utility functions
├── public/                   # Static assets
│   ├── manifest.json         # PWA manifest
│   ├── sw.js                 # Service worker (auto-generated)
│   └── icons/               # App icons
├── next.config.ts           # Next.js configuration with PWA
├── tailwind.config.js       # Tailwind CSS configuration
└── package.json             # Dependencies and scripts
```

### Key Technologies
- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS, CSS Custom Properties
- **State Management**: Zustand, React Context
- **Database**: IndexedDB (local), Dexie.js
- **PWA**: next-pwa, Service Workers
- **Validation**: Zod schemas
- **Icons**: Lucide React

## 🚀 Getting Started

### Prerequisites
- Node.js 22+ 
- npm

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/janakhpon/off-rows.git
   cd off-rows
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Development mode**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

4. **Production build**:
   ```bash
   npm run build
   npm start
   ```

### Development Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks
```

## 📊 Data Types

Offrows supports a comprehensive set of data types:

| Type | Description | Features |
|------|-------------|----------|
| **Text** | Simple text input | Searchable, filterable |
| **Number** | Numeric values | Validation, formatting |
| **Date** | Date picker | Calendar interface, formatting |
| **Boolean** | True/False values | Checkbox interface |
| **Dropdown** | Select from options | Predefined choices |
| **Image** | Single image upload | Preview, compression |
| **Images** | Multiple image uploads | Gallery view, bulk operations |
| **File** | Single file upload | File type validation |
| **Files** | Multiple file uploads | File management |

## 🔄 Offline Functionality

### How It Works
1. **Route Precaching**: All pages are automatically cached for offline access
2. **Service Worker**: Handles caching strategies and offline fallbacks
3. **IndexedDB**: Stores all data locally with automatic sync
4. **Progressive Enhancement**: Works online, enhanced offline

### Offline Features
- ✅ **Instant Offline Access**: All routes available offline
- ✅ **Data Persistence**: All changes saved locally
- ✅ **File Management**: Upload and manage files offline
- ✅ **Search & Filter**: Full functionality without internet
- ✅ **Export/Import**: Works completely offline

### Testing Offline Mode
1. Load the app online to cache resources
2. Go offline (disconnect internet or use DevTools)
3. Navigate between pages - everything should work
4. Make changes - they're saved locally
5. Go back online - data syncs automatically

## 📱 Progressive Web App

### PWA Features
- **Installable**: Add to home screen on any device
- **Offline Support**: Works without internet connection
- **Push Notifications**: Get notified of updates
- **App-like Experience**: Native app feel
- **Background Sync**: Automatic data synchronization

### Installation
- **Mobile**: Use "Add to Home Screen" from browser menu
- **Desktop**: Click the install button in the address bar
- **Automatic**: PWA will prompt for installation

## 🔧 Configuration

### Environment Variables
Create a `.env.local` file for local development:
```env
# Optional: Analytics
NEXT_PUBLIC_ANALYTICS_ID=your-analytics-id

# Optional: Custom domain
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

### PWA Configuration
The PWA is configured in `next.config.ts`:
```typescript
const pwaConfig = withPWA({
  dest: "public",
  register: true,
  disable: process.env.NODE_ENV === "development",
});
```

## 🧪 Testing

### Manual Testing
1. **Online Mode**: Test all features with internet
2. **Offline Mode**: Disconnect and test functionality
3. **PWA Installation**: Test app installation
4. **Data Persistence**: Verify data survives page reloads
5. **File Uploads**: Test with various file types

### Browser Support
- ✅ Chrome/Chromium (recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Edge

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Code Style
- Use TypeScript for all new code
- Follow existing component patterns
- Use Tailwind CSS for styling
- Write meaningful commit messages

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Icons from [Lucide](https://lucide.dev/)
- Styling with [Tailwind CSS](https://tailwindcss.com/)
- PWA support with [next-pwa](https://github.com/DuCanhGH/next-pwa)

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/janakhpon/off-rows/issues)
- **Discussions**: [GitHub Discussions](https://github.com/janakhpon/off-rows/discussions)

---

**Offrows** - Modern offline-first data management for everyone. 🌐📊
