/**
 * @purpose Qdrant vector database integration with transparent compression
 */
import { StratusAdapter } from './base.js';
import { StratusIntegrationConfig } from './types.js';
/**
 * Qdrant point structure
 */
export interface QdrantPoint {
    id: string | number;
    vector: number[] | Float32Array;
    payload?: Record<string, any>;
}
/**
 * Qdrant search parameters
 */
export interface QdrantSearchParams {
    vector: number[] | Float32Array;
    limit: number;
    filter?: any;
    with_payload?: boolean;
    with_vector?: boolean;
    score_threshold?: number;
}
/**
 * Qdrant search result
 */
export interface QdrantSearchResult {
    id: string | number;
    score: number;
    payload?: Record<string, any>;
    vector?: number[] | Float32Array;
}
/**
 * Mock Qdrant Client interface (for typing)
 */
export interface QdrantClient {
    upsert(collectionName: string, params: {
        points: QdrantPoint[];
    }): Promise<any>;
    search(collectionName: string, params: QdrantSearchParams): Promise<QdrantSearchResult[]>;
    retrieve(collectionName: string, params: {
        ids: (string | number)[];
    }): Promise<QdrantPoint[]>;
    delete(collectionName: string, params: {
        points: (string | number)[];
    }): Promise<any>;
    getCollectionInfo(collectionName: string): Promise<any>;
}
/**
 * Stratus-compressed Qdrant client
 *
 * Drop-in wrapper for Qdrant with transparent compression.
 *
 * @example
 * ```typescript
 * const client = new StratusQdrant(qdrantClient, 'my-collection', { level: 'Medium' });
 *
 * // Upsert points with compressed vectors
 * await client.upsert([
 *   { id: 1, vector: embedding, payload: { title: 'Doc 1' } }
 * ]);
 *
 * // Search with compressed vectors
 * const results = await client.search({
 *   vector: queryEmbedding,
 *   limit: 10,
 *   with_payload: true
 * });
 * ```
 */
export declare class StratusQdrant extends StratusAdapter {
    private client;
    private collectionName;
    /**
     * Create a compressed Qdrant client
     *
     * @param client - Original Qdrant client instance
     * @param collectionName - Collection to work with
     * @param config - Stratus compression configuration
     */
    constructor(client: QdrantClient, collectionName: string, config?: StratusIntegrationConfig);
    /**
     * Upsert points with automatic compression
     *
     * @param points - Points to upsert
     * @returns Promise that resolves when upsert completes
     */
    upsert(points: QdrantPoint[]): Promise<any>;
    /**
     * Search with automatic compression/decompression
     *
     * @param params - Search parameters
     * @returns Search results with decompressed vectors
     */
    search(params: QdrantSearchParams): Promise<QdrantSearchResult[]>;
    /**
     * Retrieve points by ID with automatic decompression
     *
     * @param ids - Point IDs to retrieve
     * @returns Retrieved points with decompressed vectors
     */
    retrieve(ids: (string | number)[]): Promise<QdrantPoint[]>;
    /**
     * Delete points (passthrough to underlying client)
     */
    delete(ids: (string | number)[]): Promise<any>;
    /**
     * Get collection info (passthrough to underlying client)
     */
    getCollectionInfo(): Promise<any>;
    /**
     * Create batches from array
     */
    private createBatches;
}
