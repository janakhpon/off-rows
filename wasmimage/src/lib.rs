// WASM Image Processing Library for Client-Side Usage
// This library provides image compression and format conversion capabilities
// that can be used directly in web browsers via WebAssembly.

use wasm_bindgen::prelude::*;
use image::{load_from_memory, GenericImageView, ImageFormat, DynamicImage};
use image::codecs::jpeg::JpegEncoder;
use image::codecs::png::PngEncoder;
use image::codecs::webp::WebPEncoder;
use image::ImageEncoder;
use web_sys::console;
use js_sys::Object;

// ============================================================================
// PUBLIC API - Functions exposed to JavaScript
// ============================================================================

/// Compress image to reduce file size with intelligent quality adjustment
/// 
/// # Arguments
/// * `input` - Raw image bytes from file input
/// * `format` - Target format: "jpeg", "jpg", or "png"
/// * `quality` - Quality setting (1-100)
/// 
/// # Returns
/// Compressed image bytes or error message
#[wasm_bindgen]
pub fn compress_image(input: &[u8], format: &str, quality: u8) -> Result<Box<[u8]>, JsValue> {
    console_error_panic_hook::set_once();
    console::log_1(&format!("🔄 Compressing image: {} bytes", input.len()).into());

    let img = load_from_memory(input)
        .map_err(|e| JsValue::from_str(&format!("Failed to decode image: {}", e)))?;

    let input_format = detect_image_format(input);
    let target_format = format.to_lowercase();

    let result = match target_format.as_str() {
        "jpeg" | "jpg" => compress_to_jpeg_advanced(&img, input_format, quality),
        "png" => compress_to_png_advanced(&img, input_format),
        _ => Err(JsValue::from_str("Unsupported format. Use 'jpeg' or 'png'.")),
    };

    log_compression_result(input.len(), &result);
    result
}

/// Convert image to WebP format with quality control
/// 
/// # Arguments
/// * `input` - Raw image bytes from file input
/// * `quality` - Quality setting (1-100)
/// 
/// # Returns
/// WebP image bytes or error message
#[wasm_bindgen]
pub fn convert_to_webp(input: &[u8], quality: u8) -> Result<Box<[u8]>, JsValue> {
    console_error_panic_hook::set_once();
    console::log_1(&format!("🔄 Converting to WebP: {} bytes", input.len()).into());

    let img = load_from_memory(input)
        .map_err(|e| JsValue::from_str(&format!("Failed to decode image: {}", e)))?;

    let input_format = detect_image_format(input);
    let result = compress_to_webp_advanced(&img, input_format, quality);

    log_compression_result(input.len(), &result);
    result
}

/// Get image information (dimensions, format, etc.)
/// 
/// # Arguments
/// * `input` - Raw image bytes from file input
/// 
/// # Returns
/// JavaScript object with image metadata
#[wasm_bindgen]
pub fn get_image_info(input: &[u8]) -> Result<JsValue, JsValue> {
    console_error_panic_hook::set_once();

    let img = load_from_memory(input)
        .map_err(|e| JsValue::from_str(&format!("Failed to decode image: {}", e)))?;

    let (width, height) = img.dimensions();
    let format = detect_image_format(input);
    let format_str = match format {
        Some(ImageFormat::Png) => "PNG",
        Some(ImageFormat::Jpeg) => "JPEG",
        Some(ImageFormat::WebP) => "WebP",
        _ => "Unknown"
    };

    let info = Object::new();
    js_sys::Reflect::set(&info, &"width".into(), &width.into())?;
    js_sys::Reflect::set(&info, &"height".into(), &height.into())?;
    js_sys::Reflect::set(&info, &"format".into(), &format_str.into())?;
    js_sys::Reflect::set(&info, &"size".into(), &input.len().into())?;
    js_sys::Reflect::set(&info, &"aspectRatio".into(), &(width as f64 / height as f64).into())?;

    Ok(info.into())
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/// Detect image format from file header
fn detect_image_format(data: &[u8]) -> Option<ImageFormat> {
    if data.len() < 8 {
        return None;
    }
    
    // PNG signature
    if data.starts_with(&[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]) {
        return Some(ImageFormat::Png);
    }
    
    // JPEG signature
    if data.starts_with(&[0xFF, 0xD8, 0xFF]) {
        return Some(ImageFormat::Jpeg);
    }
    
    // WebP signature
    if data.len() >= 12 && data[0..4] == [0x52, 0x49, 0x46, 0x46] && data[8..12] == [0x57, 0x45, 0x42, 0x50] {
        return Some(ImageFormat::WebP);
    }
    
    None
}

/// Log compression results for debugging
fn log_compression_result(input_size: usize, result: &Result<Box<[u8]>, JsValue>) {
    match result {
        Ok(output) => {
            let compression_ratio = (input_size as f64 / output.len() as f64) * 100.0;
            console::log_1(&format!("✅ Compression complete: {} → {} bytes ({:.1}% of original)", 
                input_size, output.len(), compression_ratio).into());
        }
        Err(e) => {
            console::log_1(&format!("❌ Compression failed: {}", e.as_string().unwrap_or_default()).into());
        }
    }
}

// ============================================================================
// COMPRESSION FUNCTIONS
// ============================================================================

/// Compress image to JPEG format with intelligent quality adjustment
fn compress_to_jpeg_advanced(img: &DynamicImage, input_format: Option<ImageFormat>, quality: u8) -> Result<Box<[u8]>, JsValue> {
    let mut out = Vec::new();
    let adjusted_quality = calculate_jpeg_quality(img, input_format, quality);
    
    let rgb_img = img.to_rgb8();
    let encoder = JpegEncoder::new_with_quality(&mut out, adjusted_quality);
    
    encoder
        .write_image(&rgb_img, rgb_img.width(), rgb_img.height(), image::ExtendedColorType::Rgb8)
        .map_err(|e| JsValue::from_str(&format!("JPEG encode error: {}", e)))?;
    
    Ok(out.into_boxed_slice())
}

/// Compress image to PNG format with optimized compression settings
fn compress_to_png_advanced(img: &DynamicImage, input_format: Option<ImageFormat>) -> Result<Box<[u8]>, JsValue> {
    let mut out = Vec::new();
    let (compression_type, filter_type) = calculate_png_compression_settings(img, input_format);
    
    let encoder = PngEncoder::new_with_quality(&mut out, compression_type, filter_type);
    let (width, height) = img.dimensions();
    let color = img.color();
    
    encoder
        .write_image(img.as_bytes(), width, height, color.into())
        .map_err(|e| JsValue::from_str(&format!("PNG encode error: {}", e)))?;
    
    Ok(out.into_boxed_slice())
}

/// Convert image to WebP format with quality control
fn compress_to_webp_advanced(img: &DynamicImage, input_format: Option<ImageFormat>, quality: u8) -> Result<Box<[u8]>, JsValue> {
    let mut out = Vec::new();
    let _adjusted_quality = calculate_webp_quality(img, input_format, quality);
    
    // Use lossless encoding for WebP since lossy is deprecated
    let encoder = WebPEncoder::new_lossless(&mut out);
    let (width, height) = img.dimensions();
    let color = img.color();
    
    encoder
        .write_image(img.as_bytes(), width, height, color.into())
        .map_err(|e| JsValue::from_str(&format!("WebP encode error: {}", e)))?;
    
    Ok(out.into_boxed_slice())
}

// ============================================================================
// QUALITY CALCULATION FUNCTIONS
// ============================================================================

/// Calculate optimal JPEG quality based on input format and image size
fn calculate_jpeg_quality(img: &DynamicImage, input_format: Option<ImageFormat>, quality: u8) -> u8 {
    let (width, height) = img.dimensions();
    let pixel_count = width * height;
    
    let base_quality = match input_format {
        Some(ImageFormat::Jpeg) => {
            let aggressive_quality = (quality as f32 * 0.6).clamp(5.0, 70.0) as u8;
            console::log_1(&format!("JPEG→JPEG: Original quality {}, adjusted to {}", quality, aggressive_quality).into());
            aggressive_quality
        }
        Some(ImageFormat::Png) => {
            let q = quality.clamp(15, 90);
            console::log_1(&format!("PNG→JPEG: Using quality {}", q).into());
            q
        }
        _ => {
            let q = quality.clamp(10, 95);
            console::log_1(&format!("Other→JPEG: Using quality {}", q).into());
            q
        }
    };
    
    let size_adjustment = if pixel_count > 2000000 { -5 } else if pixel_count > 1000000 { -2 } else if pixel_count < 100000 { 5 } else { 0 };
    let final_quality = (base_quality as i32 + size_adjustment).clamp(5, 95) as u8;
    
    console::log_1(&format!("Final JPEG quality: {} (size adjustment: {})", final_quality, size_adjustment).into());
    final_quality
}

/// Calculate optimal PNG compression settings based on input format and image size
fn calculate_png_compression_settings(img: &DynamicImage, input_format: Option<ImageFormat>) -> (image::codecs::png::CompressionType, image::codecs::png::FilterType) {
    let (width, height) = img.dimensions();
    let pixel_count = width * height;
    
    let (compression_type, filter_type) = match input_format {
        Some(ImageFormat::Png) => {
            console::log_1(&"PNG→PNG: Using maximum compression".into());
            (image::codecs::png::CompressionType::Best, image::codecs::png::FilterType::Adaptive)
        }
        Some(ImageFormat::Jpeg) => {
            console::log_1(&"JPEG→PNG: Using balanced compression".into());
            (image::codecs::png::CompressionType::Best, image::codecs::png::FilterType::NoFilter)
        }
        _ => {
            console::log_1(&"Other→PNG: Using default compression".into());
            (image::codecs::png::CompressionType::Best, image::codecs::png::FilterType::Adaptive)
        }
    };
    
    let final_filter_type = if pixel_count > 1000000 {
        image::codecs::png::FilterType::Adaptive
    } else {
        filter_type
    };
    
    console::log_1(&format!("PNG compression: {:?}, filter: {:?}", compression_type, final_filter_type).into());
    (compression_type, final_filter_type)
}

/// Calculate optimal WebP quality based on input format and image size
fn calculate_webp_quality(img: &DynamicImage, input_format: Option<ImageFormat>, quality: u8) -> u8 {
    let (width, height) = img.dimensions();
    let pixel_count = width * height;
    
    let base_quality = match input_format {
        Some(ImageFormat::WebP) => {
            let aggressive_quality = (quality as f32 * 0.7).clamp(10.0, 80.0) as u8;
            console::log_1(&format!("WebP→WebP: Original quality {}, adjusted to {}", quality, aggressive_quality).into());
            aggressive_quality
        }
        Some(ImageFormat::Jpeg) => {
            let q = quality.clamp(10, 85);
            console::log_1(&format!("JPEG→WebP: Using quality {}", q).into());
            q
        }
        Some(ImageFormat::Png) => {
            let q = quality.clamp(20, 90);
            console::log_1(&format!("PNG→WebP: Using quality {}", q).into());
            q
        }
        _ => {
            let q = quality.clamp(15, 90);
            console::log_1(&format!("Other→WebP: Using quality {}", q).into());
            q
        }
    };
    
    let size_adjustment = if pixel_count > 2000000 { -3 } else if pixel_count > 1000000 { -1 } else if pixel_count < 100000 { 3 } else { 0 };
    let final_quality = (base_quality as i32 + size_adjustment).clamp(10, 90) as u8;
    
    console::log_1(&format!("Final WebP quality: {} (size adjustment: {})", final_quality, size_adjustment).into());
    final_quality
}

