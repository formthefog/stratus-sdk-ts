/**
 * @purpose Common types for vector database integrations
 */
import { CompressionLevel, CompressionOptions } from '../types.js';
/**
 * Configuration for Stratus compression in vector database adapters
 */
export interface StratusIntegrationConfig {
    /**
     * Compression level to use (default: Medium)
     */
    level?: CompressionLevel;
    /**
     * Full compression options (overrides level)
     */
    compressionOptions?: CompressionOptions;
    /**
     * Enable automatic decompression on query results (default: true)
     */
    autoDecompress?: boolean;
    /**
     * Batch size for bulk operations (default: 100)
     */
    batchSize?: number;
    /**
     * Enable progress tracking for large operations
     */
    onProgress?: (progress: ProgressUpdate) => void;
    /**
     * Enable cost tracking
     */
    trackCosts?: boolean;
}
/**
 * Progress update for bulk operations
 */
export interface ProgressUpdate {
    /**
     * Total items to process
     */
    total: number;
    /**
     * Items processed so far
     */
    processed: number;
    /**
     * Current operation
     */
    operation: 'compress' | 'decompress' | 'upsert' | 'query' | 'migrate';
    /**
     * Original size in bytes
     */
    originalBytes?: number;
    /**
     * Compressed size in bytes
     */
    compressedBytes?: number;
}
/**
 * Cost savings statistics
 */
export interface CostStats {
    /**
     * Original size in bytes
     */
    originalBytes: number;
    /**
     * Compressed size in bytes
     */
    compressedBytes: number;
    /**
     * Compression ratio (e.g., 15.2 means 15.2x compression)
     */
    compressionRatio: number;
    /**
     * Bytes saved
     */
    bytesSaved: number;
    /**
     * Percentage saved
     */
    percentSaved: number;
    /**
     * Number of vectors processed
     */
    vectorCount: number;
}
/**
 * Base metadata for compressed vectors
 */
export interface CompressedVectorMetadata {
    /**
     * Indicates this vector is compressed by Stratus
     */
    _stratus_compressed: boolean;
    /**
     * Compression level used
     */
    _stratus_level: string;
    /**
     * Original dimension count
     */
    _stratus_original_dim: number;
    /**
     * User-provided metadata
     */
    [key: string]: any;
}
/**
 * Migration progress for existing indexes
 */
export interface MigrationProgress {
    /**
     * Total vectors to migrate
     */
    total: number;
    /**
     * Vectors migrated so far
     */
    migrated: number;
    /**
     * Migration status
     */
    status: 'running' | 'paused' | 'completed' | 'failed';
    /**
     * Original index size in bytes
     */
    originalBytes: number;
    /**
     * Compressed index size in bytes
     */
    compressedBytes: number;
    /**
     * Estimated completion time in milliseconds
     */
    estimatedTimeMs?: number;
    /**
     * Error if migration failed
     */
    error?: Error;
}
