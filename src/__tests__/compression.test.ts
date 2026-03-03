/**
 * Compression Tests
 *
 * @purpose Tests for compress/decompress core functionality
 */

import { describe, it, expect } from 'vitest';
import { compress, compressBatch } from '../compress.js';
import { decompress, decompressBatch } from '../decompress.js';
import { CompressionLevel } from '../types.js';
import { cosineSimilarity } from '../quality/metrics.js';
import { randomNormalizedVector } from './helpers.js';

function toFloat32Array(v: number[]): Float32Array {
  return new Float32Array(v);
}

describe('compress', () => {
  it('returns a Uint8Array', () => {
    const vec = randomNormalizedVector(128);
    const result = compress(vec);
    expect(result).toBeInstanceOf(Uint8Array);
  });

  it('accepts Float32Array input', () => {
    const vec = new Float32Array(randomNormalizedVector(128));
    const result = compress(vec);
    expect(result).toBeInstanceOf(Uint8Array);
  });

  it('output is smaller than the JSON string representation', () => {
    // The SDK compresses relative to JSON (text) encoding, not raw binary float32.
    // JSON-encoded float arrays are typically 8-12 bytes per value (e.g. "0.123456,").
    // We use a conservative 7 bytes/value as the lower-bound baseline.
    const dims = 1536;
    const vec = randomNormalizedVector(dims);
    const compressed = compress(vec);
    const jsonBytes = JSON.stringify(vec).length;
    expect(compressed.byteLength).toBeLessThan(jsonBytes);
  });

  it('produces non-empty output', () => {
    const vec = randomNormalizedVector(64);
    const compressed = compress(vec);
    expect(compressed.byteLength).toBeGreaterThan(0);
  });
});

describe('compressBatch', () => {
  it('returns same number of compressed vectors as input', () => {
    const vectors = Array.from({ length: 5 }, () => randomNormalizedVector(128));
    const results = compressBatch(vectors);
    expect(results).toHaveLength(5);
  });

  it('each result is a Uint8Array', () => {
    const vectors = Array.from({ length: 3 }, () => randomNormalizedVector(64));
    const results = compressBatch(vectors);
    for (const r of results) {
      expect(r).toBeInstanceOf(Uint8Array);
    }
  });

  it('handles empty input array', () => {
    const results = compressBatch([]);
    expect(results).toHaveLength(0);
  });
});

describe('decompress', () => {
  it('returns a Float32Array', () => {
    const vec = randomNormalizedVector(128);
    const compressed = compress(vec);
    const result = decompress(compressed);
    expect(result).toBeInstanceOf(Float32Array);
  });
});

describe('compress → decompress round-trip', () => {
  it('decompressed vector has same dimensions as input (128-dim)', () => {
    const dims = 128;
    const vec = randomNormalizedVector(dims);
    const compressed = compress(vec, { level: CompressionLevel.Low });
    const restored = decompress(compressed);
    expect(restored.length).toBe(dims);
  });

  it('decompressed vector has same dimensions as input (512-dim)', () => {
    const dims = 512;
    const vec = randomNormalizedVector(dims);
    const compressed = compress(vec, { level: CompressionLevel.Low });
    const restored = decompress(compressed);
    expect(restored.length).toBe(dims);
  });

  it('decompressed vector has same dimensions as input (768-dim)', () => {
    const dims = 768;
    const vec = randomNormalizedVector(dims);
    const compressed = compress(vec, { level: CompressionLevel.Low });
    const restored = decompress(compressed);
    expect(restored.length).toBe(dims);
  });

  it('decompressed vector has same dimensions as input (1536-dim)', () => {
    const dims = 1536;
    const vec = randomNormalizedVector(dims);
    const compressed = compress(vec, { level: CompressionLevel.Low });
    const restored = decompress(compressed);
    expect(restored.length).toBe(dims);
  });

  it('cosine similarity > 0.99 for Low compression level (128-dim)', () => {
    const vec = randomNormalizedVector(128);
    const compressed = compress(vec, { level: CompressionLevel.Low });
    const restored = decompress(compressed);
    const sim = cosineSimilarity(toFloat32Array(vec), restored);
    expect(sim).toBeGreaterThan(0.99);
  });

  it('cosine similarity > 0.99 for Low compression level (1536-dim)', () => {
    const vec = randomNormalizedVector(1536);
    const compressed = compress(vec, { level: CompressionLevel.Low });
    const restored = decompress(compressed);
    const sim = cosineSimilarity(toFloat32Array(vec), restored);
    expect(sim).toBeGreaterThan(0.99);
  });

  it('cosine similarity > 0.95 for Medium compression level (512-dim)', () => {
    const vec = randomNormalizedVector(512);
    const compressed = compress(vec, { level: CompressionLevel.Medium });
    const restored = decompress(compressed);
    const sim = cosineSimilarity(toFloat32Array(vec), restored);
    expect(sim).toBeGreaterThan(0.95);
  });
});

describe('compressBatch → decompressBatch round-trip', () => {
  it('returns same number of vectors as input', () => {
    const vectors = Array.from({ length: 4 }, () => randomNormalizedVector(128));
    const compressed = compressBatch(vectors, { level: CompressionLevel.Low });
    const restored = decompressBatch(compressed);
    expect(restored).toHaveLength(4);
  });

  it('each restored vector has correct dimensions', () => {
    const dims = 256;
    const vectors = Array.from({ length: 3 }, () => randomNormalizedVector(dims));
    const compressed = compressBatch(vectors, { level: CompressionLevel.Low });
    const restored = decompressBatch(compressed);
    for (const r of restored) {
      expect(r.length).toBe(dims);
    }
  });

  it('each restored vector maintains high cosine similarity', () => {
    const dims = 256;
    const vectors = Array.from({ length: 3 }, () => randomNormalizedVector(dims));
    const compressed = compressBatch(vectors, { level: CompressionLevel.Low });
    const restored = decompressBatch(compressed);
    for (let i = 0; i < vectors.length; i++) {
      const sim = cosineSimilarity(toFloat32Array(vectors[i]), restored[i]);
      expect(sim).toBeGreaterThan(0.99);
    }
  });
});
