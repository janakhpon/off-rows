import init, { compress_image, convert_to_webp } from '../../public/wasm-pkg/wasmimage.js';

export async function processImage(input: Uint8Array, convertToWebP: boolean, quality: number[]) {
  await init();
  const q = quality[0] ?? 80;
  let result: Uint8Array;
  
  if (convertToWebP) {
    // For WebP conversion, we need to be more careful about when to convert
    // Only convert if the original is not already well-compressed
    result = await convert_to_webp(input, q);
  } else {
    // Compress to JPEG only
    result = await compress_image(input, 'jpeg', q);
  }
  return result;
}

// Helper function to determine if WebP conversion would be beneficial
export async function shouldConvertToWebP(input: Uint8Array): Promise<boolean> {
  await init();
  
  // Check if input is already WebP
  if (input.length >= 12 && 
      input[0] === 0x52 && input[1] === 0x49 && input[2] === 0x46 && input[3] === 0x46 &&
      input[8] === 0x57 && input[9] === 0x45 && input[10] === 0x42 && input[11] === 0x50) {
    return false; // Already WebP
  }
  
  // Check if input is already well-compressed JPEG
  if (input.length >= 3 && input[0] === 0xFF && input[1] === 0xD8 && input[2] === 0xFF) {
    // For JPEG, only convert if file is large (>500KB)
    return input.length > 500 * 1024;
  }
  
  // For other formats (PNG, etc.), WebP conversion is usually beneficial
  return true;
}
