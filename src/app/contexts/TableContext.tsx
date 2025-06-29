'use client';

import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useAppStore } from '@/lib/store';
import { Table } from '@/lib/schemas';

interface TableContextType {
  tables: Table[];
  activeTable: Table | null;
  setActiveTable: (table: Table | null) => void;
  loading: boolean;
  refreshTables: () => Promise<void>;
}

const TableContext = createContext<TableContextType | undefined>(undefined);

export function TableProvider({ children }: { children: ReactNode }) {
  const {
    tables,
    activeTable,
    setActiveTable,
    loading,
    refreshTables,
    initialize,
  } = useAppStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  const value = {
    tables,
    activeTable,
    setActiveTable,
    loading,
    refreshTables,
  };

  return (
    <TableContext.Provider value={value}>
      {children}
    </TableContext.Provider>
  );
}

export function useTables() {
  const context = useContext(TableContext);
  if (context === undefined) {
    throw new Error('useTables must be used within a TableProvider');
  }
  return context;
} 