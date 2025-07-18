'use client';

import { Trash2, AlertTriangle } from 'lucide-react';
interface DeleteColumnModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  columnName: string;
}

export default function DeleteColumnModal({
  open,
  onClose,
  onConfirm,
  columnName,
}: DeleteColumnModalProps) {
  if (!open) return null;

  return (
    <div className="flex fixed inset-0 z-50 justify-center items-center bg-primary/5 animate-fade-in">
      <div className="relative p-6 mx-2 w-full max-w-md bg-white rounded-lg shadow-lg dark:bg-gray-800 animate-fade-in">
        <div className="flex items-center mb-4 space-x-3">
          <div className="flex-shrink-0">
            <div className="flex justify-center items-center w-10 h-10 bg-red-100 rounded-full dark:bg-red-900/20">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Delete Column
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              This action cannot be undone.
            </p>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Are you sure you want to delete the column{' '}
            <span className="font-medium text-gray-900 dark:text-gray-100">
              &ldquo;{columnName}&rdquo;
            </span>
            ? This will permanently remove the column and all its data from this table.
          </p>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg transition-colors duration-200 cursor-pointer dark:text-gray-300 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
            type="button"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex items-center px-4 py-2 space-x-2 text-white bg-red-600 rounded-lg transition-colors duration-200 cursor-pointer dark:bg-red-500 hover:bg-red-700 dark:hover:bg-red-600"
            type="button"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Column</span>
          </button>
        </div>
      </div>
    </div>
  );
}
