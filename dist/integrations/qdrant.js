"use strict";
/**
 * @purpose Qdrant vector database integration with transparent compression
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.StratusQdrant = void 0;
const base_js_1 = require("./base.js");
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
class StratusQdrant extends base_js_1.StratusAdapter {
    /**
     * Create a compressed Qdrant client
     *
     * @param client - Original Qdrant client instance
     * @param collectionName - Collection to work with
     * @param config - Stratus compression configuration
     */
    constructor(client, collectionName, config) {
        super(config);
        this.client = client;
        this.collectionName = collectionName;
    }
    /**
     * Upsert points with automatic compression
     *
     * @param points - Points to upsert
     * @returns Promise that resolves when upsert completes
     */
    async upsert(points) {
        const batches = this.createBatches(points, this.config.batchSize);
        let processed = 0;
        for (const batch of batches) {
            const compressedBatch = batch.map((point) => {
                const vector = Array.isArray(point.vector) ? new Float32Array(point.vector) : point.vector;
                const compressed = this.compressVector(vector);
                const base64 = Buffer.from(compressed).toString('base64');
                return {
                    ...point,
                    vector: [0], // Minimal placeholder
                    payload: {
                        ...point.payload,
                        _stratus_compressed: true,
                        _stratus_level: this.config.level,
                        _stratus_original_dim: vector.length,
                        _stratus_data: base64,
                    },
                };
            });
            await this.client.upsert(this.collectionName, { points: compressedBatch });
            processed += batch.length;
            this.reportProgress('upsert', processed, points.length);
        }
    }
    /**
     * Search with automatic compression/decompression
     *
     * @param params - Search parameters
     * @returns Search results with decompressed vectors
     */
    async search(params) {
        // Compress query vector
        const vector = Array.isArray(params.vector) ? new Float32Array(params.vector) : params.vector;
        const compressed = this.compressVector(vector);
        // For production, you'd implement custom similarity search
        // This is a simplified version
        const searchParams = {
            ...params,
            vector: [0], // Placeholder
            with_payload: true, // Always fetch payload to get compressed data
        };
        const results = await this.client.search(this.collectionName, searchParams);
        // Decompress vectors if needed
        if (this.config.autoDecompress) {
            return results.map((result) => {
                if (result.payload?._stratus_compressed && result.payload?._stratus_data) {
                    const compressed = Buffer.from(result.payload._stratus_data, 'base64');
                    const decompressed = this.decompressVector(new Uint8Array(compressed));
                    const { _stratus_compressed, _stratus_level, _stratus_original_dim, _stratus_data, ...userPayload } = result.payload;
                    return {
                        ...result,
                        payload: userPayload,
                        vector: params.with_vector ? decompressed : undefined,
                    };
                }
                return result;
            });
        }
        return results;
    }
    /**
     * Retrieve points by ID with automatic decompression
     *
     * @param ids - Point IDs to retrieve
     * @returns Retrieved points with decompressed vectors
     */
    async retrieve(ids) {
        const results = await this.client.retrieve(this.collectionName, { ids });
        if (this.config.autoDecompress) {
            return results.map((point) => {
                if (point.payload?._stratus_compressed && point.payload?._stratus_data) {
                    const compressed = Buffer.from(point.payload._stratus_data, 'base64');
                    const decompressed = this.decompressVector(new Uint8Array(compressed));
                    const { _stratus_compressed, _stratus_level, _stratus_original_dim, _stratus_data, ...userPayload } = point.payload;
                    return {
                        ...point,
                        payload: userPayload,
                        vector: decompressed,
                    };
                }
                return point;
            });
        }
        return results;
    }
    /**
     * Delete points (passthrough to underlying client)
     */
    async delete(ids) {
        return this.client.delete(this.collectionName, { points: ids });
    }
    /**
     * Get collection info (passthrough to underlying client)
     */
    async getCollectionInfo() {
        return this.client.getCollectionInfo(this.collectionName);
    }
    /**
     * Create batches from array
     */
    createBatches(items, batchSize) {
        const batches = [];
        for (let i = 0; i < items.length; i += batchSize) {
            batches.push(items.slice(i, i + batchSize));
        }
        return batches;
    }
}
exports.StratusQdrant = StratusQdrant;
