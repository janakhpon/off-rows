'use client';

import { useState } from 'react';
import { X, Shield, Trash2, Download, Upload, RotateCcw, AlertTriangle } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { getDB } from '@/lib/database';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const clearAllStorage = async () => {
    setIsLoading(true);
    try {
      // Clear IndexedDB
      const db = getDB();
      if (db) await db.delete();

      // Clear localStorage
      localStorage.clear();

      // Clear sessionStorage
      sessionStorage.clear();

      // Clear cache storage
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
      }

      // Reload the page to reinitialize everything
      window.location.reload();
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
      const db = getDB();
      if (!db) return;
      await db.table('tables').clear();
      await db.table('rows').clear();
      await db.table('views').clear();
      await db.table('files').clear();

      // Reinitialize database
      const { initializeDatabase } = await import('@/lib/database');
      await initializeDatabase();

      // Refresh the app state
      const { refreshTables } = useAppStore.getState();
      await refreshTables();

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
      const db = getDB();
      if (!db) return;
      const tables = await db.table('tables').toArray();
      const rows = await db.table('rows').toArray();
      const views = await db.table('views').toArray();
      const files = await db.table('files').toArray();

      const exportData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        tables,
        rows,
        views,
        files,
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

      setMessage({ type: 'success', text: 'Database exported successfully' });
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
      const db = getDB();
      if (!db) return;
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
      if (importData.files && importData.files.length > 0) {
        await db.table('files').bulkAdd(importData.files);
      }

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

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black bg-opacity-50 modal-backdrop" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Settings</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 rounded-lg transition-colors duration-200 cursor-pointer hover:text-gray-600 hover:bg-gray-100 focus-ring"
              type="button"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Message */}
            {message && (
              <div
                className={`p-4 rounded-lg ${
                  message.type === 'success'
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{message.text}</span>
                  <button
                    onClick={clearMessage}
                    className="text-gray-400 hover:text-gray-600"
                    type="button"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Security Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
                <Shield className="w-5 h-5 text-blue-600" />
                <span>Security</span>
              </h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Encryption</p>
                    <p className="text-xs text-gray-500">
                      Encrypt data stored locally (coming soon)
                    </p>
                  </div>
                  <button
                    disabled
                    className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 transition-colors duration-200 cursor-not-allowed"
                    type="button"
                  >
                    <span className="sr-only">Enable encryption</span>
                    <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 translate-x-1" />
                  </button>
                </div>
              </div>
            </div>

            {/* Data Management Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Data Management</h3>

              <div className="space-y-3">
                {/* Export Database */}
                <button
                  onClick={exportDatabase}
                  disabled={isLoading}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 bg-gray-50 rounded-lg transition-colors duration-200 cursor-pointer hover:bg-gray-100 focus-ring disabled:opacity-50 disabled:cursor-not-allowed"
                  type="button"
                >
                  <Download className="w-4 h-4" />
                  <span>Export Database</span>
                </button>

                {/* Import Database */}
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
                    className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 bg-gray-50 rounded-lg transition-colors duration-200 cursor-pointer hover:bg-gray-100 focus-ring disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Import Database</span>
                  </label>
                </div>

                {/* Reset Database */}
                <button
                  onClick={() => setShowResetConfirm(true)}
                  disabled={isLoading}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-orange-700 bg-orange-50 rounded-lg transition-colors duration-200 cursor-pointer hover:bg-orange-100 focus-ring disabled:opacity-50 disabled:cursor-not-allowed"
                  type="button"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset Database</span>
                </button>

                {/* Clear All Storage */}
                <button
                  onClick={() => setShowClearConfirm(true)}
                  disabled={isLoading}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-red-700 bg-red-50 rounded-lg transition-colors duration-200 cursor-pointer hover:bg-red-100 focus-ring disabled:opacity-50 disabled:cursor-not-allowed"
                  type="button"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear All Storage</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Clear Storage Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div
            className="bg-black bg-opacity-50 absolute inset-0"
            onClick={() => setShowClearConfirm(false)}
          />
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900">Clear All Storage</h3>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              This will permanently delete all your data including tables, rows, files, and all
              browser storage. This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg transition-colors duration-200 cursor-pointer hover:bg-gray-200 focus-ring"
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={clearAllStorage}
                disabled={isLoading}
                className="flex-1 px-4 py-2 text-sm text-white bg-red-600 rounded-lg transition-colors duration-200 cursor-pointer hover:bg-red-700 focus-ring disabled:opacity-50 disabled:cursor-not-allowed"
                type="button"
              >
                {isLoading ? 'Clearing...' : 'Clear All'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Database Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div
            className="bg-black bg-opacity-50 absolute inset-0"
            onClick={() => setShowResetConfirm(false)}
          />
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
              <h3 className="text-lg font-semibold text-gray-900">Reset Database</h3>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              This will delete all your tables and data, then reinitialize with sample data. This
              action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg transition-colors duration-200 cursor-pointer hover:bg-gray-200 focus-ring"
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={resetDatabase}
                disabled={isLoading}
                className="flex-1 px-4 py-2 text-sm text-white bg-orange-600 rounded-lg transition-colors duration-200 cursor-pointer hover:bg-orange-700 focus-ring disabled:opacity-50 disabled:cursor-not-allowed"
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
