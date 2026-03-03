/**
 * Stratus SDK - Vector Database Integration Types
 *
 * @purpose Common types for vector database integrations
 */
import { CompressionLevel, CompressionOptions } from '../types.js';
export interface StratusIntegrationConfig {
    level?: CompressionLevel;
    compressionOptions?: CompressionOptions;
    autoDecompress?: boolean;
    batchSize?: number;
    onProgress?: (progress: ProgressUpdate) => void;
    trackCosts?: boolean;
}
export interface ProgressUpdate {
    total: number;
    processed: number;
    operation: 'compress' | 'decompress' | 'upsert' | 'query' | 'migrate';
    originalBytes?: number;
    compressedBytes?: number;
}
export interface CostStats {
    originalBytes: number;
    compressedBytes: number;
    compressionRatio: number;
    bytesSaved: number;
    percentSaved: number;
    vectorCount: number;
}
export interface CompressedVectorMetadata {
    _stratus_compressed: boolean;
    _stratus_level: string;
    _stratus_original_dim: number;
    [key: string]: unknown;
}
export interface MigrationProgress {
    total: number;
    migrated: number;
    status: 'running' | 'paused' | 'completed' | 'failed';
    originalBytes: number;
    compressedBytes: number;
    estimatedTimeMs?: number;
    error?: Error;
}
