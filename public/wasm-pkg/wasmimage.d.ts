/* tslint:disable */
/* eslint-disable */
/**
 * Compress image to reduce file size with intelligent quality adjustment
 * 
 * # Arguments
 * * `input` - Raw image bytes from file input
 * * `format` - Target format: "jpeg", "jpg", or "png"
 * * `quality` - Quality setting (1-100)
 * 
 * # Returns
 * Compressed image bytes or error message
 */
export function compress_image(input: Uint8Array, format: string, quality: number): Uint8Array;
/**
 * Convert image to WebP format with quality control
 * 
 * # Arguments
 * * `input` - Raw image bytes from file input
 * * `quality` - Quality setting (1-100)
 * 
 * # Returns
 * WebP image bytes or error message
 */
export function convert_to_webp(input: Uint8Array, quality: number): Uint8Array;
/**
 * Get image information (dimensions, format, etc.)
 * 
 * # Arguments
 * * `input` - Raw image bytes from file input
 * 
 * # Returns
 * JavaScript object with image metadata
 */
export function get_image_info(input: Uint8Array): any;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly compress_image: (a: number, b: number, c: number, d: number, e: number) => [number, number, number, number];
  readonly convert_to_webp: (a: number, b: number, c: number) => [number, number, number, number];
  readonly get_image_info: (a: number, b: number) => [number, number, number];
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly __wbindgen_exn_store: (a: number) => void;
  readonly __externref_table_alloc: () => number;
  readonly __wbindgen_export_3: WebAssembly.Table;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __externref_table_dealloc: (a: number) => void;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
