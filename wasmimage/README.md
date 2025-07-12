# WASM Image Processing Library

A high-performance WebAssembly library for client-side image compression and format conversion. This library provides efficient image processing capabilities that run directly in web browsers without server-side processing.

## Features

- **Image Compression**: Intelligent compression with format-specific optimizations
- **Format Conversion**: Convert between JPEG, PNG, and WebP formats
- **Quality Control**: Adaptive quality adjustment based on input format and image size
- **Client-Side Processing**: All processing happens in the browser using WebAssembly
- **Zero Dependencies**: No external server requirements

## Supported Formats

- **Input**: JPEG, PNG, WebP
- **Output**: JPEG, PNG, WebP
- **Quality Range**: 1-100 (format-dependent)

## Prerequisites

- Rust 1.70+ with Cargo
- `wasm-pack` for building WebAssembly
- Node.js (for integration with web projects)

## Installation

### 1. Install wasm-pack

```bash
cargo install wasm-pack
cargo check
cargo install 
cargo build
```

### 2. Build the WebAssembly module

```bash
# Build for web target
wasm-pack build --target web

# Or build for bundler (webpack, rollup, etc.)
wasm-pack build --target bundler
```

### 3. Integration with Web Projects

The built WASM module can be integrated into any web project. The output will be in the `pkg/` directory.

## API Reference

### `compress_image(input: Uint8Array, format: string, quality: number)`

Compresses an image with intelligent quality adjustment.

**Parameters:**
- `input`: Raw image bytes (Uint8Array)
- `format`: Target format ("jpeg", "jpg", or "png")
- `quality`: Quality setting (1-100)

**Returns:** Promise<Uint8Array> - Compressed image bytes

**Example:**
```javascript
import init, { compress_image } from './pkg/wasmimage.js';

await init();
const compressed = await compress_image(imageBytes, "jpeg", 80);
```

### `convert_to_webp(input: Uint8Array, quality: number)`

Converts an image to WebP format.

**Parameters:**
- `input`: Raw image bytes (Uint8Array)
- `quality`: Quality setting (1-100)

**Returns:** Promise<Uint8Array> - WebP image bytes

**Example:**
```javascript
import init, { convert_to_webp } from './pkg/wasmimage.js';

await init();
const webpImage = await convert_to_webp(imageBytes, 85);
```

### `get_image_info(input: Uint8Array)`

Extracts metadata from an image.

**Parameters:**
- `input`: Raw image bytes (Uint8Array)

**Returns:** Promise<Object> - Image metadata

**Example:**
```javascript
import init, { get_image_info } from './pkg/wasmimage.js';

await init();
const info = await get_image_info(imageBytes);
console.log(`Image: ${info.width}x${info.height}, Format: ${info.format}, Size: ${info.size} bytes`);
```

## Usage Examples

### Basic Image Compression

```javascript
import init, { compress_image } from './pkg/wasmimage.js';

async function compressImage(file) {
    await init();
    
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    try {
        const compressed = await compress_image(uint8Array, "jpeg", 75);
        console.log(`Compressed from ${file.size} to ${compressed.length} bytes`);
        return compressed;
    } catch (error) {
        console.error('Compression failed:', error);
    }
}
```

### Format Conversion

```javascript
import init, { convert_to_webp } from './pkg/wasmimage.js';

async function convertToWebP(file) {
    await init();
    
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    try {
        const webpImage = await convert_to_webp(uint8Array, 90);
        return new Blob([webpImage], { type: 'image/webp' });
    } catch (error) {
        console.error('WebP conversion failed:', error);
    }
}
```

### Image Information Extraction

```javascript
import init, { get_image_info } from './pkg/wasmimage.js';

async function getImageInfo(file) {
    await init();
    
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    try {
        const info = await get_image_info(uint8Array);
        return {
            width: info.width,
            height: info.height,
            format: info.format,
            size: info.size,
            aspectRatio: info.aspectRatio
        };
    } catch (error) {
        console.error('Failed to get image info:', error);
    }
}
```

## Quality Optimization

The library automatically adjusts quality settings based on:

- **Input Format**: Different strategies for JPEG→JPEG vs PNG→JPEG
- **Image Size**: Larger images get more aggressive compression
- **Target Format**: Format-specific optimization strategies

### Quality Adjustment Examples

- **JPEG→JPEG**: 60% of original quality (aggressive recompression)
- **PNG→JPEG**: Balanced quality (15-90 range)
- **Large Images**: Additional 2-5% quality reduction
- **Small Images**: Additional 3-5% quality boost

## Development

### Building for Development

```bash
# Build with debug information
wasm-pack build --target web --dev

# Build with optimizations
wasm-pack build --target web --release
```

### Testing

```bash
# Run tests
cargo test

# Run tests with WASM target
wasm-pack test --headless --firefox
```

### Project Structure

```
wasmimage/
├── src/
│   └── lib.rs          # Main library code
├── Cargo.toml          # Dependencies and configuration
├── README.md           # This file
└── pkg/                # Generated WASM output (after build)
```

## Performance Considerations

- **Memory Usage**: Large images may require significant memory
- **Processing Time**: Complex images may take several seconds
- **Browser Support**: Requires WebAssembly support (all modern browsers)

## Browser Compatibility

- Chrome 57+
- Firefox 52+
- Safari 11+
- Edge 16+

## License

This project is part of the OffRows application. See the main project license for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Troubleshooting

### Common Issues

1. **"Failed to decode image"**: Check if the input is a valid image file
2. **"Unsupported format"**: Ensure the target format is "jpeg", "jpg", or "png"
3. **Memory errors**: Try processing smaller images or reducing quality

### Debug Mode

Enable debug logging by checking the browser console for detailed processing information.
