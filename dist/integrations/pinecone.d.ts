/**
 * @purpose Pinecone vector database integration with transparent compression
 */
import { StratusAdapter } from './base.js';
import { StratusIntegrationConfig } from './types.js';
/**
 * Pinecone vector record
 */
export interface PineconeVector {
    id: string;
    values: number[] | Float32Array;
    metadata?: Record<string, any>;
    sparseValues?: {
        indices: number[];
        values: number[];
    };
}
/**
 * Pinecone query parameters
 */
export interface PineconeQueryParams {
    vector?: number[] | Float32Array;
    topK: number;
    filter?: Record<string, any>;
    includeMetadata?: boolean;
    includeValues?: boolean;
    namespace?: string;
}
/**
 * Pinecone query result
 */
export interface PineconeMatch {
    id: string;
    score: number;
    values?: number[] | Float32Array;
    metadata?: Record<string, any>;
}
export interface PineconeQueryResult {
    matches: PineconeMatch[];
    namespace?: string;
}
/**
 * Mock Pinecone Index interface (for typing - replace with real Pinecone client in production)
 */
export interface PineconeIndex {
    upsert(vectors: PineconeVector[]): Promise<void>;
    query(params: PineconeQueryParams): Promise<PineconeQueryResult>;
    fetch(ids: string[]): Promise<{
        vectors: Record<string, PineconeVector>;
    }>;
    delete(ids: string[]): Promise<void>;
    describeIndexStats(): Promise<any>;
}
/**
 * Stratus-compressed Pinecone client
 *
 * Drop-in replacement for Pinecone Index with transparent compression.
 *
 * @example
 * ```typescript
 * // Instead of:
 * const index = pinecone.Index('my-index');
 *
 * // Use:
 * const index = new StratusPinecone(pinecone.Index('my-index'), { level: 'Medium' });
 *
 * // All operations work the same, but with 10-20x compression!
 * await index.upsert([{ id: '1', values: embedding }]);
 * const results = await index.query({ vector: queryEmbedding, topK: 10 });
 * ```
 */
export declare class StratusPinecone extends StratusAdapter {
    private index;
    /**
     * Create a compressed Pinecone client
     *
     * @param index - Original Pinecone index instance
     * @param config - Stratus compression configuration
     */
    constructor(index: PineconeIndex, config?: StratusIntegrationConfig);
    /**
     * Upsert vectors with automatic compression
     *
     * @param vectors - Vectors to upsert
     * @returns Promise that resolves when upsert completes
     */
    upsert(vectors: PineconeVector[]): Promise<void>;
    /**
     * Query with automatic compression/decompression
     *
     * @param params - Query parameters
     * @returns Query results with decompressed vectors
     */
    query(params: PineconeQueryParams): Promise<PineconeQueryResult>;
    /**
     * Fetch vectors by ID with automatic decompression
     *
     * @param ids - Vector IDs to fetch
     * @returns Fetched vectors with decompressed values
     */
    fetch(ids: string[]): Promise<{
        vectors: Record<string, PineconeVector>;
    }>;
    /**
     * Delete vectors (passthrough to underlying index)
     */
    delete(ids: string[]): Promise<void>;
    /**
     * Get index statistics (passthrough to underlying index)
     */
    describeIndexStats(): Promise<any>;
    /**
     * Migrate existing uncompressed index to compressed format
     *
     * @param batchSize - Number of vectors to migrate per batch
     * @returns Migration statistics
     */
    migrateIndex(batchSize?: number): Promise<void>;
    /**
     * Create batches from array
     */
    private createBatches;
}
