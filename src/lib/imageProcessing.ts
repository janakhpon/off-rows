import init, { compress_image, convert_to_webp } from '../../public/wasm-pkg/wasmimage.js';

export async function processImage(input: Uint8Array, convertToWebP: boolean, quality: number[]) {
  await init();
  const q = quality[0] ?? 80;
  let result: Uint8Array;
  if (convertToWebP) {
    // Compress first, then convert to webp
    const compressed = await compress_image(input, 'jpeg', q);
    result = await convert_to_webp(compressed, q);
  } else {
    result = await compress_image(input, 'jpeg', q);
  }
  return result;
}
