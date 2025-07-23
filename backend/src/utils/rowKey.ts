/**
 * Generate a stable row key based on table data
 * This creates a deterministic hash of the row data to identify duplicates
 */
export function generateRowKey(tableId: number, data: Record<string, unknown>): string {
  // Create a stable string representation of the data
  const dataString = JSON.stringify(data, Object.keys(data).sort());
  
  // Create a simple hash of the tableId and data
  let hash = 0;
  const combined = `${tableId}:${dataString}`;
  
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return `row_${Math.abs(hash).toString(36)}`;
} 