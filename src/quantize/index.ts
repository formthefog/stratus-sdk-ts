/**
 * Quantization module
 *
 * @purpose Convert float32 vectors to quantized integers with adaptive precision
 * @spec SPEC.md#step-2-adaptive-quantization
 */

import { clamp } from '../utils/math.js';
import { CompressionLevel } from '../types.js';

/**
 * Get precision map for given compression level and dimensions
 */
export function getPrecisionMap(dimensions: number, level: CompressionLevel): Uint8Array {
  const map = new Uint8Array(dimensions);

  switch (level) {
    case CompressionLevel.Low: // 5x compression
      // All 8-bit for maximum quality
      map.fill(8);
      break;

    case CompressionLevel.Medium: // 10x compression
      // Mixed precision: 8-bit for first 256, 6-bit for next 512, 4-bit for rest
      for (let i = 0; i < dimensions; i++) {
        if (i < 256) {
          map[i] = 8;
        } else if (i < 768) {
          map[i] = 6;
        } else {
          map[i] = 4;
        }
      }
      break;

    case CompressionLevel.High: // 15x compression
      // 6-bit for first 512, 4-bit for rest
      for (let i = 0; i < dimensions; i++) {
        if (i < 512) {
          map[i] = 6;
        } else {
          map[i] = 4;
        }
      }
      break;

    case CompressionLevel.VeryHigh: // 20x compression
      // All 4-bit
      map.fill(4);
      break;
  }

  return map;
}

/**
 * Quantize a normalized vector using precision map
 */
export function quantize(
  normalized: Float32Array,
  precisionMap: Uint8Array
): Uint8Array {
  const quantized = new Uint8Array(normalized.length);

  for (let i = 0; i < normalized.length; i++) {
    const bits = precisionMap[i];
    const levels = (1 << bits) - 1; // 2^bits - 1

    // Map [-1, 1] to [0, levels]
    const value = (normalized[i] + 1) / 2;
    const quantizedValue = Math.round(value * levels);

    quantized[i] = clamp(quantizedValue, 0, levels);
  }

  return quantized;
}

/**
 * Dequantize back to float32 using precision map
 */
export function dequantize(
  quantized: Uint8Array,
  precisionMap: Uint8Array
): Float32Array {
  const dequantized = new Float32Array(quantized.length);

  for (let i = 0; i < quantized.length; i++) {
    const bits = precisionMap[i];
    const levels = (1 << bits) - 1; // 2^bits - 1

    // Map [0, levels] back to [-1, 1]
    const value = quantized[i] / levels;
    dequantized[i] = value * 2 - 1;
  }

  return dequantized;
}

/**
 * Compute centroid (mean) of vectors for delta encoding
 */
export function computeCentroid(vectors: Float32Array[]): Float32Array {
  if (vectors.length === 0) {
    throw new Error('Cannot compute centroid of empty array');
  }

  const dimensions = vectors[0].length;
  const centroid = new Float32Array(dimensions);

  for (const vector of vectors) {
    for (let i = 0; i < dimensions; i++) {
      centroid[i] += vector[i];
    }
  }

  for (let i = 0; i < dimensions; i++) {
    centroid[i] /= vectors.length;
  }

  return centroid;
}

/**
 * Compute default centroid (all zeros) for single-vector compression
 */
export function getDefaultCentroid(dimensions: number): Float32Array {
  return new Float32Array(dimensions);
}

/**
 * Apply delta encoding (subtract centroid, then normalize)
 */
export function applyDelta(
  vector: Float32Array | number[],
  centroid: Float32Array
): { normalized: Float32Array; scale: number } {
  const delta = new Float32Array(vector.length);

  // Subtract centroid
  for (let i = 0; i < vector.length; i++) {
    delta[i] = vector[i] - centroid[i];
  }

  // Find scale (max absolute value)
  let scale = 0;
  for (let i = 0; i < delta.length; i++) {
    const abs = Math.abs(delta[i]);
    if (abs > scale) scale = abs;
  }

  // Avoid division by zero
  if (scale === 0) scale = 1;

  // Normalize to [-1, 1]
  const normalized = new Float32Array(delta.length);
  for (let i = 0; i < delta.length; i++) {
    normalized[i] = delta[i] / scale;
  }

  return { normalized, scale };
}

/**
 * Reverse delta encoding (denormalize, then add centroid)
 */
export function reverseDelta(
  normalized: Float32Array,
  scale: number,
  centroid: Float32Array
): Float32Array {
  const vector = new Float32Array(normalized.length);

  // Denormalize
  for (let i = 0; i < normalized.length; i++) {
    const denorm = normalized[i] * scale;
    vector[i] = denorm + centroid[i];
  }

  return vector;
}
