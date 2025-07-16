'use client';

import { useState, useEffect } from 'react';
import { FieldSchema, FieldTypeSchema } from '@/lib/schemas';
import { z } from 'zod';
import { X, Settings, Type, Hash, Calendar, ToggleLeft, List, Image, FileText, FileImage } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Field } from '@/lib/schemas';

interface EditColumnModalProps {
  open: boolean;
  onClose: () => void;
  onEditColumn?: (field: z.infer<typeof FieldSchema>) => void;
  column?: Field;
}

const defaultField: {
  id: string;
  name: string;
  type: import('@/lib/schemas').Field['type'];
  required: boolean;
  options: string[];
  defaultValue: string;
} = {
  id: '',
  name: '',
  type: 'text',
  required: false,
  options: [],
  defaultValue: '',
};

export default function EditColumnModal({ open, onClose, onEditColumn, column }: EditColumnModalProps) {
  const [form, setForm] = useState<typeof defaultField>({ ...defaultField });
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens with column data
  useEffect(() => {
    if (open && column) {
      setForm({
        id: column.id,
        name: column.name,
        type: column.type,
        required: column.required || false,
        options: column.options || [],
        defaultValue: typeof column.defaultValue === 'string' || typeof column.defaultValue === 'number' || typeof column.defaultValue === 'boolean' || column.defaultValue == null
          ? String(column.defaultValue ?? '')
          : Array.isArray(column.defaultValue)
            ? column.defaultValue.map(f => typeof f === 'string' ? f : f.name).join(', ')
            : '',
      });
      setError(null);
    }
  }, [open, column]);

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
      options: e.target.value
        .split(',')
        .map((opt) => opt.trim())
        .filter(Boolean),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      let parsedDefaultValue: unknown = undefined;
      if (form.defaultValue !== '') {
        if (form.type === 'number') {
          parsedDefaultValue = Number(form.defaultValue);
        } else if (form.type === 'boolean') {
          parsedDefaultValue = form.defaultValue === 'true';
        } else if (form.type === 'images' || form.type === 'files') {
          parsedDefaultValue = form.defaultValue
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
        } else {
          parsedDefaultValue = form.defaultValue;
        }
      }
      const field = FieldSchema.parse({
        ...form,
        id: form.id, // Keep original ID
        options: form.type === 'dropdown' ? form.options : undefined,
        defaultValue: parsedDefaultValue,
      });
      if (onEditColumn) onEditColumn(field);
      onClose();
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors?.[0]?.message || 'Invalid input');
      } else {
        setError('Invalid input');
      }
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'text':
        return <Type className="w-4 h-4" />;
      case 'number':
        return <Hash className="w-4 h-4" />;
      case 'date':
        return <Calendar className="w-4 h-4" />;
      case 'boolean':
        return <ToggleLeft className="w-4 h-4" />;
      case 'dropdown':
        return <List className="w-4 h-4" />;
      case 'image':
        return <Image className="w-4 h-4" />;
      case 'images':
        return <FileImage className="w-4 h-4" />;
      case 'file':
        return <FileText className="w-4 h-4" />;
      case 'files':
        return <FileText className="w-4 h-4" />;
      default:
        return <Settings className="w-4 h-4" />;
    }
  };

  return (
    <div className="flex fixed inset-0 z-50 justify-center items-center bg-black bg-opacity-40">
      <div className="relative p-6 mx-2 w-full max-w-md bg-white rounded-lg shadow-lg dark:bg-gray-800 animate-fade-in">
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
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Edit Column</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Modify column properties
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
              Column Name
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="px-3 py-2 w-full text-sm text-gray-900 bg-white rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
              Column Type
            </label>
            <div className="relative">
              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                className="px-3 py-2 w-full text-sm text-gray-900 bg-white rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
              >
                {FieldTypeSchema.options.map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 text-gray-400 transform -translate-y-1/2">
                {getTypeIcon(form.type)}
              </div>
            </div>
          </div>

          {form.type === 'dropdown' && (
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                Options (comma separated)
              </label>
              <input
                name="options"
                value={Array.isArray(form.options) ? form.options.join(', ') : ''}
                onChange={handleOptionsChange}
                className="px-3 py-2 w-full text-sm text-gray-900 bg-white rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
                placeholder="Option 1, Option 2, Option 3"
              />
            </div>
          )}

          {(form.type === 'images' || form.type === 'files') && (
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                Default Value (comma separated file names for placeholder only)
              </label>
              <input
                name="defaultValue"
                value={form.defaultValue}
                onChange={(e) => setForm((prev) => ({ ...prev, defaultValue: e.target.value }))}
                className="px-3 py-2 w-full text-sm text-gray-900 bg-white rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
              />
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Checkbox
              name="required"
              checked={form.required}
              onCheckedChange={(checked) => setForm((prev) => ({ ...prev, required: !!checked }))}
            />
            <label className="text-sm text-gray-700 dark:text-gray-300">Required field</label>
          </div>

          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="flex justify-end pt-4 space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg transition-colors duration-200 cursor-pointer dark:text-gray-300 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center px-4 py-2 space-x-2 text-white bg-blue-600 rounded-lg transition-colors duration-200 cursor-pointer dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600"
            >
              <Settings className="w-4 h-4" />
              <span>Update Column</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 