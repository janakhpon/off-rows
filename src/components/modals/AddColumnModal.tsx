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
    <div className="flex fixed inset-0 z-50 justify-center items-center bg-black bg-opacity-40">
      <div className="relative p-6 mx-2 w-full max-w-md bg-white rounded-lg shadow-lg animate-fade-in">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 text-gray-400 transition-colors cursor-pointer hover:text-gray-700"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
        <h2 className="mb-4 text-lg font-semibold">Add Column</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">Name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="px-3 py-2 w-full text-sm rounded border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
              required
              autoFocus
            />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">Type</label>
            <select
              name="type"
              value={form.type}
              onChange={handleChange}
              className="px-3 py-2 w-full text-sm rounded border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
            >
              {FieldTypeSchema.options.map((type) => (
                <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
              ))}
            </select>
          </div>
          {form.type === 'dropdown' && (
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">Options (comma separated)</label>
              <input
                name="options"
                value={form.options.join(', ')}
                onChange={handleOptionsChange}
                className="px-3 py-2 w-full text-sm rounded border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}
          {(form.type === 'images' || form.type === 'files') && (
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">Default Value (comma separated file names for placeholder only)</label>
              <input
                name="defaultValue"
                value={Array.isArray(form.defaultValue) ? form.defaultValue.join(', ') : ''}
                onChange={e => setForm(prev => ({ ...prev, defaultValue: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
                className="px-3 py-2 w-full text-sm rounded border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="required"
              checked={form.required}
              onChange={handleChange}
              className="w-4 h-4 text-blue-600 rounded border-gray-300"
            />
            <label className="text-sm text-gray-700">Required</label>
          </div>
          {error && <div className="text-sm text-red-600">{error}</div>}
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 text-white bg-blue-600 rounded transition-colors cursor-pointer hover:bg-blue-700"
            >
              Add Column
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 