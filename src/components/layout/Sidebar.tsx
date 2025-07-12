'use client';

import { useState } from 'react';
import {
  Settings,
  HelpCircle,
  Github,
  Shield,
  Trash2,
  Download,
  Upload,
  RotateCcw,
  AlertTriangle,
  X,
  Cloud,
  ArrowUpDown,
  ArrowDown,
  ArrowUp,
  Wifi,
  WifiOff,
  Image,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { useAppStore } from '@/lib/store';
import { db } from '@/lib/database';
import { useTheme } from '@/app/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import { useImageSettingsStore } from '@/lib/imageSettingsStore';
import { backgroundSyncService } from '@/lib/backgroundSync';
import { useBackgroundSync } from '@/lib/useBackgroundSync';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const { theme } = useTheme();
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Cloud sync state
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [bidirectionalSync, setBidirectionalSync] = useState(false);
  const [autoSync, setAutoSync] = useState(false);
  const [lastSyncTime] = useState<string | null>(null);

  // Background sync state
  const { isOnline, pendingCount, syncedCount } = useBackgroundSync();

  // Image settings state (from global store)
  const convertToWebP = useImageSettingsStore((s) => s.convertToWebP);
  const setConvertToWebP = useImageSettingsStore((s) => s.setConvertToWebP);
  const imageQuality = useImageSettingsStore((s) => s.imageQuality);
  const setImageQuality = useImageSettingsStore((s) => s.setImageQuality);
  const syncImagesToS3 = useImageSettingsStore((s) => s.syncImagesToS3);
  const setSyncImagesToS3 = useImageSettingsStore((s) => s.setSyncImagesToS3);
  const showImageNotifications = useImageSettingsStore((s) => s.showImageNotifications);
  const setShowImageNotifications = useImageSettingsStore((s) => s.setShowImageNotifications);

  // Handle S3 sync toggle
  const handleSyncImagesToS3Toggle = (enabled: boolean) => {
    setSyncImagesToS3(enabled);

    // Trigger immediate sync if enabling and online
    if (enabled && isOnline) {
      backgroundSyncService.triggerSync();
    }
  };

  // Check online status (now from hook)
  // const isOnline = syncStatus === 'online';

  // Listen for online/offline events (now handled by hook)
  // useEffect(() => {
  //   const handleOnline = () => setSyncStatus('online');
  //   const handleOffline = () => setSyncStatus('offline');
  //   window.addEventListener('online', handleOnline);
  //   window.addEventListener('offline', handleOffline);
  //   return () => {
  //     window.removeEventListener('online', handleOnline);
  //     window.removeEventListener('offline', handleOffline);
  //   };
  // }, []);

  const clearAllStorage = async () => {
    setIsLoading(true);
    try {
      // Clear IndexedDB
      await db.delete();

      // Clear localStorage
      localStorage.clear();

      // Clear sessionStorage
      sessionStorage.clear();

      // Clear cache storage
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
      }

      // Reset the app state to clear all tables from UI
      const { resetState } = useAppStore.getState();
      resetState();

      // Prevent re-initialization by setting a flag in sessionStorage
      sessionStorage.setItem('skipInitialization', 'true');

      setMessage({ type: 'success', text: 'All storage cleared successfully' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to clear storage: ' + (error as Error).message });
    } finally {
      setIsLoading(false);
      setShowClearConfirm(false);
    }
  };

  const resetDatabase = async () => {
    setIsLoading(true);
    try {
      // Delete all tables and data
      await db.table('tables').clear();
      await db.table('rows').clear();
      await db.table('views').clear();
      await db.table('files').clear();

      // Reset the app state to clear all tables from UI
      const { resetState } = useAppStore.getState();
      resetState();

      setMessage({ type: 'success', text: 'Database reset successfully' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to reset database: ' + (error as Error).message });
    } finally {
      setIsLoading(false);
      setShowResetConfirm(false);
    }
  };

  const exportDatabase = async () => {
    setIsLoading(true);
    try {
      // Export all data from IndexedDB
      const tables = await db.table('tables').toArray();
      const rows = await db.table('rows').toArray();
      const views = await db.table('views').toArray();

      // Clean rows data - remove file/image fields to avoid stack overflow
      const cleanedRows = rows.map((row) => {
        const cleanedData: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(row.data)) {
          // Skip file/image fields to prevent stack overflow
          if (typeof value === 'object' && value !== null && 'fileId' in value) {
            // Replace file/image fields with placeholder
            const fileValue = value as { fileId: number; name?: string; type?: string };
            cleanedData[key] = {
              fileId: fileValue.fileId,
              name: fileValue.name || 'File',
              type: fileValue.type || 'application/octet-stream',
              // Note: Actual file content is not included in database export
              // Use individual table export for file content
            };
          } else {
            cleanedData[key] = value;
          }
        }
        return {
          ...row,
          data: cleanedData,
        };
      });

      const exportData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        tables,
        rows: cleanedRows,
        views,
        // Note: Files table is not included in database export to prevent stack overflow
        // Use individual table export for complete file backup
      };

      // Create and download file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `offrows-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setMessage({
        type: 'success',
        text: 'Database exported successfully (file content excluded)',
      });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to export database: ' + (error as Error).message });
    } finally {
      setIsLoading(false);
    }
  };

  const importDatabase = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const text = await file.text();
      const importData = JSON.parse(text);

      // Validate import data
      if (!importData.tables || !importData.rows || !importData.views) {
        throw new Error('Invalid backup file format');
      }

      // Clear existing data
      await db.table('tables').clear();
      await db.table('rows').clear();
      await db.table('views').clear();
      await db.table('files').clear();

      // Import new data
      if (importData.tables.length > 0) {
        await db.table('tables').bulkAdd(importData.tables);
      }
      if (importData.rows.length > 0) {
        await db.table('rows').bulkAdd(importData.rows);
      }
      if (importData.views.length > 0) {
        await db.table('views').bulkAdd(importData.views);
      }
      // Note: Files are not imported from database export to prevent stack overflow
      // File content should be handled through individual table exports

      // Refresh the app state
      const { refreshTables } = useAppStore.getState();
      await refreshTables();

      setMessage({ type: 'success', text: 'Database imported successfully' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to import database: ' + (error as Error).message });
    } finally {
      setIsLoading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const clearMessage = () => {
    setMessage(null);
  };

  const handleSettings = () => {
    setShowSettings(true);
  };

  const handleHelp = () => {
    // TODO: Implement help/documentation
    console.log('Help clicked');
  };

  const handleGithub = () => {
    window.open('https://github.com/janakhpon/off-rows', '_blank');
  };

  return (
    <>
      {/* Mobile overlay with blur effect */}
      {!isCollapsed && (
        <div
          className="fixed inset-0 z-40 backdrop-blur-sm bg-black/20 md:hidden transition-all duration-300 ease-in-out"
          onClick={onToggle}
        />
      )}

      {/* Sidebar with improved animations */}
      <div
        className={cn(
          'fixed md:relative z-50 h-full shadow-lg transition-all duration-300 ease-in-out',
          theme === 'dark' ? 'bg-gray-800/95 border-gray-700' : 'bg-white/95 border-gray-200',
          'border-r backdrop-blur-md',
          'w-80',
          isCollapsed 
            ? '-translate-x-full md:translate-x-0 md:w-0 md:opacity-0 md:overflow-hidden' 
            : 'translate-x-0 md:w-80 md:opacity-100',
        )}
      >
        {/* Header with smooth transitions */}
        <div
          className={cn(
            'flex justify-between items-center p-4 transition-all duration-200',
            theme === 'dark' ? 'bg-gray-700/90' : 'bg-gray-50/90',
            'backdrop-blur-sm',
          )}
        >
          {showSettings ? (
            <>
              <Settings className="w-6 h-6 text-blue-600 transition-colors duration-200" />
              <span className="font-semibold text-gray-900 dark:text-gray-100 transition-colors duration-200">Settings</span>
            </>
          ) : (
            <>
              <Settings className="w-6 h-6 text-blue-600 transition-colors duration-200" />
              <span className="font-semibold text-gray-900 dark:text-gray-100 transition-colors duration-200">Application</span>
            </>
          )}
          {showSettings && (
            <button
              onClick={() => setShowSettings(false)}
              className={cn(
                'p-2 rounded-lg transition-all duration-200 cursor-pointer focus-ring hover:scale-105',
                theme === 'dark'
                  ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-600'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100',
              )}
              type="button"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Content with smooth scrolling */}
        <div className="overflow-y-auto flex-1 scroll-smooth">
          {!showSettings ? (
            // Main menu with enhanced animations
            <div className="p-4 space-y-2">
              <div className="mb-4 animate-fade-in">
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 transition-colors duration-200">
                  Application
                </h3>
              </div>
              {/* Main Actions with hover animations */}
              <div className="space-y-1">
                <button
                  onClick={handleSettings}
                  className={cn(
                    'w-full text-left p-3 rounded-lg transition-all duration-200 cursor-pointer group border border-transparent',
                    'hover:scale-[1.02] hover:shadow-sm',
                    theme === 'dark'
                      ? 'text-gray-300 hover:bg-gray-700/80 hover:text-gray-100'
                      : 'text-gray-700 hover:bg-gray-50/80 hover:text-gray-900',
                    'flex items-center space-x-3',
                  )}
                  type="button"
                >
                  <Settings
                    className={cn(
                      'w-4 h-4 transition-all duration-200',
                      'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300',
                      'group-hover:scale-110',
                    )}
                  />
                  <span className="text-sm font-medium">Settings</span>
                </button>

                <button
                  onClick={handleHelp}
                  className={cn(
                    'w-full text-left p-3 rounded-lg transition-all duration-200 cursor-pointer group border border-transparent',
                    'hover:scale-[1.02] hover:shadow-sm',
                    theme === 'dark'
                      ? 'text-gray-300 hover:bg-gray-700/80 hover:text-gray-100'
                      : 'text-gray-700 hover:bg-gray-50/80 hover:text-gray-900',
                    'flex items-center space-x-3',
                  )}
                  type="button"
                >
                  <HelpCircle
                    className={cn(
                      'w-4 h-4 transition-all duration-200',
                      'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300',
                      'group-hover:scale-110',
                    )}
                  />
                  <span className="text-sm font-medium">Help</span>
                </button>

                <button
                  onClick={handleGithub}
                  className={cn(
                    'w-full text-left p-3 rounded-lg transition-all duration-200 cursor-pointer group border border-transparent',
                    'hover:scale-[1.02] hover:shadow-sm',
                    theme === 'dark'
                      ? 'text-gray-300 hover:bg-gray-700/80 hover:text-gray-100'
                      : 'text-gray-700 hover:bg-gray-50/80 hover:text-gray-900',
                    'flex items-center space-x-3',
                  )}
                  type="button"
                >
                  <Github
                    className={cn(
                      'w-4 h-4 transition-all duration-200',
                      'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300',
                      'group-hover:scale-110',
                    )}
                  />
                  <span className="text-sm font-medium">GitHub</span>
                </button>
              </div>
            </div>
          ) : (
            // Settings content with enhanced animations
            <div className="p-4 space-y-6 animate-fade-in">
              {/* Message with slide-in animation */}
              {message && (
                <div
                  className={cn(
                    'p-3 rounded-lg transition-all duration-300 ease-out animate-slide-in-right',
                    message.type === 'success'
                      ? 'bg-green-50 text-green-800 border border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700'
                      : 'bg-red-50 text-red-800 border border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700',
                  )}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm">{message.text}</span>
                    <button
                      onClick={clearMessage}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200 hover:scale-110"
                      type="button"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}

              {/* Cloud Sync Section with enhanced styling */}
              <div className="space-y-3 animate-fade-in-up">
                <h3 className="flex items-center space-x-2 text-sm font-medium text-gray-900 dark:text-gray-100 transition-colors duration-200">
                  <Cloud className="w-4 h-4 text-blue-600 transition-colors duration-200" />
                  <span>Cloud Sync</span>
                </h3>

                <div className="space-y-3">
                  {/* Enable Sync Toggle with enhanced animations */}
                  <div className="flex justify-between items-center p-3 rounded-lg transition-all duration-200 hover:bg-gray-50/50 dark:hover:bg-gray-700/50">
                    <div>
                      <p className="text-xs font-medium text-gray-900 dark:text-gray-100 transition-colors duration-200">
                        Enable Cloud Sync
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-200">
                        {isOnline
                          ? 'Sync data with cloud storage'
                          : 'Requires internet connection'}
                      </p>
                    </div>
                    <button
                      onClick={() => setSyncEnabled(!syncEnabled)}
                      disabled={!isOnline}
                      className={cn(
                        'inline-flex relative items-center w-11 h-6 rounded-full transition-all duration-300 cursor-pointer focus-ring disabled:opacity-50 disabled:cursor-not-allowed',
                        'hover:scale-105',
                        syncEnabled
                          ? 'bg-blue-600 hover:bg-blue-700 shadow-lg'
                          : 'bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500',
                      )}
                      type="button"
                    >
                      <span className="sr-only">Enable cloud sync</span>
                      <span
                        className={cn(
                          'inline-block w-4 h-4 bg-white rounded-full transition-all duration-300 transform shadow-md',
                          syncEnabled ? 'translate-x-6' : 'translate-x-1',
                        )}
                      />
                    </button>
                  </div>

                  {/* Connection Status with enhanced styling */}
                  <div className="flex justify-between items-center p-3 bg-gray-50/80 rounded-lg dark:bg-gray-700/80 transition-all duration-200 hover:bg-gray-100/80 dark:hover:bg-gray-600/80">
                    <div className="flex items-center space-x-2">
                      {isOnline ? (
                        <Wifi className="w-3 h-3 text-green-600 animate-pulse" />
                      ) : (
                        <WifiOff className="w-3 h-3 text-gray-400" />
                      )}
                      <span className="text-xs text-gray-600 dark:text-gray-300 transition-colors duration-200">
                        {isOnline ? 'Online' : 'Offline'}
                      </span>
                    </div>
                    {lastSyncTime && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-200">
                        Last: {new Date(lastSyncTime).toLocaleTimeString()}
                      </span>
                    )}
                  </div>

                  {/* Sync Options - Only show when sync is enabled */}
                  {syncEnabled && (
                    <div className="p-3 space-y-3 bg-blue-50/80 rounded-lg border border-blue-200 dark:bg-blue-900/20 dark:border-blue-700 transition-all duration-300 animate-fade-in-up">
                      {/* Bidirectional Sync */}
                      <div className="flex justify-between items-center p-2 rounded-lg transition-all duration-200 hover:bg-blue-100/50 dark:hover:bg-blue-800/30">
                        <div>
                          <p className="text-xs font-medium text-gray-900 dark:text-gray-100 transition-colors duration-200">
                            Bidirectional Sync
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-200">
                            Sync both ways automatically
                          </p>
                        </div>
                        <button
                          onClick={() => setBidirectionalSync(!bidirectionalSync)}
                          disabled={!syncEnabled}
                          className={cn(
                            'inline-flex relative items-center w-9 h-5 rounded-full transition-all duration-300 cursor-pointer focus-ring disabled:opacity-50 disabled:cursor-not-allowed',
                            'hover:scale-105',
                            bidirectionalSync
                              ? 'bg-blue-600 hover:bg-blue-700 shadow-md'
                              : 'bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500',
                          )}
                          type="button"
                        >
                          <span className="sr-only">Enable bidirectional sync</span>
                          <span
                            className={cn(
                              'inline-block w-3 h-3 bg-white rounded-full transition-all duration-300 transform shadow-sm',
                              bidirectionalSync ? 'translate-x-5' : 'translate-x-1',
                            )}
                          />
                        </button>
                      </div>

                      {/* Auto Sync */}
                      <div className="flex justify-between items-center p-2 rounded-lg transition-all duration-200 hover:bg-blue-100/50 dark:hover:bg-blue-800/30">
                        <div>
                          <p className="text-xs font-medium text-gray-900 dark:text-gray-100 transition-colors duration-200">
                            Auto Sync
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-200">
                            Sync automatically when online
                          </p>
                        </div>
                        <button
                          onClick={() => setAutoSync(!autoSync)}
                          disabled={!syncEnabled}
                          className={cn(
                            'inline-flex relative items-center w-9 h-5 rounded-full transition-all duration-300 cursor-pointer focus-ring disabled:opacity-50 disabled:cursor-not-allowed',
                            'hover:scale-105',
                            autoSync
                              ? 'bg-blue-600 hover:bg-blue-700 shadow-md'
                              : 'bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500',
                          )}
                          type="button"
                        >
                          <span className="sr-only">Enable auto sync</span>
                          <span
                            className={cn(
                              'inline-block w-3 h-3 bg-white rounded-full transition-all duration-300 transform shadow-sm',
                              autoSync ? 'translate-x-5' : 'translate-x-1',
                            )}
                          />
                        </button>
                      </div>

                      {/* Manual Sync Buttons with enhanced styling */}
                      <div className="space-y-2">
                        <button
                          disabled={!syncEnabled || !isOnline}
                          className={cn(
                            'flex items-center px-3 py-2 space-x-2 w-full text-xs rounded-lg transition-all duration-200 cursor-pointer focus-ring disabled:opacity-50 disabled:cursor-not-allowed',
                            'hover:scale-[1.02] hover:shadow-sm',
                            theme === 'dark'
                              ? 'text-gray-300 bg-gray-700/80 hover:bg-gray-600'
                              : 'text-gray-700 bg-gray-50/80 hover:bg-gray-100',
                          )}
                          type="button"
                        >
                          <ArrowUpDown className="w-3 h-3" />
                          <span>Sync All</span>
                        </button>

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            disabled={!syncEnabled || !isOnline}
                            className={cn(
                              'flex items-center px-2 py-2 space-x-1 text-xs rounded-lg transition-all duration-200 cursor-pointer focus-ring disabled:opacity-50 disabled:cursor-not-allowed',
                              'hover:scale-[1.02] hover:shadow-sm',
                              theme === 'dark'
                                ? 'text-gray-300 bg-gray-700/80 hover:bg-gray-600'
                                : 'text-gray-700 bg-gray-50/80 hover:bg-gray-100',
                            )}
                            type="button"
                          >
                            <ArrowUp className="w-3 h-3" />
                            <span>Upload</span>
                          </button>

                          <button
                            disabled={!syncEnabled || !isOnline}
                            className={cn(
                              'flex items-center px-2 py-2 space-x-1 text-xs rounded-lg transition-all duration-200 cursor-pointer focus-ring disabled:opacity-50 disabled:cursor-not-allowed',
                              'hover:scale-[1.02] hover:shadow-sm',
                              theme === 'dark'
                                ? 'text-gray-300 bg-gray-700/80 hover:bg-gray-600'
                                : 'text-gray-700 bg-gray-50/80 hover:bg-gray-100',
                            )}
                            type="button"
                          >
                            <ArrowDown className="w-3 h-3" />
                            <span>Download</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Sync Status Indicators with enhanced styling */}
                  {syncEnabled && (
                    <div className="space-y-2 p-3 bg-gray-50/80 rounded-lg dark:bg-gray-700/80 transition-all duration-200">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-600 dark:text-gray-400 transition-colors duration-200">Pending Changes:</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100 transition-colors duration-200">
                          {pendingCount}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-600 dark:text-gray-400 transition-colors duration-200">Synced Items:</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100 transition-colors duration-200">
                          {syncedCount}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Image Settings Section with enhanced animations */}
              <div className="space-y-3 animate-fade-in-up">
                <h3 className="flex items-center space-x-2 text-sm font-medium text-gray-900 dark:text-gray-100 transition-colors duration-200">
                  <Image className="w-4 h-4 text-blue-600 transition-colors duration-200" aria-hidden="true" />
                  <span>Image Settings</span>
                </h3>

                <div className="space-y-3">
                  {/* Convert to WebP Toggle with enhanced styling */}
                  <div className="flex justify-between items-center p-3 rounded-lg transition-all duration-200 hover:bg-gray-50/50 dark:hover:bg-gray-700/50">
                    <div>
                      <p className="text-xs font-medium text-gray-900 dark:text-gray-100 transition-colors duration-200">
                        Convert to WebP
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-200">
                        Convert images to WebP format after compression
                      </p>
                    </div>
                    <Switch
                      checked={convertToWebP}
                      onCheckedChange={setConvertToWebP}
                      className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-200 dark:data-[state=unchecked]:bg-gray-600 transition-all duration-200 hover:scale-105"
                    />
                  </div>

                  {/* Image Quality Slider with enhanced styling */}
                  <div className="space-y-2 p-3 rounded-lg transition-all duration-200 hover:bg-gray-50/50 dark:hover:bg-gray-700/50">
                    <div className="flex justify-between items-center">
                      <p className="text-xs font-medium text-gray-900 dark:text-gray-100 transition-colors duration-200">
                        Image Quality
                      </p>
                      <span className="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-200">
                        {imageQuality[0]}%
                      </span>
                    </div>
                    <Slider
                      value={imageQuality}
                      onValueChange={setImageQuality}
                      max={100}
                      min={10}
                      step={5}
                      className="w-full transition-all duration-200"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-200">
                      Higher quality = larger file size
                    </p>
                  </div>

                  {/* Sync Images to S3 Toggle with enhanced styling */}
                  <div className="flex justify-between items-center p-3 rounded-lg transition-all duration-200 hover:bg-gray-50/50 dark:hover:bg-gray-700/50">
                    <div>
                      <p className="text-xs font-medium text-gray-900 dark:text-gray-100 transition-colors duration-200">
                        Sync Images to S3
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-200">
                        {isOnline
                          ? 'Sync images to AWS S3 when online'
                          : 'Requires internet connection'}
                      </p>
                    </div>
                    <Switch
                      checked={syncImagesToS3}
                      onCheckedChange={handleSyncImagesToS3Toggle}
                      disabled={!isOnline}
                      className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-200 dark:data-[state=unchecked]:bg-gray-600 disabled:opacity-50 transition-all duration-200 hover:scale-105"
                    />
                  </div>

                  {/* Show Image Notifications Toggle with enhanced styling */}
                  <div className="flex justify-between items-center p-3 rounded-lg transition-all duration-200 hover:bg-gray-50/50 dark:hover:bg-gray-700/50">
                    <div>
                      <p className="text-xs font-medium text-gray-900 dark:text-gray-100 transition-colors duration-200">
                        Display Image Notifications
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-200">
                        Show compression and conversion status notifications
                      </p>
                    </div>
                    <Switch
                      checked={showImageNotifications}
                      onCheckedChange={setShowImageNotifications}
                      className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-200 dark:data-[state=unchecked]:bg-gray-600 transition-all duration-200 hover:scale-105"
                    />
                  </div>

                  {/* Image Sync Status with enhanced styling */}
                  {syncImagesToS3 && (
                    <div className="p-3 bg-blue-50/80 rounded-lg border border-blue-200 dark:bg-blue-900/20 dark:border-blue-700 transition-all duration-300 animate-fade-in-up">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-600 dark:text-gray-400 transition-colors duration-200">
                            Pending Images:
                          </span>
                          <span className="font-medium text-gray-900 dark:text-gray-100 transition-colors duration-200">
                            {pendingCount}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-600 dark:text-gray-400 transition-colors duration-200">Synced Images:</span>
                          <span className="font-medium text-gray-900 dark:text-gray-100 transition-colors duration-200">
                            {syncedCount}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Security Section with enhanced styling */}
              <div className="space-y-3 animate-fade-in-up">
                <h3 className="flex items-center space-x-2 text-sm font-medium text-gray-900 dark:text-gray-100 transition-colors duration-200">
                  <Shield className="w-4 h-4 text-blue-600 transition-colors duration-200" />
                  <span>Security</span>
                </h3>

                <div className="space-y-2">
                  <div className="flex justify-between items-center p-3 rounded-lg transition-all duration-200 hover:bg-gray-50/50 dark:hover:bg-gray-700/50">
                    <div>
                      <p className="text-xs font-medium text-gray-900 dark:text-gray-100 transition-colors duration-200">
                        Encryption
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-200">
                        Encrypt data stored locally (coming soon)
                      </p>
                    </div>
                    <button
                      disabled
                      className="inline-flex relative items-center w-9 h-5 bg-gray-200 rounded-full transition-all duration-200 cursor-not-allowed dark:bg-gray-600"
                      type="button"
                    >
                      <span className="sr-only">Enable encryption</span>
                      <span className="inline-block w-3 h-3 bg-white rounded-full transition-transform duration-200 transform translate-x-1 dark:bg-gray-300" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Data Management Section with enhanced styling */}
              <div className="space-y-3 animate-fade-in-up">
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 transition-colors duration-200">
                  Data Management
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-200">
                  Note: Database export excludes file content to prevent errors. Use individual
                  table exports for files.
                </p>

                <div className="space-y-2">
                  {/* Export Database with enhanced styling */}
                  <button
                    onClick={exportDatabase}
                    disabled={isLoading}
                    className={cn(
                      'flex items-center px-3 py-2 space-x-2 w-full text-xs rounded-lg transition-all duration-200 cursor-pointer focus-ring disabled:opacity-50 disabled:cursor-not-allowed',
                      'hover:scale-[1.02] hover:shadow-sm',
                      theme === 'dark'
                        ? 'text-gray-300 bg-gray-700/80 hover:bg-gray-600'
                        : 'text-gray-700 bg-gray-50/80 hover:bg-gray-100',
                    )}
                    type="button"
                  >
                    <Download className="w-3 h-3 transition-transform duration-200 group-hover:scale-110" />
                    <span>Export Database (no files)</span>
                  </button>

                  {/* Import Database with enhanced styling */}
                  <div className="relative">
                    <input
                      type="file"
                      accept=".json"
                      onChange={importDatabase}
                      disabled={isLoading}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                      id="import-database"
                    />
                    <label
                      htmlFor="import-database"
                      className={cn(
                        'flex items-center px-3 py-2 space-x-2 w-full text-xs rounded-lg transition-all duration-200 cursor-pointer focus-ring disabled:opacity-50 disabled:cursor-not-allowed',
                        'hover:scale-[1.02] hover:shadow-sm',
                        theme === 'dark'
                          ? 'text-gray-300 bg-gray-700/80 hover:bg-gray-600'
                          : 'text-gray-700 bg-gray-50/80 hover:bg-gray-100',
                      )}
                    >
                      <Upload className="w-3 h-3 transition-transform duration-200 group-hover:scale-110" />
                      <span>Import Database</span>
                    </label>
                  </div>

                  {/* Reset Database with enhanced styling */}
                  <button
                    onClick={() => setShowResetConfirm(true)}
                    disabled={isLoading}
                    className={cn(
                      'flex items-center px-3 py-2 space-x-2 w-full text-xs rounded-lg transition-all duration-200 cursor-pointer focus-ring disabled:opacity-50 disabled:cursor-not-allowed',
                      'hover:scale-[1.02] hover:shadow-sm',
                      theme === 'dark'
                        ? 'text-orange-300 bg-orange-900/20 hover:bg-orange-900/30'
                        : 'text-orange-700 bg-orange-50/80 hover:bg-orange-100',
                    )}
                    type="button"
                  >
                    <RotateCcw className="w-3 h-3 transition-transform duration-200 group-hover:scale-110" />
                    <span>Reset Database</span>
                  </button>

                  {/* Clear All Storage with enhanced styling */}
                  <button
                    onClick={() => setShowClearConfirm(true)}
                    disabled={isLoading}
                    className={cn(
                      'flex items-center px-3 py-2 space-x-2 w-full text-xs rounded-lg transition-all duration-200 cursor-pointer focus-ring disabled:opacity-50 disabled:cursor-not-allowed',
                      'hover:scale-[1.02] hover:shadow-sm',
                      theme === 'dark'
                        ? 'text-red-300 bg-red-900/20 hover:bg-red-900/30'
                        : 'text-red-700 bg-red-50/80 hover:bg-red-100',
                    )}
                    type="button"
                  >
                    <Trash2 className="w-3 h-3 transition-transform duration-200 group-hover:scale-110" />
                    <span>Clear All Storage</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer with enhanced styling */}
        <div className={cn('border-t transition-colors duration-200', theme === 'dark' ? 'border-gray-700' : 'border-gray-200')}>
          <div className="p-4">
            <div className="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-200">Offrows v0.1.0</div>
          </div>
        </div>
      </div>

      {/* Clear Storage Confirmation Modal with enhanced animations */}
      {showClearConfirm && (
        <div className="flex fixed inset-0 justify-center items-center p-4 z-60 animate-fade-in">
          <div
            className="absolute inset-0 backdrop-blur-sm bg-black/30 transition-all duration-300"
            onClick={() => setShowClearConfirm(false)}
          />
          <div
            className={cn(
              'relative p-6 w-full max-w-md rounded-lg shadow-xl transition-all duration-300 animate-scale-in',
              theme === 'dark' ? 'bg-gray-800/95' : 'bg-white/95',
              'backdrop-blur-md',
            )}
          >
            <div className="flex items-center mb-4 space-x-3">
              <AlertTriangle className="w-6 h-6 text-red-600 transition-colors duration-200" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 transition-colors duration-200">
                Clear All Storage
              </h3>
            </div>
            <p className="mb-6 text-sm text-gray-600 dark:text-gray-300 transition-colors duration-200">
              This will permanently delete all your data including tables, rows, files, and all
              browser storage. This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className={cn(
                  'flex-1 px-4 py-2 text-sm rounded-lg transition-all duration-200 cursor-pointer focus-ring hover:scale-105',
                  theme === 'dark'
                    ? 'text-gray-200 bg-gray-700/80 hover:bg-gray-600'
                    : 'text-gray-700 bg-gray-100/80 hover:bg-gray-200',
                )}
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={clearAllStorage}
                disabled={isLoading}
                className="flex-1 px-4 py-2 text-sm text-white bg-red-600 rounded-lg transition-all duration-200 cursor-pointer hover:bg-red-700 hover:scale-105 focus-ring disabled:opacity-50 disabled:cursor-not-allowed"
                type="button"
              >
                {isLoading ? 'Clearing...' : 'Clear All'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Database Confirmation Modal with enhanced animations */}
      {showResetConfirm && (
        <div className="flex fixed inset-0 justify-center items-center p-4 z-60 animate-fade-in">
          <div
            className="absolute inset-0 backdrop-blur-sm bg-black/30 transition-all duration-300"
            onClick={() => setShowResetConfirm(false)}
          />
          <div
            className={cn(
              'relative p-6 w-full max-w-md rounded-lg shadow-xl transition-all duration-300 animate-scale-in',
              theme === 'dark' ? 'bg-gray-800/95' : 'bg-white/95',
              'backdrop-blur-md',
            )}
          >
            <div className="flex items-center mb-4 space-x-3">
              <AlertTriangle className="w-6 h-6 text-orange-600 transition-colors duration-200" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 transition-colors duration-200">
                Reset Database
              </h3>
            </div>
            <p className="mb-6 text-sm text-gray-600 dark:text-gray-300 transition-colors duration-200">
              This will delete all your tables and data, then reinitialize with sample data. This
              action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className={cn(
                  'flex-1 px-4 py-2 text-sm rounded-lg transition-all duration-200 cursor-pointer focus-ring hover:scale-105',
                  theme === 'dark'
                    ? 'text-gray-200 bg-gray-700/80 hover:bg-gray-600'
                    : 'text-gray-700 bg-gray-100/80 hover:bg-gray-200',
                )}
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={resetDatabase}
                disabled={isLoading}
                className="flex-1 px-4 py-2 text-sm text-white bg-orange-600 rounded-lg transition-all duration-200 cursor-pointer hover:bg-orange-700 hover:scale-105 focus-ring disabled:opacity-50 disabled:cursor-not-allowed"
                type="button"
              >
                {isLoading ? 'Resetting...' : 'Reset Database'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
