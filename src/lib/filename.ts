export function generateUniqueFilename(ext: string) {
  return `${crypto.randomUUID()}.${ext}`;
}
