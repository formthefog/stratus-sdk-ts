/**
 * Stratus SDK - Pinecone Integration
 *
 * Drop-in replacement for Pinecone Index with transparent compression.
 *
 * @purpose Pinecone vector database integration with transparent compression
 */

import { StratusAdapter } from './base.js';
import { StratusIntegrationConfig } from './types.js';

export interface PineconeVector {
  id: string;
  values: number[] | Float32Array;
  metadata?: Record<string, unknown>;
  sparseValues?: {
    indices: number[];
    values: number[];
  };
}

export interface PineconeQueryParams {
  vector?: number[] | Float32Array;
  topK: number;
  filter?: Record<string, unknown>;
  includeMetadata?: boolean;
  includeValues?: boolean;
  namespace?: string;
}

export interface PineconeMatch {
  id: string;
  score: number;
  values?: number[] | Float32Array;
  metadata?: Record<string, unknown>;
}

export interface PineconeQueryResult {
  matches: PineconeMatch[];
  namespace?: string;
}

export interface PineconeIndex {
  upsert(vectors: PineconeVector[]): Promise<void>;
  query(params: PineconeQueryParams): Promise<PineconeQueryResult>;
  fetch(ids: string[]): Promise<{ vectors: Record<string, PineconeVector> }>;
  delete(ids: string[]): Promise<void>;
  describeIndexStats(): Promise<unknown>;
}

export class StratusPinecone extends StratusAdapter {
  private index: PineconeIndex;

  constructor(index: PineconeIndex, config?: StratusIntegrationConfig) {
    super(config);
    this.index = index;
  }

  async upsert(vectors: PineconeVector[]): Promise<void> {
    const batches = this.createBatches(vectors, this.config.batchSize);
    let processed = 0;

    for (const batch of batches) {
      const compressedBatch = batch.map((v) => {
        const values = Array.isArray(v.values) ? new Float32Array(v.values) : v.values;
        const compressed = this.compressVector(values);
        const base64 = Buffer.from(compressed).toString('base64');
        const metadata: Record<string, unknown> = {
          ...v.metadata,
          _stratus_compressed: true,
          _stratus_level: String(this.config.level),
          _stratus_original_dim: values.length,
          _stratus_data: base64,
        };
        return {
          ...v,
          values: [0],
          metadata,
        };
      });

      await this.index.upsert(compressedBatch);
      processed += batch.length;
      this.reportProgress('upsert', processed, vectors.length);
    }
  }

  async query(params: PineconeQueryParams): Promise<PineconeQueryResult> {
    let queryParams: PineconeQueryParams = { ...params };

    if (params.vector) {
      queryParams = {
        ...params,
        vector: [0],
        includeMetadata: true,
        includeValues: true,
      };
    }

    const result = await this.index.query(queryParams);

    if (this.config.autoDecompress && params.includeValues) {
      result.matches = result.matches.map((match) => {
        const meta = match.metadata as Record<string, unknown> | undefined;
        if (meta?._stratus_compressed && meta?._stratus_data) {
          const compressed = Buffer.from(meta._stratus_data as string, 'base64');
          const decompressed = this.decompressVector(new Uint8Array(compressed));
          const {
            _stratus_compressed: _c,
            _stratus_level: _l,
            _stratus_original_dim: _d,
            _stratus_data: _dd,
            ...userMetadata
          } = meta;
          return {
            ...match,
            values: decompressed,
            metadata: userMetadata,
          };
        }
        return match;
      });
    }

    return result;
  }

  async fetch(ids: string[]): Promise<{ vectors: Record<string, PineconeVector> }> {
    const result = await this.index.fetch(ids);

    if (this.config.autoDecompress) {
      for (const [id, vector] of Object.entries(result.vectors)) {
        const meta = vector.metadata as Record<string, unknown> | undefined;
        if (meta?._stratus_compressed && meta?._stratus_data) {
          const compressed = Buffer.from(meta._stratus_data as string, 'base64');
          const decompressed = this.decompressVector(new Uint8Array(compressed));
          const {
            _stratus_compressed: _c,
            _stratus_level: _l,
            _stratus_original_dim: _d,
            _stratus_data: _dd,
            ...userMetadata
          } = meta;
          result.vectors[id] = {
            ...vector,
            values: decompressed,
            metadata: userMetadata,
          };
        }
      }
    }

    return result;
  }

  async delete(ids: string[]): Promise<void> {
    return this.index.delete(ids);
  }

  async describeIndexStats(): Promise<unknown> {
    return this.index.describeIndexStats();
  }

  async migrateIndex(_batchSize = 100): Promise<void> {
    throw new Error('Migration not yet implemented - requires Pinecone list operation');
  }

  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }
}
