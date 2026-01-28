/**
 * Stratus Compression SDK - Compression
 *
 * @purpose Main compression function
 * @spec PRD.md#compression-algorithm
 */

import { CompressionLevel, CompressionOptions } from './types.js';
import {
  getPrecisionMap,
  quantize,
  applyDelta,
  getDefaultCentroid,
} from './quantize/index.js';
import { huffmanEncode } from './entropy/index.js';
import { pack } from './packing/index.js';
import { getOpenAIProfile, detectOpenAI } from './profiles/openai.js';

/**
 * Compress a vector embedding
 *
 * @param vector - Float32Array or number[] of embedding values
 * @param options - Compression options
 * @returns Compressed vector as Uint8Array
 */
export function compress(
  vector: Float32Array | number[],
  options: CompressionOptions = {}
): Uint8Array {
  const level = options.level ?? CompressionLevel.Medium;

  // Convert to Float32Array if needed
  const vec = vector instanceof Float32Array ? vector : new Float32Array(vector);
  const dimensions = vec.length;

  // Step 1: Delta encoding (center & scale)
  const centroid = getDefaultCentroid(dimensions);
  const { normalized, scale } = applyDelta(vec, centroid);

  // Step 2: Adaptive quantization
  let precisionMap: Uint8Array;

  if (options.precisionMap) {
    // Use custom precision map
    precisionMap = options.precisionMap;
  } else if (options.profile === 'openai' || (options.profile === 'auto' && detectOpenAI(vec))) {
    // Use OpenAI-specific profile
    const profile = getOpenAIProfile(level);
    precisionMap = profile.precisionMap;
  } else {
    // Use generic precision map
    precisionMap = getPrecisionMap(dimensions, level);
  }

  const quantized = quantize(normalized, precisionMap);

  // Step 3: Entropy coding (Huffman)
  const { encoded, codeLengths } = huffmanEncode(quantized);

  // Step 4: Binary packing
  const compressed = pack(centroid, precisionMap, codeLengths, encoded, level, scale);

  return compressed;
}

/**
 * Compress multiple vectors in batch
 *
 * @param vectors - Array of vectors
 * @param options - Compression options
 * @returns Array of compressed vectors
 */
export function compressBatch(
  vectors: (Float32Array | number[])[],
  options: CompressionOptions = {}
): Uint8Array[] {
  return vectors.map(v => compress(v, options));
}
