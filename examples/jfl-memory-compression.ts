/**
 * JFL Memory × Stratus Compression Integration
 *
 * Drop-in module for compressing embeddings in JFL Memory storage.
 *
 * Usage:
 *   import { compressEmbedding, decompressEmbedding } from './compression';
 *
 *   // When saving:
 *   const compressed = compressEmbedding(embedding, config);
 *
 *   // When retrieving:
 *   const embedding = decompressEmbedding(compressed, format);
 */

import { compress, decompress, CompressionLevel } from '@formthefog/stratus-sdk-ts';

export interface CompressionConfig {
  enabled: boolean;
  level?: CompressionLevel;
}

export const DEFAULT_COMPRESSION: CompressionConfig = {
  enabled: true,
  level: CompressionLevel.Medium, // 99.7% quality, 0.68x size
};

/**
 * Compress an embedding vector for storage.
 *
 * @param embedding - Float array or number array
 * @param config - Compression configuration
 * @returns Compressed buffer or null if compression disabled
 */
export function compressEmbedding(
  embedding: Float32Array | number[] | undefined,
  config: CompressionConfig = DEFAULT_COMPRESSION
): Uint8Array | null {
  if (!embedding || !config.enabled) {
    return null;
  }

  const vec =
    embedding instanceof Float32Array
      ? embedding
      : new Float32Array(embedding);

  return compress(vec, {
    level: config.level ?? CompressionLevel.Medium,
  });
}

/**
 * Decompress an embedding vector from storage.
 *
 * @param compressed - Compressed buffer
 * @param format - Format indicator ('stratus', 'json', etc.)
 * @param jsonFallback - JSON string fallback if not compressed
 * @returns Decompressed embedding as number array
 */
export function decompressEmbedding(
  compressed: Uint8Array | null | undefined,
  format: string | null | undefined,
  jsonFallback?: string | null
): number[] | undefined {
  // Stratus compressed format
  if (format === 'stratus' && compressed) {
    const decompressed = decompress(compressed);
    return Array.from(decompressed);
  }

  // Legacy JSON format
  if (jsonFallback) {
    return JSON.parse(jsonFallback);
  }

  // No embedding
  return undefined;
}

/**
 * Estimate compression ratio for an embedding.
 *
 * @param embedding - Embedding vector
 * @param config - Compression configuration
 * @returns Ratio of compressed size to original JSON size
 */
export function estimateCompressionRatio(
  embedding: Float32Array | number[],
  config: CompressionConfig = DEFAULT_COMPRESSION
): number {
  if (!config.enabled) return 1.0;

  const vec =
    embedding instanceof Float32Array
      ? embedding
      : new Float32Array(embedding);

  const jsonSize = JSON.stringify(Array.from(vec)).length;
  const compressed = compress(vec, {
    level: config.level ?? CompressionLevel.Medium,
  });

  return compressed.length / jsonSize;
}

/**
 * Batch compress multiple embeddings.
 *
 * @param embeddings - Array of embedding vectors
 * @param config - Compression configuration
 * @returns Array of compressed buffers
 */
export function compressBatchEmbeddings(
  embeddings: (Float32Array | number[])[],
  config: CompressionConfig = DEFAULT_COMPRESSION
): (Uint8Array | null)[] {
  if (!config.enabled) {
    return embeddings.map(() => null);
  }

  return embeddings.map((emb) => compressEmbedding(emb, config));
}

/**
 * Storage layer helpers for SQLite integration.
 */
export const StorageHelpers = {
  /**
   * Prepare embedding data for storage (both compressed and format).
   */
  prepareForStorage(
    embedding: Float32Array | number[] | undefined,
    config: CompressionConfig
  ): { compressed: Uint8Array | null; format: string | null } {
    const compressed = compressEmbedding(embedding, config);
    const format = compressed ? 'stratus' : null;
    return { compressed, format };
  },

  /**
   * Retrieve embedding from storage row.
   */
  retrieveFromStorage(row: {
    embedding_compressed?: Uint8Array | null;
    embedding_format?: string | null;
    embedding?: string | null;
  }): number[] | undefined {
    return decompressEmbedding(
      row.embedding_compressed,
      row.embedding_format,
      row.embedding
    );
  },

  /**
   * Migrate legacy JSON embedding to compressed format.
   */
  migrateLegacy(jsonEmbedding: string, config: CompressionConfig): {
    compressed: Uint8Array;
    format: string;
  } {
    const embedding: number[] = JSON.parse(jsonEmbedding);
    const compressed = compressEmbedding(embedding, config);

    if (!compressed) {
      throw new Error('Compression failed during migration');
    }

    return {
      compressed,
      format: 'stratus',
    };
  },
};

/**
 * Example: Update storage layer
 *
 * ```typescript
 * import { StorageHelpers } from './compression';
 *
 * // In saveChunk():
 * const { compressed, format } = StorageHelpers.prepareForStorage(
 *   chunk.embedding,
 *   config.compression || DEFAULT_COMPRESSION
 * );
 *
 * db.prepare(`
 *   INSERT INTO chunks (..., embedding_compressed, embedding_format)
 *   VALUES (..., ?, ?)
 * `).run(..., compressed, format);
 *
 * // In rowToChunk():
 * const embedding = StorageHelpers.retrieveFromStorage(row);
 * ```
 */

/**
 * Example: Migration script
 *
 * ```typescript
 * import { StorageHelpers, DEFAULT_COMPRESSION } from './compression';
 *
 * const rows = db.prepare(`
 *   SELECT id, embedding FROM chunks
 *   WHERE embedding_format IS NULL AND embedding IS NOT NULL
 * `).all();
 *
 * const update = db.prepare(`
 *   UPDATE chunks
 *   SET embedding_compressed = ?, embedding_format = ?
 *   WHERE id = ?
 * `);
 *
 * for (const row of rows) {
 *   const { compressed, format } = StorageHelpers.migrateLegacy(
 *     row.embedding,
 *     DEFAULT_COMPRESSION
 *   );
 *   update.run(compressed, format, row.id);
 * }
 * ```
 */
