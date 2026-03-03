/**
 * Quality Analysis Tests
 *
 * @purpose Tests for quality metrics and analysis tools
 */

import { describe, it, expect } from 'vitest';
import { cosineSimilarity, euclideanDistance } from '../quality/metrics.js';
import { recallAtK } from '../quality/ranking.js';
import { analyzeQuality } from '../quality/analyzer.js';
import { randomNormalizedVector } from './helpers.js';

function toFloat32(v: number[]): Float32Array {
  return new Float32Array(v);
}

describe('cosineSimilarity', () => {
  it('returns 1.0 for identical vectors', () => {
    const v = toFloat32(randomNormalizedVector(128));
    const result = cosineSimilarity(v, v);
    expect(result).toBeCloseTo(1.0, 10);
  });

  it('returns -1.0 for opposite vectors', () => {
    const raw = randomNormalizedVector(128);
    const v = toFloat32(raw);
    const neg = toFloat32(raw.map(x => -x));
    const result = cosineSimilarity(v, neg);
    expect(result).toBeCloseTo(-1.0, 10);
  });

  it('returns 0 for orthogonal vectors (e1 and e2)', () => {
    const a = new Float32Array([1, 0, 0, 0]);
    const b = new Float32Array([0, 1, 0, 0]);
    expect(cosineSimilarity(a, b)).toBeCloseTo(0, 10);
  });

  it('returns value in range [-1, 1]', () => {
    const a = toFloat32(randomNormalizedVector(64));
    const b = toFloat32(randomNormalizedVector(64));
    const result = cosineSimilarity(a, b);
    expect(result).toBeGreaterThanOrEqual(-1.0);
    expect(result).toBeLessThanOrEqual(1.0);
  });

  it('throws for vectors of different lengths', () => {
    const a = new Float32Array([1, 2, 3]);
    const b = new Float32Array([1, 2]);
    expect(() => cosineSimilarity(a, b)).toThrow();
  });

  it('returns 0 for a zero vector', () => {
    const zero = new Float32Array([0, 0, 0, 0]);
    const v = new Float32Array([1, 0, 0, 0]);
    expect(cosineSimilarity(zero, v)).toBe(0);
  });
});

describe('euclideanDistance', () => {
  it('returns 0 for identical vectors', () => {
    const v = toFloat32(randomNormalizedVector(64));
    expect(euclideanDistance(v, v)).toBeCloseTo(0, 10);
  });

  it('returns correct value for known vectors', () => {
    const a = new Float32Array([0, 0]);
    const b = new Float32Array([3, 4]);
    expect(euclideanDistance(a, b)).toBeCloseTo(5, 10);
  });

  it('is symmetric', () => {
    const a = toFloat32(randomNormalizedVector(32));
    const b = toFloat32(randomNormalizedVector(32));
    expect(euclideanDistance(a, b)).toBeCloseTo(euclideanDistance(b, a), 10);
  });

  it('is always non-negative', () => {
    const a = toFloat32(randomNormalizedVector(32));
    const b = toFloat32(randomNormalizedVector(32));
    expect(euclideanDistance(a, b)).toBeGreaterThanOrEqual(0);
  });

  it('throws for vectors of different lengths', () => {
    const a = new Float32Array([1, 2, 3]);
    const b = new Float32Array([1, 2]);
    expect(() => euclideanDistance(a, b)).toThrow();
  });
});

describe('recallAtK', () => {
  it('returns 1.0 when original and restored sets are identical', () => {
    const dims = 32;
    const corpus = Array.from({ length: 20 }, () => toFloat32(randomNormalizedVector(dims)));
    const query = corpus[0];
    const result = recallAtK(query, corpus, corpus, 10);
    expect(result).toBe(1.0);
  });

  it('returns a value in [0, 1]', () => {
    const dims = 32;
    const corpus = Array.from({ length: 20 }, () => toFloat32(randomNormalizedVector(dims)));
    const compressedCorpus = corpus.map(v => {
      const perturbed = new Float32Array(v);
      for (let i = 0; i < perturbed.length; i++) {
        perturbed[i] += (Math.random() - 0.5) * 0.01;
      }
      return perturbed;
    });
    const query = corpus[0];
    const result = recallAtK(query, corpus, compressedCorpus, 10);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(1);
  });

  it('throws if corpus sizes differ', () => {
    const dims = 8;
    const original = Array.from({ length: 5 }, () => toFloat32(randomNormalizedVector(dims)));
    const compressed = Array.from({ length: 3 }, () => toFloat32(randomNormalizedVector(dims)));
    const query = original[0];
    expect(() => recallAtK(query, original, compressed, 3)).toThrow();
  });
});

describe('analyzeQuality', () => {
  it('returns a report with a summary string', () => {
    const dims = 64;
    const vectors = Array.from({ length: 5 }, () => toFloat32(randomNormalizedVector(dims)));
    const report = analyzeQuality(vectors, vectors);
    expect(typeof report.summary).toBe('string');
    expect(report.summary.length).toBeGreaterThan(0);
  });

  it('returns numeric quality metrics', () => {
    const dims = 64;
    const vectors = Array.from({ length: 5 }, () => toFloat32(randomNormalizedVector(dims)));
    const report = analyzeQuality(vectors, vectors);
    expect(typeof report.metrics.overallQuality).toBe('number');
    expect(typeof report.metrics.cosineSimilarity.mean).toBe('number');
  });

  it('reports near-perfect quality for identical vectors', () => {
    const dims = 64;
    const vectors = Array.from({ length: 5 }, () => toFloat32(randomNormalizedVector(dims)));
    const report = analyzeQuality(vectors, vectors);
    expect(report.metrics.cosineSimilarity.mean).toBeCloseTo(1.0, 5);
    expect(report.metrics.euclideanDistance.mean).toBeCloseTo(0, 5);
  });

  it('returns warnings and recommendations arrays', () => {
    const dims = 64;
    const vectors = Array.from({ length: 5 }, () => toFloat32(randomNormalizedVector(dims)));
    const report = analyzeQuality(vectors, vectors);
    expect(Array.isArray(report.warnings)).toBe(true);
    expect(Array.isArray(report.recommendations)).toBe(true);
  });

  it('includes timestamp in ISO format', () => {
    const dims = 32;
    const vectors = Array.from({ length: 3 }, () => toFloat32(randomNormalizedVector(dims)));
    const report = analyzeQuality(vectors, vectors);
    expect(() => new Date(report.timestamp)).not.toThrow();
    expect(report.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('throws when original and restored lengths differ', () => {
    const dims = 32;
    const original = Array.from({ length: 3 }, () => toFloat32(randomNormalizedVector(dims)));
    const restored = Array.from({ length: 2 }, () => toFloat32(randomNormalizedVector(dims)));
    expect(() => analyzeQuality(original, restored)).toThrow();
  });

  it('throws for empty input', () => {
    expect(() => analyzeQuality([], [])).toThrow();
  });

  it('sampleSize matches input count when not sampling', () => {
    const dims = 32;
    const count = 5;
    const vectors = Array.from({ length: count }, () => toFloat32(randomNormalizedVector(dims)));
    const report = analyzeQuality(vectors, vectors);
    expect(report.sampleSize).toBe(count);
  });
});
