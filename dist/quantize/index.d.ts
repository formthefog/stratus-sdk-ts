/**
 * Quantization module
 *
 * @purpose Convert float32 vectors to quantized integers with adaptive precision
 * @spec SPEC.md#step-2-adaptive-quantization
 */
import { CompressionLevel } from '../types.js';
/**
 * Get precision map for given compression level and dimensions
 */
export declare function getPrecisionMap(dimensions: number, level: CompressionLevel): Uint8Array;
/**
 * Quantize a normalized vector using precision map
 */
export declare function quantize(normalized: Float32Array, precisionMap: Uint8Array): Uint8Array;
/**
 * Dequantize back to float32 using precision map
 */
export declare function dequantize(quantized: Uint8Array, precisionMap: Uint8Array): Float32Array;
/**
 * Compute centroid (mean) of vectors for delta encoding
 */
export declare function computeCentroid(vectors: Float32Array[]): Float32Array;
/**
 * Compute default centroid (all zeros) for single-vector compression
 */
export declare function getDefaultCentroid(dimensions: number): Float32Array;
/**
 * Apply delta encoding (subtract centroid, then normalize)
 */
export declare function applyDelta(vector: Float32Array | number[], centroid: Float32Array): {
    normalized: Float32Array;
    scale: number;
};
/**
 * Reverse delta encoding (denormalize, then add centroid)
 */
export declare function reverseDelta(normalized: Float32Array, scale: number, centroid: Float32Array): Float32Array;
