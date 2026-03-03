/**
 * Stratus SDK - Weaviate Integration
 *
 * Drop-in wrapper for Weaviate with transparent compression.
 *
 * @purpose Weaviate vector database integration with transparent compression
 */

import { StratusAdapter } from './base.js';
import { StratusIntegrationConfig } from './types.js';

export interface WeaviateObject {
  id?: string;
  class: string;
  properties: Record<string, unknown>;
  vector?: number[] | Float32Array;
}

export interface WeaviateQueryParams {
  class: string;
  vector?: number[] | Float32Array;
  limit?: number;
  offset?: number;
  where?: unknown;
  certainty?: number;
}

export interface WeaviateResult {
  id: string;
  class: string;
  properties: Record<string, unknown>;
  vector?: number[] | Float32Array;
  certainty?: number;
}

export interface WeaviateClient {
  data: {
    creator(): {
      withClassName(className: string): WeaviateCreatorBuilder;
      withProperties(properties: Record<string, unknown>): WeaviateCreatorBuilder;
      withVector(vector: number[]): WeaviateCreatorBuilder;
      do(): Promise<WeaviateObject>;
    };
    getter(): {
      withClassName(className: string): WeaviateGetterBuilder;
      withId(id: string): WeaviateGetterBuilder;
      do(): Promise<WeaviateObject>;
    };
  };
  graphql: {
    get(): {
      withClassName(className: string): WeaviateGraphQLBuilder;
      withNearVector(params: unknown): WeaviateGraphQLBuilder;
      withLimit(limit: number): WeaviateGraphQLBuilder;
      withFields(fields: string): WeaviateGraphQLBuilder;
      do(): Promise<{ data: { Get: Record<string, WeaviateResult[]> } }>;
    };
  };
  batch: {
    objectsBatcher(): {
      withObjects(objects: WeaviateObject[]): WeaviateBatchBuilder;
      do(): Promise<unknown>;
    };
  };
}

interface WeaviateCreatorBuilder {
  withClassName(className: string): WeaviateCreatorBuilder;
  withProperties(properties: Record<string, unknown>): WeaviateCreatorBuilder;
  withVector(vector: number[]): WeaviateCreatorBuilder;
  do(): Promise<WeaviateObject>;
}

interface WeaviateGetterBuilder {
  withClassName(className: string): WeaviateGetterBuilder;
  withId(id: string): WeaviateGetterBuilder;
  do(): Promise<WeaviateObject>;
}

interface WeaviateGraphQLBuilder {
  withClassName(className: string): WeaviateGraphQLBuilder;
  withNearVector(params: unknown): WeaviateGraphQLBuilder;
  withLimit(limit: number): WeaviateGraphQLBuilder;
  withFields(fields: string): WeaviateGraphQLBuilder;
  do(): Promise<{ data: { Get: Record<string, WeaviateResult[]> } }>;
}

interface WeaviateBatchBuilder {
  withObjects(objects: WeaviateObject[]): WeaviateBatchBuilder;
  do(): Promise<unknown>;
}

export class StratusWeaviate extends StratusAdapter {
  private client: WeaviateClient;

  constructor(client: WeaviateClient, config?: StratusIntegrationConfig) {
    super(config);
    this.client = client;
  }

  async createObject(object: WeaviateObject): Promise<WeaviateObject> {
    let creator = this.client.data
      .creator()
      .withClassName(object.class)
      .withProperties(object.properties);

    if (object.vector) {
      const vector = Array.isArray(object.vector) ? new Float32Array(object.vector) : object.vector;
      const compressed = this.compressVector(vector);
      const base64 = Buffer.from(compressed).toString('base64');

      const properties: Record<string, unknown> = {
        ...object.properties,
        _stratus_compressed: true,
        _stratus_level: this.config.level,
        _stratus_original_dim: vector.length,
        _stratus_data: base64,
      };

      creator = creator.withProperties(properties).withVector([0]);
    }

    return creator.do();
  }

  async createObjects(objects: WeaviateObject[]): Promise<void> {
    const batches = this.createBatches(objects, this.config.batchSize);
    let processed = 0;

    for (const batch of batches) {
      const compressedBatch = batch.map((obj) => {
        if (!obj.vector) return obj;
        const vector = Array.isArray(obj.vector) ? new Float32Array(obj.vector) : obj.vector;
        const compressed = this.compressVector(vector);
        const base64 = Buffer.from(compressed).toString('base64');
        return {
          ...obj,
          properties: {
            ...obj.properties,
            _stratus_compressed: true,
            _stratus_level: this.config.level,
            _stratus_original_dim: vector.length,
            _stratus_data: base64,
          },
          vector: [0],
        };
      });

      await this.client.batch.objectsBatcher().withObjects(compressedBatch).do();
      processed += batch.length;
      this.reportProgress('upsert', processed, objects.length);
    }
  }

  async query(params: WeaviateQueryParams): Promise<WeaviateResult[]> {
    let query = this.client.graphql.get().withClassName(params.class);

    if (params.vector) {
      query = query.withNearVector({
        vector: [0],
        certainty: params.certainty ?? 0.7,
      });
    }

    if (params.limit) {
      query = query.withLimit(params.limit);
    }

    query = query.withFields('_additional { id certainty } properties { _stratus_compressed _stratus_data }');

    const result = await query.do();
    const results = result.data.Get[params.class] ?? [];

    if (this.config.autoDecompress) {
      return results.map((item) => {
        const props = item.properties as Record<string, unknown>;
        if (props._stratus_compressed && props._stratus_data) {
          const compressed = Buffer.from(props._stratus_data as string, 'base64');
          const decompressed = this.decompressVector(new Uint8Array(compressed));
          const {
            _stratus_compressed: _c,
            _stratus_level: _l,
            _stratus_original_dim: _d,
            _stratus_data: _dd,
            ...userProperties
          } = props;
          return {
            ...item,
            properties: userProperties,
            vector: decompressed,
          };
        }
        return item;
      });
    }

    return results;
  }

  async getObject(className: string, id: string): Promise<WeaviateObject> {
    const result = await this.client.data.getter().withClassName(className).withId(id).do();
    const props = result.properties as Record<string, unknown>;

    if (this.config.autoDecompress && props._stratus_compressed && props._stratus_data) {
      const compressed = Buffer.from(props._stratus_data as string, 'base64');
      const decompressed = this.decompressVector(new Uint8Array(compressed));
      const {
        _stratus_compressed: _c,
        _stratus_level: _l,
        _stratus_original_dim: _d,
        _stratus_data: _dd,
        ...userProperties
      } = props;
      return {
        ...result,
        properties: userProperties,
        vector: decompressed,
      };
    }

    return result;
  }

  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }
}
