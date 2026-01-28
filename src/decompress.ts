/**
 * Stratus Compression SDK - Decompression
 *
 * @purpose Main decompression function
 * @spec PRD.md#decompression-algorithm
 */

import { dequantize, reverseDelta } from './quantize/index.js';
import { huffmanDecode } from './entropy/index.js';
import { unpack } from './packing/index.js';

/**
 * Decompress a compressed vector
 *
 * @param compressed - Compressed vector (Uint8Array)
 * @returns Decompressed vector as Float32Array
 */
export function decompress(compressed: Uint8Array): Float32Array {
  // Step 1: Unpack binary
  const {
    centroid,
    precisionMap,
    codeLengths,
    encoded,
    dimensions,
    scale,
  } = unpack(compressed);

  // Step 2: Huffman decode
  const quantized = huffmanDecode(encoded, codeLengths, dimensions);

  // Step 3: Dequantize
  const normalized = dequantize(quantized, precisionMap);

  // Step 4: Reverse delta encoding (denormalize)
  const vector = reverseDelta(normalized, scale, centroid);

  return vector;
}

/**
 * Decompress multiple vectors in batch
 *
 * @param compressed - Array of compressed vectors
 * @returns Array of decompressed vectors
 */
export function decompressBatch(compressed: Uint8Array[]): Float32Array[] {
  return compressed.map(c => decompress(c));
}
