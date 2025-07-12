'use client';

import React, { useState, useEffect } from 'react';
import { useTables } from '@/app/contexts/TableContext';
import { useNotifications } from '@/app/contexts/NotificationContext';
import { SQLGenerator } from '@/lib/sql-generator';
import { Table } from '@/lib/schemas';

export default function SQLGeneratorDemo() {
  const { tables } = useTables();
  const { showNotification } = useNotifications();
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [generatedSQL, setGeneratedSQL] = useState<string>('');

  useEffect(() => {
    if (selectedTable) {
      const sql = SQLGenerator.generateCreateTableSQL(selectedTable);
      setGeneratedSQL(sql);
    }
  }, [selectedTable]);

  const generateCompleteSchema = () => {
    const completeSchema = SQLGenerator.generateCompleteDatabaseSchema(tables);
    setGeneratedSQL(completeSchema);
  };

  const generateSampleData = () => {
    if (!selectedTable) return;

    // Generate sample INSERT statements
    const sampleData = [
      { taskName: 'Sample Task 1', status: 'In Progress', priority: 'High' },
      { taskName: 'Sample Task 2', status: 'Completed', priority: 'Medium' },
    ];

    const insertStatements = sampleData
      .map((data) => SQLGenerator.generateInsertSQL(selectedTable, data))
      .join('\n\n');

    setGeneratedSQL(insertStatements);
  };

  return (
    <div className="p-6 mx-auto max-w-4xl">
      <h1 className="mb-6 text-2xl font-bold">SQL Schema Generator Demo</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left Panel - Table Selection */}
        <div className="space-y-4">
          <div>
            <h2 className="mb-3 text-lg font-semibold">Select a Table</h2>
            <div className="space-y-2">
              {tables.map((table) => (
                <button
                  key={table.id}
                  onClick={() => setSelectedTable(table)}
                  className={`w-full p-3 text-left rounded-lg border transition-colors ${
                    selectedTable?.id === table.id
                      ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-700'
                      : 'bg-white border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="font-medium">{table.name}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {table.fields.length} fields
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-lg font-semibold">Generate Options</h2>
            <div className="space-y-2">
              <button
                onClick={() =>
                  selectedTable &&
                  setGeneratedSQL(SQLGenerator.generateCreateTableSQL(selectedTable))
                }
                disabled={!selectedTable}
                className="p-2 w-full text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Generate CREATE TABLE
              </button>

              <button
                onClick={generateSampleData}
                disabled={!selectedTable}
                className="p-2 w-full text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Generate Sample INSERT
              </button>

              <button
                onClick={generateCompleteSchema}
                className="p-2 w-full text-white bg-purple-600 rounded hover:bg-purple-700"
              >
                Generate Complete Schema
              </button>
            </div>
          </div>

          {selectedTable && (
            <div>
              <h2 className="mb-3 text-lg font-semibold">Table Schema</h2>
              <div className="p-4 bg-gray-50 rounded-lg dark:bg-gray-800">
                <h3 className="mb-2 font-medium">{selectedTable.name}</h3>
                <div className="space-y-1 text-sm">
                  {selectedTable.fields.map((field) => (
                    <div key={field.id} className="flex justify-between">
                      <span className="font-mono">{field.id}</span>
                      <span className="text-gray-500 dark:text-gray-400">{field.type}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Generated SQL */}
        <div>
          <h2 className="mb-3 text-lg font-semibold">Generated SQL</h2>
          <div className="overflow-auto p-4 max-h-96 text-green-400 bg-gray-900 rounded-lg">
            <pre className="text-sm whitespace-pre-wrap">
              {generatedSQL || 'Select a table and generate SQL to see the output...'}
            </pre>
          </div>

          {generatedSQL && (
            <div className="mt-4">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generatedSQL);
                  showNotification({
                    type: 'success',
                    title: 'SQL copied to clipboard!',
                    message: 'The generated SQL has been copied to your clipboard.',
                  });
                }}
                className="px-4 py-2 text-white bg-gray-600 rounded hover:bg-gray-700 cursor-pointer"
              >
                Copy to Clipboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
