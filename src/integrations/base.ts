/**
 * Stratus SDK - Base Vector Database Adapter
 *
 * @purpose Base class for vector database integrations
 */

import { compress, compressBatch } from '../compress.js';
import { decompress, decompressBatch } from '../decompress.js';
import { CompressionLevel } from '../types.js';
import { StratusIntegrationConfig, CostStats, ProgressUpdate } from './types.js';

export abstract class StratusAdapter {
  protected config: Required<StratusIntegrationConfig>;
  protected costStats: CostStats;

  constructor(config: StratusIntegrationConfig = {}) {
    this.config = {
      level: config.level ?? CompressionLevel.Medium,
      compressionOptions: config.compressionOptions ?? { level: config.level ?? CompressionLevel.Medium },
      autoDecompress: config.autoDecompress !== false,
      batchSize: config.batchSize ?? 100,
      onProgress: config.onProgress ?? (() => {}),
      trackCosts: config.trackCosts !== false,
    };
    this.costStats = {
      originalBytes: 0,
      compressedBytes: 0,
      compressionRatio: 0,
      bytesSaved: 0,
      percentSaved: 0,
      vectorCount: 0,
    };
  }

  protected compressVector(vector: Float32Array): Uint8Array {
    const originalSize = vector.length * 4;
    const compressed = compress(vector, this.config.compressionOptions);
    if (this.config.trackCosts) {
      this.updateCostStats(originalSize, compressed.length, 1);
    }
    return compressed;
  }

  protected compressVectors(vectors: Float32Array[]): Uint8Array[] {
    const originalSize = vectors.reduce((sum, v) => sum + v.length * 4, 0);
    const compressed = compressBatch(vectors, this.config.compressionOptions);
    const compressedSize = compressed.reduce((sum, c) => sum + c.length, 0);
    if (this.config.trackCosts) {
      this.updateCostStats(originalSize, compressedSize, vectors.length);
    }
    return compressed;
  }

  protected decompressVector(compressed: Uint8Array): Float32Array {
    return decompress(compressed);
  }

  protected decompressVectors(compressed: Uint8Array[]): Float32Array[] {
    return decompressBatch(compressed);
  }

  protected updateCostStats(originalBytes: number, compressedBytes: number, count: number): void {
    this.costStats.originalBytes += originalBytes;
    this.costStats.compressedBytes += compressedBytes;
    this.costStats.vectorCount += count;
    this.costStats.bytesSaved = this.costStats.originalBytes - this.costStats.compressedBytes;
    this.costStats.compressionRatio = this.costStats.originalBytes / (this.costStats.compressedBytes || 1);
    this.costStats.percentSaved = (this.costStats.bytesSaved / this.costStats.originalBytes) * 100;
  }

  protected reportProgress(
    operation: ProgressUpdate['operation'],
    processed: number,
    total: number,
    originalBytes?: number,
    compressedBytes?: number
  ): void {
    this.config.onProgress({
      operation,
      processed,
      total,
      originalBytes,
      compressedBytes,
    });
  }

  getCostStats(): CostStats {
    return { ...this.costStats };
  }

  resetCostStats(): void {
    this.costStats = {
      originalBytes: 0,
      compressedBytes: 0,
      compressionRatio: 0,
      bytesSaved: 0,
      percentSaved: 0,
      vectorCount: 0,
    };
  }

  getCompressionRatio(): string {
    return `${this.costStats.compressionRatio.toFixed(1)}x`;
  }

  getBytesSaved(): string {
    const bytes = this.costStats.bytesSaved;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }
}
