'use client';

import { useState } from 'react';
import NextImage from 'next/image';
import { Menu, Search, Settings, Download, Upload, Share2, Plus } from 'lucide-react';
import { useTables } from '../contexts/TableContext';
import { useAppStore } from '@/lib/store';
import ThemeToggle from './ThemeToggle';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export default function Header({ onToggleSidebar }: HeaderProps) {
  const { activeTable } = useTables();
  const { addTable } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');

  const handleAddTable = async () => {
    const tableName = prompt('Enter table name:');
    if (tableName?.trim()) {
      await addTable({
        name: tableName.trim(),
        description: '',
        fields: [
          {
            id: 'name',
            name: 'Name',
            type: 'text',
            required: true,
            defaultValue: '',
          },
        ],
      });
    }
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export data');
  };

  const handleImport = () => {
    // TODO: Implement import functionality
    console.log('Import data');
  };

  const handleShare = () => {
    // TODO: Implement share functionality
    console.log('Share table');
  };

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6">
        {/* Left side - Menu button and logo */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onToggleSidebar}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200 cursor-pointer focus-ring"
            type="button"
          >
            <Menu className="h-5 w-5" />
          </button>
          
          <div className="flex items-center space-x-3">
            <NextImage
              src="/offrows.png"
              alt="Offrows"
              width={32}
              height={32}
              className="h-8 w-8"
            />
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-gray-900">Offrows</h1>
              <p className="text-xs text-gray-500">Offline-first project tracker</p>
            </div>
          </div>
        </div>

        {/* Center - Search and table info */}
        <div className="flex-1 max-w-2xl mx-4 hidden md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search in table..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
            />
          </div>
        </div>

        {/* Right side - Table info and actions */}
        <div className="flex items-center space-x-2">
          {/* Table info */}
          {activeTable && (
            <div className="hidden sm:flex items-center space-x-3 mr-4">
              <div className="text-right">
                <h2 className="text-sm font-medium text-gray-900">{activeTable.name}</h2>
                <p className="text-xs text-gray-500">
                  {activeTable.fields.length} columns
                </p>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center space-x-1">
            <ThemeToggle />
            <button
              onClick={handleAddTable}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:text-gray-400 dark:hover:text-blue-400 dark:hover:bg-blue-950/20 rounded-lg transition-colors duration-200 cursor-pointer focus-ring"
              title="Add new table"
              type="button"
            >
              <Plus className="h-4 w-4" />
            </button>
            
            <button
              onClick={handleExport}
              className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 dark:text-gray-400 dark:hover:text-green-400 dark:hover:bg-green-950/20 rounded-lg transition-colors duration-200 cursor-pointer focus-ring"
              title="Export data"
              type="button"
            >
              <Download className="h-4 w-4" />
            </button>
            
            <button
              onClick={handleImport}
              className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 dark:text-gray-400 dark:hover:text-purple-400 dark:hover:bg-purple-950/20 rounded-lg transition-colors duration-200 cursor-pointer focus-ring"
              title="Import data"
              type="button"
            >
              <Upload className="h-4 w-4" />
            </button>
            
            <button
              onClick={handleShare}
              className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors duration-200 cursor-pointer focus-ring"
              title="Share table"
              type="button"
            >
              <Share2 className="h-4 w-4" />
            </button>
            
            <button
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200 cursor-pointer focus-ring"
              title="Settings"
              type="button"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile search bar */}
      <div className="md:hidden px-4 pb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search in table..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
          />
        </div>
      </div>
    </header>
  );
} 