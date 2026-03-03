/**
 * Stratus SDK - Base Vector Database Adapter
 *
 * @purpose Base class for vector database integrations
 */
import { StratusIntegrationConfig, CostStats, ProgressUpdate } from './types.js';
export declare abstract class StratusAdapter {
    protected config: Required<StratusIntegrationConfig>;
    protected costStats: CostStats;
    constructor(config?: StratusIntegrationConfig);
    protected compressVector(vector: Float32Array): Uint8Array;
    protected compressVectors(vectors: Float32Array[]): Uint8Array[];
    protected decompressVector(compressed: Uint8Array): Float32Array;
    protected decompressVectors(compressed: Uint8Array[]): Float32Array[];
    protected updateCostStats(originalBytes: number, compressedBytes: number, count: number): void;
    protected reportProgress(operation: ProgressUpdate['operation'], processed: number, total: number, originalBytes?: number, compressedBytes?: number): void;
    getCostStats(): CostStats;
    resetCostStats(): void;
    getCompressionRatio(): string;
    getBytesSaved(): string;
}
