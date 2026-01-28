"use strict";
/**
 * @purpose Base class for vector database integrations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.StratusAdapter = void 0;
const compress_js_1 = require("../compress.js");
const decompress_js_1 = require("../decompress.js");
const types_js_1 = require("../types.js");
/**
 * Base adapter class for vector database integrations
 */
class StratusAdapter {
    constructor(config = {}) {
        this.config = {
            level: config.level || types_js_1.CompressionLevel.Medium,
            compressionOptions: config.compressionOptions || { level: config.level || types_js_1.CompressionLevel.Medium },
            autoDecompress: config.autoDecompress !== false,
            batchSize: config.batchSize || 100,
            onProgress: config.onProgress || (() => { }),
            trackCosts: config.trackCosts !== false,
        };
        this.costStats = {
            originalBytes: 0,
            compressedBytes: 0,
            compressionRatio: 0,
            bytesSaved: 0,
            percentSaved: 0,
            vectorCount: 0,
        };
    }
    /**
     * Compress a single vector
     */
    compressVector(vector) {
        const originalSize = vector.length * 4;
        const compressed = (0, compress_js_1.compress)(vector, this.config.compressionOptions);
        if (this.config.trackCosts) {
            this.updateCostStats(originalSize, compressed.length, 1);
        }
        return compressed;
    }
    /**
     * Compress multiple vectors
     */
    compressVectors(vectors) {
        const originalSize = vectors.reduce((sum, v) => sum + v.length * 4, 0);
        const compressed = (0, compress_js_1.compressBatch)(vectors, this.config.compressionOptions);
        const compressedSize = compressed.reduce((sum, c) => sum + c.length, 0);
        if (this.config.trackCosts) {
            this.updateCostStats(originalSize, compressedSize, vectors.length);
        }
        return compressed;
    }
    /**
     * Decompress a single vector
     */
    decompressVector(compressed) {
        return (0, decompress_js_1.decompress)(compressed);
    }
    /**
     * Decompress multiple vectors
     */
    decompressVectors(compressed) {
        return (0, decompress_js_1.decompressBatch)(compressed);
    }
    /**
     * Update cost tracking statistics
     */
    updateCostStats(originalBytes, compressedBytes, count) {
        this.costStats.originalBytes += originalBytes;
        this.costStats.compressedBytes += compressedBytes;
        this.costStats.vectorCount += count;
        this.costStats.bytesSaved = this.costStats.originalBytes - this.costStats.compressedBytes;
        this.costStats.compressionRatio = this.costStats.originalBytes / (this.costStats.compressedBytes || 1);
        this.costStats.percentSaved = (this.costStats.bytesSaved / this.costStats.originalBytes) * 100;
    }
    /**
     * Report progress for bulk operations
     */
    reportProgress(operation, processed, total, originalBytes, compressedBytes) {
        this.config.onProgress({
            operation,
            processed,
            total,
            originalBytes,
            compressedBytes,
        });
    }
    /**
     * Get cost savings statistics
     */
    getCostStats() {
        return { ...this.costStats };
    }
    /**
     * Reset cost statistics
     */
    resetCostStats() {
        this.costStats = {
            originalBytes: 0,
            compressedBytes: 0,
            compressionRatio: 0,
            bytesSaved: 0,
            percentSaved: 0,
            vectorCount: 0,
        };
    }
    /**
     * Get compression ratio as a human-readable string
     */
    getCompressionRatio() {
        return `${this.costStats.compressionRatio.toFixed(1)}x`;
    }
    /**
     * Get bytes saved as a human-readable string
     */
    getBytesSaved() {
        const bytes = this.costStats.bytesSaved;
        if (bytes < 1024)
            return `${bytes} B`;
        if (bytes < 1024 * 1024)
            return `${(bytes / 1024).toFixed(2)} KB`;
        if (bytes < 1024 * 1024 * 1024)
            return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
        return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    }
}
exports.StratusAdapter = StratusAdapter;
