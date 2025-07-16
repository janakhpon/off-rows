import React from 'react';
import { cn } from '@/lib/utils';

interface CreateTableModalProps {
  open: boolean;
  onClose: () => void;
  value: string;
  onValueChange: (v: string) => void;
  onCreate: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
}

export default function CreateTableModal({ open, onClose, value, onValueChange, onCreate, onKeyPress }: CreateTableModalProps) {
  if (!open) return null;
  return (
    <div className="flex fixed inset-0 z-50 justify-center items-center p-4 animate-fade-in">
      <div 
        className="absolute inset-0 backdrop-blur-sm bg-black/30 transition-all duration-300"
        onClick={onClose}
      />
      <div className="relative p-6 mx-4 w-96 max-w-md bg-white/95 dark:bg-gray-800/95 rounded-lg shadow-xl backdrop-blur-md transition-all duration-300 animate-scale-in">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100 transition-colors duration-200">
          Create New Table
        </h2>
        <input
          type="text"
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          placeholder="Enter table name"
          className={cn(
            'p-2 w-full text-gray-900 bg-white/80 dark:bg-gray-700/80 rounded-md border border-gray-200 dark:border-gray-600 dark:text-gray-100 transition-all duration-300',
            'focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500',
            'hover:border-gray-400 dark:hover:border-gray-500',
          )}
          onKeyDown={onKeyPress}
        />
        <div className="flex justify-end mt-4 space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-md transition-all duration-200 hover:bg-gray-100/80 dark:hover:bg-gray-700/80 hover:scale-105"
            type="button"
          >
            Cancel
          </button>
          <button
            onClick={onCreate}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md transition-all duration-200 hover:bg-blue-700 hover:scale-105 hover:shadow-lg"
            type="button"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
} 