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
    upsert(collectionName: string, params: {
        points: QdrantPoint[];
    }): Promise<unknown>;
    search(collectionName: string, params: QdrantSearchParams): Promise<QdrantSearchResult[]>;
    retrieve(collectionName: string, params: {
        ids: (string | number)[];
    }): Promise<QdrantPoint[]>;
    delete(collectionName: string, params: {
        points: (string | number)[];
    }): Promise<unknown>;
    getCollectionInfo(collectionName: string): Promise<unknown>;
}
export declare class StratusQdrant extends StratusAdapter {
    private client;
    private collectionName;
    constructor(client: QdrantClient, collectionName: string, config?: StratusIntegrationConfig);
    upsert(points: QdrantPoint[]): Promise<void>;
    search(params: QdrantSearchParams): Promise<QdrantSearchResult[]>;
    retrieve(ids: (string | number)[]): Promise<QdrantPoint[]>;
    delete(ids: (string | number)[]): Promise<unknown>;
    getCollectionInfo(): Promise<unknown>;
    private createBatches;
}
