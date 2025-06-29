"use client";

import { Trash2, AlertTriangle } from 'lucide-react';

interface DeleteColumnModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  columnName: string;
}

export default function DeleteColumnModal({ open, onClose, onConfirm, columnName }: DeleteColumnModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-2 p-6 relative animate-fade-in">
        <div className="flex items-center space-x-3 mb-4">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Delete Column</h3>
            <p className="text-sm text-gray-500">This action cannot be undone.</p>
          </div>
        </div>
        
        <div className="mb-6">
          <p className="text-sm text-gray-700">
            Are you sure you want to delete the column <span className="font-medium text-gray-900">&ldquo;{columnName}&rdquo;</span>? 
            This will permanently remove the column and all its data from this table.
          </p>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200 cursor-pointer"
            type="button"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 cursor-pointer flex items-center space-x-2"
            type="button"
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete Column</span>
          </button>
        </div>
      </div>
    </div>
  );
} 