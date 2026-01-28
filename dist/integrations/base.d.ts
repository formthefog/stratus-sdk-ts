/**
 * @purpose Base class for vector database integrations
 */
import { StratusIntegrationConfig, CostStats, ProgressUpdate } from './types.js';
/**
 * Base adapter class for vector database integrations
 */
export declare abstract class StratusAdapter {
    protected config: Required<StratusIntegrationConfig>;
    protected costStats: CostStats;
    constructor(config?: StratusIntegrationConfig);
    /**
     * Compress a single vector
     */
    protected compressVector(vector: Float32Array): Uint8Array;
    /**
     * Compress multiple vectors
     */
    protected compressVectors(vectors: Float32Array[]): Uint8Array[];
    /**
     * Decompress a single vector
     */
    protected decompressVector(compressed: Uint8Array): Float32Array;
    /**
     * Decompress multiple vectors
     */
    protected decompressVectors(compressed: Uint8Array[]): Float32Array[];
    /**
     * Update cost tracking statistics
     */
    protected updateCostStats(originalBytes: number, compressedBytes: number, count: number): void;
    /**
     * Report progress for bulk operations
     */
    protected reportProgress(operation: ProgressUpdate['operation'], processed: number, total: number, originalBytes?: number, compressedBytes?: number): void;
    /**
     * Get cost savings statistics
     */
    getCostStats(): CostStats;
    /**
     * Reset cost statistics
     */
    resetCostStats(): void;
    /**
     * Get compression ratio as a human-readable string
     */
    getCompressionRatio(): string;
    /**
     * Get bytes saved as a human-readable string
     */
    getBytesSaved(): string;
}
