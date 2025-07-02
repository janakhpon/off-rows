# Offrows

A modern, offline-first project tracking application built with Next.js 15, TypeScript, and modern web technologies. Offrows provides a spreadsheet-like interface similar to Airtable and Baserow, with full offline functionality.

## ✨ Features

- **🔄 Offline-First**: Works perfectly without internet connection using IndexedDB
- **📊 Grid Interface**: Modern spreadsheet-like UI with sorting, filtering, and resizable columns
- **📱 PWA Support**: Install as a native app on mobile and desktop
- **🎨 Modern UI**: Clean, responsive design with Tailwind CSS
- **⚡ Fast Performance**: Built with Next.js 15 and optimized for speed
- **🔒 Data Privacy**: All data stored locally in your browser
- **📈 Real-time Updates**: Instant data synchronization when online
- **🎯 Task Management**: Track tasks, status, priorities, and progress

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/off-rows.git
cd off-rows
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
npm start
```

## 🏗️ Architecture

### Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: Dexie.js (IndexedDB wrapper)
- **Data Grid**: react-data-grid
- **Icons**: Lucide React
- **PWA**: @ducanh2912/next-pwa

### Project Structure

```
src/
├── app/
│   ├── components/          # React components
│   │   ├── DataGrid.tsx     # Main data grid component
│   │   ├── Header.tsx       # Application header
│   │   ├── Sidebar.tsx      # Navigation sidebar
│   │   ├── Toolbar.tsx      # Grid toolbar
│   │   └── OfflineIndicator.tsx # Offline status indicator
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout with SEO
│   └── page.tsx             # Main page component
├── lib/
│   └── database.ts          # Dexie database configuration
public/
├── manifest.json            # PWA manifest
├── sw.js                    # Service worker
├── robots.txt               # SEO robots file
├── sitemap.xml              # SEO sitemap
└── icons/                   # PWA icons
```

## 🔧 Configuration

### PWA Configuration

The app is configured as a Progressive Web App with:

- **Manifest**: `public/manifest.json`
- **Service Worker**: `public/sw.js`
- **Icons**: Multiple sizes for different platforms
- **Offline Support**: Caching and background sync

### SEO Configuration

- **Meta Tags**: Comprehensive Open Graph and Twitter Card support
- **Sitemap**: Auto-generated sitemap.xml
- **Robots**: Proper robots.txt configuration
- **Social Preview**: Uses preview.png for social media

### Database Schema

```typescript
interface Task {
  id?: number;
  taskName: string;
  status: string;
  dueDate: string;
  priority: string;
  assignee: string;
  progress: number;
  createdAt: Date;
  updatedAt: Date;
}

interface Project {
  id?: number;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## 📱 PWA Features

- **Installable**: Add to home screen on mobile and desktop
- **Offline**: Full functionality without internet
- **Background Sync**: Data sync when connection is restored
- **Push Notifications**: Ready for future implementation
- **App-like Experience**: Native feel across platforms

## 🎨 UI Components

### Data Grid
- Sortable columns
- Resizable columns
- Custom cell renderers
- Status indicators
- Progress bars
- Avatar initials

### Responsive Design
- Mobile-first approach
- Touch-friendly interface
- Adaptive layouts
- Cross-platform compatibility

## 🔒 Data Privacy

- **Local Storage**: All data stored in your browser
- **No Cloud**: No data sent to external servers
- **Offline Capable**: Works without internet connection
- **Export Options**: CSV and JSON export capabilities

## 🚀 Performance

- **Fast Loading**: Optimized bundle size
- **Lazy Loading**: Components loaded on demand
- **Caching**: Intelligent caching strategies
- **Compression**: Assets optimized for delivery

## 📦 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Dexie.js](https://dexie.org/) - IndexedDB wrapper
- [react-data-grid](https://github.com/adazzle/react-data-grid) - Data grid component
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Lucide](https://lucide.dev/) - Beautiful icons

## 📞 Support

For support and questions, please open an issue on GitHub or contact the development team.

---

**Offrows** - Modern, offline-first project tracking for the modern web. 



Sync to Cloud -> overwrite the tables, rows in cloud 
  - when delete a table in offline mode - mark it as soft delete in status and delete it from db only after that table is deleted properly in the cloud db
  - when delete a row in offline mode - mark it as soft delete in status and delete it from db only after that row is deleted properly in the cloud db
Sync from Cloud -> overwrite the current changes with all the changes from the cloud db

when creating new rows, editing existing rows, deleting existing rows - always mark them properly with related status which will be used for syncing with the data from the cloud db.

What is the best way to sync to cloud db? I want to make it dynamic, user can can connect to either to supabase or psql instance directly by providing a proper env or credentials but they should totally be optional since we are offline first (fully operational without the need for cloud or signing up) - but when user wants to sync, they need to be signed up and sync to a default cloud db (supabase) provided to them by default without needing them to provide credentials to connect to an additional db (their supabase or psql instance). Should we do implementation ready in both supabase and psql + s3  and let the user choose by selecting to sync to one of them?

Encryption-Decryption
  - we should provide a data encryption before storing the data to IDB and when read from it, decrypt it?

Viz page
  - can try to visualize the data by selecting a table (for example, select a table, what column to use as x axis, what to use as y axis of line chart, area chart? ...etc)