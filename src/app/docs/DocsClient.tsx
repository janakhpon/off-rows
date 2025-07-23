"use client";

import { useState } from "react";

interface TableDoc {
  id: number;
  name: string;
  description?: string;
}

export default function DocsClient({ tables }: { tables: TableDoc[] }) {
  const [selected, setSelected] = useState(0);

  function renderEndpoints(table?: TableDoc) {
    if (!table) return null;
    const tableId = table.id;
    const base = `/api/tables/${tableId}`;
    return (
      <div style={{ marginLeft: 24 }}>
        <h2 style={{ fontWeight: 600 }}>{table.name}</h2>
        <p>{table.description}</p>
        <ul style={{ marginTop: 16 }}>
          <li><b>GET</b> {base}/rows <span style={{ color: '#888' }}>List all rows</span></li>
          <li><b>POST</b> {base}/rows <span style={{ color: '#888' }}>Create a new row</span></li>
          <li><b>GET</b> {base}/views <span style={{ color: '#888' }}>List all views</span></li>
          <li><b>POST</b> {base}/views <span style={{ color: '#888' }}>Create a new view</span></li>
          <li><b>PUT</b> {base} <span style={{ color: '#888' }}>Update table</span></li>
          <li><b>DELETE</b> {base} <span style={{ color: '#888' }}>Delete table</span></li>
        </ul>
        <div style={{ marginTop: 24 }}>
          <b>Example: List all rows</b>
          <pre style={{ background: '#f6f8fa', padding: 12, borderRadius: 6 }}>
            {`curl -X GET ${base}/rows`}
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#fff' }}>
      <aside style={{ width: 260, borderRight: '1px solid #eee', padding: 24, background: '#fafbfc' }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>API Docs</h1>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {tables.map((table, i) => (
            <li key={table.id} style={{ marginBottom: 12 }}>
              <button
                style={{
                  background: i === selected ? '#e6f7ff' : 'transparent',
                  border: 'none',
                  padding: '8px 12px',
                  borderRadius: 4,
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'left',
                  fontWeight: i === selected ? 600 : 400,
                }}
                onClick={() => setSelected(i)}
              >
                {table.name}
              </button>
            </li>
          ))}
        </ul>
      </aside>
      <main style={{ flex: 1, padding: 32, overflowY: 'auto' }}>
        {tables.length > 0 ? renderEndpoints(tables[selected]) : <p>No tables found.</p>}
      </main>
    </div>
  );
} 