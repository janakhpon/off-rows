'use client';

import { X, Settings, Trash2, Edit3 } from 'lucide-react';
import { Field } from '@/lib/schemas';

interface ColumnHeaderModalProps {
  open: boolean;
  onClose: () => void;
  column?: Field;
  onEditColumn?: (field: Field) => void;
  onDeleteColumn?: (field: Field) => void;
}

export default function ColumnHeaderModal({ 
  open, 
  onClose, 
  column, 
  onEditColumn, 
  onDeleteColumn 
}: ColumnHeaderModalProps) {
  if (!open || !column) return null;

  const handleEdit = () => {
    if (onEditColumn) {
      onEditColumn(column);
    }
    onClose();
  };

  const handleDelete = () => {
    if (onDeleteColumn) {
      onDeleteColumn(column);
    }
    onClose();
  };

  return (
    <div className="flex fixed inset-0 z-50 justify-center items-center bg-primary/5 animate-fade-in">
      <div className="relative p-6 mx-2 w-full max-w-sm bg-white rounded-lg shadow-lg dark:bg-gray-800 animate-fade-in">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 text-gray-400 transition-colors cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="flex items-center mb-4 space-x-3">
          <div className="flex justify-center items-center w-10 h-10 bg-blue-100 rounded-full dark:bg-blue-900/20">
            <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Column Options</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Manage column: {column.name}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <button
            onClick={handleEdit}
            className="flex items-center px-4 py-3 w-full text-left text-gray-700 bg-gray-50 rounded-lg transition-colors cursor-pointer dark:text-gray-300 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"
          >
            <Edit3 className="mr-3 w-5 h-5 text-blue-600 dark:text-blue-400" />
            <div>
              <div className="font-medium">Edit Column</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Change name, type, and settings
              </div>
            </div>
          </button>

          <button
            onClick={handleDelete}
            className="flex items-center px-4 py-3 w-full text-left text-red-600 bg-red-50 rounded-lg transition-colors cursor-pointer dark:text-red-400 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40"
          >
            <Trash2 className="mr-3 w-5 h-5 text-red-600 dark:text-red-400" />
            <div>
              <div className="font-medium">Delete Column</div>
              <div className="text-sm text-red-500 dark:text-red-400">
                Remove column and all its data
              </div>
            </div>
          </button>
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg transition-colors cursor-pointer dark:text-gray-300 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
} 