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
    fetch(ids: string[]): Promise<{
        vectors: Record<string, PineconeVector>;
    }>;
    delete(ids: string[]): Promise<void>;
    describeIndexStats(): Promise<unknown>;
}
export declare class StratusPinecone extends StratusAdapter {
    private index;
    constructor(index: PineconeIndex, config?: StratusIntegrationConfig);
    upsert(vectors: PineconeVector[]): Promise<void>;
    query(params: PineconeQueryParams): Promise<PineconeQueryResult>;
    fetch(ids: string[]): Promise<{
        vectors: Record<string, PineconeVector>;
    }>;
    delete(ids: string[]): Promise<void>;
    describeIndexStats(): Promise<unknown>;
    migrateIndex(_batchSize?: number): Promise<void>;
    private createBatches;
}
