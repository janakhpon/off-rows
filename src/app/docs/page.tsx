// API Docs Page: Airtable/Baserow style
import DocsClient from './DocsClient';
import { ApiService } from '@/lib/api';

interface TableDoc {
  id: number;
  name: string;
  description?: string;
}

// Use a type guard with a type assertion for object property access
function isTableDoc(t: unknown): t is TableDoc {
  return (
    typeof t === 'object' &&
    t !== null &&
    'id' in t &&
    'name' in t &&
    typeof (t as { name: unknown }).name === 'string'
  );
}

async function getTables(): Promise<TableDoc[]> {
  try {
    const tables = await ApiService.getTablesFromCloud();
    return tables
      .filter(isTableDoc)
      .map((t) => ({
        id: Number(t.id),
        name: String(t.name),
        description: t.description ? String(t.description) : '',
      }));
  } catch (error) {
    console.error('Failed to fetch tables:', error);
    return [];
  }
}

export default async function DocsPage() {
  const tables = await getTables();
  return <DocsClient tables={tables} />;
} 