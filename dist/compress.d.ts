/**
 * Stratus Compression SDK - Compression
 *
 * @purpose Main compression function
 * @spec PRD.md#compression-algorithm
 */
import { CompressionOptions } from './types.js';
/**
 * Compress a vector embedding
 *
 * @param vector - Float32Array or number[] of embedding values
 * @param options - Compression options
 * @returns Compressed vector as Uint8Array
 */
export declare function compress(vector: Float32Array | number[], options?: CompressionOptions): Uint8Array;
/**
 * Compress multiple vectors in batch
 *
 * @param vectors - Array of vectors
 * @param options - Compression options
 * @returns Array of compressed vectors
 */
export declare function compressBatch(vectors: (Float32Array | number[])[], options?: CompressionOptions): Uint8Array[];
