"use client";

import { useState } from "react";
import { FieldSchema, FieldTypeSchema } from '@/lib/schemas';
import { z } from 'zod';
import { X } from 'lucide-react';

interface AddColumnModalProps {
  open: boolean;
  onClose: () => void;
  onAddColumn?: (field: z.infer<typeof FieldSchema>) => void;
}

type DefaultValueType = string | string[];
const defaultField = {
  id: '',
  name: '',
  type: 'text',
  required: false,
  options: [] as string[],
  defaultValue: '' as DefaultValueType,
};

export default function AddColumnModal({ open, onClose, onAddColumn }: AddColumnModalProps) {
  const [form, setForm] = useState({ ...defaultField });
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setForm((prev) => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleOptionsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({
      ...prev,
      options: e.target.value.split(',').map(opt => opt.trim()).filter(Boolean),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const field = FieldSchema.parse({
        ...form,
        id: form.name.toLowerCase().replace(/\s+/g, '_'),
        options: form.type === 'dropdown' ? form.options : undefined,
        defaultValue: form.defaultValue || undefined,
      });
      if (onAddColumn) onAddColumn(field);
      setForm({ ...defaultField });
      onClose();
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors?.[0]?.message || 'Invalid input');
      } else {
        setError('Invalid input');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-2 p-6 relative animate-fade-in">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
        <h2 className="text-lg font-semibold mb-4">Add Column</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              required
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              name="type"
              value={form.type}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              {FieldTypeSchema.options.map((type) => (
                <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
              ))}
            </select>
          </div>
          {form.type === 'dropdown' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Options (comma separated)</label>
              <input
                name="options"
                value={form.options.join(', ')}
                onChange={handleOptionsChange}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
          )}
          {(form.type === 'images' || form.type === 'files') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Default Value (comma separated file names for placeholder only)</label>
              <input
                name="defaultValue"
                value={Array.isArray(form.defaultValue) ? form.defaultValue.join(', ') : ''}
                onChange={e => setForm(prev => ({ ...prev, defaultValue: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
          )}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="required"
              checked={form.required}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
            />
            <label className="text-sm text-gray-700">Required</label>
          </div>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors cursor-pointer"
            >
              Add Column
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 