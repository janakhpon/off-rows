'use client';

import { useState } from 'react';
import { Menu, Search, Settings, Download, Upload, Share2, Plus } from 'lucide-react';
import { useTables } from '../contexts/TableContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAppStore } from '@/lib/store';
import ThemeToggle from './ThemeToggle';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export default function Header({ onToggleSidebar }: HeaderProps) {
  const { activeTable } = useTables();
  const { theme } = useTheme();
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
    <header 
      className="border-b shadow-sm sticky top-0 z-40"
      style={{
        backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
        borderColor: theme === 'dark' ? '#475569' : '#e5e7eb'
      }}
    >
      <div className="flex items-center justify-between h-16 px-4 sm:px-6">
        {/* Left side - Menu button and logo */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg transition-colors duration-200 cursor-pointer focus-ring"
            style={{
              color: theme === 'dark' ? '#9ca3af' : '#6b7280'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme === 'dark' ? '#374151' : '#f3f4f6';
              e.currentTarget.style.color = theme === 'dark' ? '#d1d5db' : '#374151';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = theme === 'dark' ? '#9ca3af' : '#6b7280';
            }}
            type="button"
          >
            <Menu className="h-5 w-5" />
          </button>
          
          <div className="flex items-center space-x-3">
            <div className="hidden sm:block">
              <h1 
                className="text-xl font-bold"
                style={{
                  color: theme === 'dark' ? '#f9fafc' : '#111827'
                }}
              >
                Offrows
              </h1>
              <p 
                className="text-xs"
                style={{
                  color: theme === 'dark' ? '#9ca3af' : '#6b7280'
                }}
              >
                Offline-first project tracker
              </p>
            </div>
          </div>
        </div>

        {/* Center - Search and table info */}
        <div className="flex-1 max-w-2xl mx-4 hidden md:block">
          <div className="relative">
            <Search 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" 
              style={{
                color: theme === 'dark' ? '#9ca3af' : '#9ca3af'
              }}
            />
            <input
              type="text"
              placeholder="Search in table..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border rounded-lg transition-colors duration-200"
              style={{
                backgroundColor: theme === 'dark' ? '#374151' : '#ffffff',
                borderColor: theme === 'dark' ? '#4b5563' : '#d1d5db',
                color: theme === 'dark' ? '#f9fafc' : '#111827'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6';
                e.target.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = theme === 'dark' ? '#4b5563' : '#d1d5db';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>
        </div>

        {/* Right side - Table info and actions */}
        <div className="flex items-center space-x-2">
          {/* Table info */}
          {activeTable && (
            <div className="hidden sm:flex items-center space-x-3 mr-4">
              <div className="text-right">
                <h2 
                  className="text-sm font-medium"
                  style={{
                    color: theme === 'dark' ? '#f9fafc' : '#111827'
                  }}
                >
                  {activeTable.name}
                </h2>
                <p 
                  className="text-xs"
                  style={{
                    color: theme === 'dark' ? '#9ca3af' : '#6b7280'
                  }}
                >
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
              className="p-2 rounded-lg transition-colors duration-200 cursor-pointer focus-ring"
              style={{
                color: theme === 'dark' ? '#9ca3af' : '#6b7280'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme === 'dark' ? '#1e3a8a' : '#dbeafe';
                e.currentTarget.style.color = theme === 'dark' ? '#93c5fd' : '#1d4ed8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = theme === 'dark' ? '#9ca3af' : '#6b7280';
              }}
              title="Add new table"
              type="button"
            >
              <Plus className="h-4 w-4" />
            </button>
            
            <button
              onClick={handleExport}
              className="p-2 rounded-lg transition-colors duration-200 cursor-pointer focus-ring"
              style={{
                color: theme === 'dark' ? '#9ca3af' : '#6b7280'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme === 'dark' ? '#065f46' : '#d1fae5';
                e.currentTarget.style.color = theme === 'dark' ? '#6ee7b7' : '#047857';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = theme === 'dark' ? '#9ca3af' : '#6b7280';
              }}
              title="Export data"
              type="button"
            >
              <Download className="h-4 w-4" />
            </button>
            
            <button
              onClick={handleImport}
              className="p-2 rounded-lg transition-colors duration-200 cursor-pointer focus-ring"
              style={{
                color: theme === 'dark' ? '#9ca3af' : '#6b7280'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme === 'dark' ? '#581c87' : '#f3e8ff';
                e.currentTarget.style.color = theme === 'dark' ? '#c084fc' : '#7c3aed';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = theme === 'dark' ? '#9ca3af' : '#6b7280';
              }}
              title="Import data"
              type="button"
            >
              <Upload className="h-4 w-4" />
            </button>
            
            <button
              onClick={handleShare}
              className="p-2 rounded-lg transition-colors duration-200 cursor-pointer focus-ring"
              style={{
                color: theme === 'dark' ? '#9ca3af' : '#6b7280'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme === 'dark' ? '#92400e' : '#fed7aa';
                e.currentTarget.style.color = theme === 'dark' ? '#fdba74' : '#ea580c';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = theme === 'dark' ? '#9ca3af' : '#6b7280';
              }}
              title="Share table"
              type="button"
            >
              <Share2 className="h-4 w-4" />
            </button>
            
            <button
              className="p-2 rounded-lg transition-colors duration-200 cursor-pointer focus-ring"
              style={{
                color: theme === 'dark' ? '#9ca3af' : '#6b7280'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme === 'dark' ? '#374151' : '#f3f4f6';
                e.currentTarget.style.color = theme === 'dark' ? '#d1d5db' : '#374151';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = theme === 'dark' ? '#9ca3af' : '#6b7280';
              }}
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
          <Search 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" 
            style={{
              color: theme === 'dark' ? '#9ca3af' : '#9ca3af'
            }}
          />
          <input
            type="text"
            placeholder="Search in table..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border rounded-lg transition-colors duration-200"
            style={{
              backgroundColor: theme === 'dark' ? '#374151' : '#ffffff',
              borderColor: theme === 'dark' ? '#4b5563' : '#d1d5db',
              color: theme === 'dark' ? '#f9fafc' : '#111827'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#3b82f6';
              e.target.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = theme === 'dark' ? '#4b5563' : '#d1d5db';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>
      </div>
    </header>
  );
} 