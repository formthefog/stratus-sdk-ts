/**
 * Stratus SDK - Qdrant Integration
 *
 * Drop-in wrapper for Qdrant with transparent compression.
 *
 * @purpose Qdrant vector database integration with transparent compression
 */

import { StratusAdapter } from './base.js';
import { StratusIntegrationConfig } from './types.js';

export interface QdrantPoint {
  id: string | number;
  vector: number[] | Float32Array;
  payload?: Record<string, unknown>;
}

export interface QdrantSearchParams {
  vector: number[] | Float32Array;
  limit: number;
  filter?: unknown;
  with_payload?: boolean;
  with_vector?: boolean;
  score_threshold?: number;
}

export interface QdrantSearchResult {
  id: string | number;
  score: number;
  payload?: Record<string, unknown>;
  vector?: number[] | Float32Array;
}

export interface QdrantClient {
  upsert(collectionName: string, params: { points: QdrantPoint[] }): Promise<unknown>;
  search(collectionName: string, params: QdrantSearchParams): Promise<QdrantSearchResult[]>;
  retrieve(collectionName: string, params: { ids: (string | number)[] }): Promise<QdrantPoint[]>;
  delete(collectionName: string, params: { points: (string | number)[] }): Promise<unknown>;
  getCollectionInfo(collectionName: string): Promise<unknown>;
}

export class StratusQdrant extends StratusAdapter {
  private client: QdrantClient;
  private collectionName: string;

  constructor(client: QdrantClient, collectionName: string, config?: StratusIntegrationConfig) {
    super(config);
    this.client = client;
    this.collectionName = collectionName;
  }

  async upsert(points: QdrantPoint[]): Promise<void> {
    const batches = this.createBatches(points, this.config.batchSize);
    let processed = 0;

    for (const batch of batches) {
      const compressedBatch = batch.map((point) => {
        const vector = Array.isArray(point.vector) ? new Float32Array(point.vector) : point.vector;
        const compressed = this.compressVector(vector);
        const base64 = Buffer.from(compressed).toString('base64');
        return {
          ...point,
          vector: [0],
          payload: {
            ...point.payload,
            _stratus_compressed: true,
            _stratus_level: this.config.level,
            _stratus_original_dim: vector.length,
            _stratus_data: base64,
          },
        };
      });

      await this.client.upsert(this.collectionName, { points: compressedBatch });
      processed += batch.length;
      this.reportProgress('upsert', processed, points.length);
    }
  }

  async search(params: QdrantSearchParams): Promise<QdrantSearchResult[]> {
    const searchParams: QdrantSearchParams = {
      ...params,
      vector: [0],
      with_payload: true,
    };

    const results = await this.client.search(this.collectionName, searchParams);

    if (this.config.autoDecompress) {
      return results.map((result) => {
        const payload = result.payload as Record<string, unknown> | undefined;
        if (payload?._stratus_compressed && payload?._stratus_data) {
          const compressed = Buffer.from(payload._stratus_data as string, 'base64');
          const decompressed = this.decompressVector(new Uint8Array(compressed));
          const {
            _stratus_compressed: _c,
            _stratus_level: _l,
            _stratus_original_dim: _d,
            _stratus_data: _dd,
            ...userPayload
          } = payload;
          return {
            ...result,
            payload: userPayload,
            vector: params.with_vector ? decompressed : undefined,
          };
        }
        return result;
      });
    }

    return results;
  }

  async retrieve(ids: (string | number)[]): Promise<QdrantPoint[]> {
    const results = await this.client.retrieve(this.collectionName, { ids });

    if (this.config.autoDecompress) {
      return results.map((point) => {
        const payload = point.payload as Record<string, unknown> | undefined;
        if (payload?._stratus_compressed && payload?._stratus_data) {
          const compressed = Buffer.from(payload._stratus_data as string, 'base64');
          const decompressed = this.decompressVector(new Uint8Array(compressed));
          const {
            _stratus_compressed: _c,
            _stratus_level: _l,
            _stratus_original_dim: _d,
            _stratus_data: _dd,
            ...userPayload
          } = payload;
          return {
            ...point,
            payload: userPayload,
            vector: decompressed,
          };
        }
        return point;
      });
    }

    return results;
  }

  async delete(ids: (string | number)[]): Promise<unknown> {
    return this.client.delete(this.collectionName, { points: ids });
  }

  async getCollectionInfo(): Promise<unknown> {
    return this.client.getCollectionInfo(this.collectionName);
  }

  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }
}
