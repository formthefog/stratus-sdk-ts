/**
 * @purpose Weaviate vector database integration with transparent compression
 */
import { StratusAdapter } from './base.js';
import { StratusIntegrationConfig } from './types.js';
/**
 * Weaviate object
 */
export interface WeaviateObject {
    id?: string;
    class: string;
    properties: Record<string, any>;
    vector?: number[] | Float32Array;
}
/**
 * Weaviate query parameters
 */
export interface WeaviateQueryParams {
    class: string;
    vector?: number[] | Float32Array;
    limit?: number;
    offset?: number;
    where?: any;
    certainty?: number;
}
/**
 * Weaviate query result
 */
export interface WeaviateResult {
    id: string;
    class: string;
    properties: Record<string, any>;
    vector?: number[] | Float32Array;
    certainty?: number;
}
/**
 * Mock Weaviate Client interface (for typing)
 */
export interface WeaviateClient {
    data: {
        creator(): {
            withClassName(className: string): any;
            withProperties(properties: Record<string, any>): any;
            withVector(vector: number[]): any;
            do(): Promise<WeaviateObject>;
        };
        getter(): {
            withClassName(className: string): any;
            withId(id: string): any;
            do(): Promise<WeaviateObject>;
        };
    };
    graphql: {
        get(): {
            withClassName(className: string): any;
            withNearVector(params: any): any;
            withLimit(limit: number): any;
            withFields(fields: string): any;
            do(): Promise<{
                data: {
                    Get: Record<string, WeaviateResult[]>;
                };
            }>;
        };
    };
    batch: {
        objectsBatcher(): {
            withObjects(objects: WeaviateObject[]): any;
            do(): Promise<any>;
        };
    };
}
/**
 * Stratus-compressed Weaviate client
 *
 * Drop-in wrapper for Weaviate with transparent compression.
 *
 * @example
 * ```typescript
 * const client = new StratusWeaviate(weaviateClient, { level: 'Medium' });
 *
 * // Create objects with compressed vectors
 * await client.createObject({
 *   class: 'Document',
 *   properties: { title: 'My doc' },
 *   vector: embedding
 * });
 *
 * // Query with compressed vectors
 * const results = await client.query({
 *   class: 'Document',
 *   vector: queryEmbedding,
 *   limit: 10
 * });
 * ```
 */
export declare class StratusWeaviate extends StratusAdapter {
    private client;
    /**
     * Create a compressed Weaviate client
     *
     * @param client - Original Weaviate client instance
     * @param config - Stratus compression configuration
     */
    constructor(client: WeaviateClient, config?: StratusIntegrationConfig);
    /**
     * Create a single object with compressed vector
     *
     * @param object - Object to create
     * @returns Created object with ID
     */
    createObject(object: WeaviateObject): Promise<WeaviateObject>;
    /**
     * Create multiple objects in batch
     *
     * @param objects - Objects to create
     * @returns Batch result
     */
    createObjects(objects: WeaviateObject[]): Promise<any>;
    /**
     * Query with automatic compression/decompression
     *
     * @param params - Query parameters
     * @returns Query results with decompressed vectors
     */
    query(params: WeaviateQueryParams): Promise<WeaviateResult[]>;
    /**
     * Get object by ID with automatic decompression
     *
     * @param className - Class name
     * @param id - Object ID
     * @returns Object with decompressed vector
     */
    getObject(className: string, id: string): Promise<WeaviateObject>;
    /**
     * Create batches from array
     */
    private createBatches;
}
