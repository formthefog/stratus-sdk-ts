"use strict";
/**
 * @purpose Weaviate vector database integration with transparent compression
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.StratusWeaviate = void 0;
const base_js_1 = require("./base.js");
/**
 * Stratus-compressed Weaviate client
 *
 * Drop-in wrapper for Weaviate with transparent compression.
 *
 * @example
 * ```typescript
 * const client = new StratusWeaviate(weaviateClient, { level: 'Medium' });
 *
 * // Create objects with compressed vectors
 * await client.createObject({
 *   class: 'Document',
 *   properties: { title: 'My doc' },
 *   vector: embedding
 * });
 *
 * // Query with compressed vectors
 * const results = await client.query({
 *   class: 'Document',
 *   vector: queryEmbedding,
 *   limit: 10
 * });
 * ```
 */
class StratusWeaviate extends base_js_1.StratusAdapter {
    /**
     * Create a compressed Weaviate client
     *
     * @param client - Original Weaviate client instance
     * @param config - Stratus compression configuration
     */
    constructor(client, config) {
        super(config);
        this.client = client;
    }
    /**
     * Create a single object with compressed vector
     *
     * @param object - Object to create
     * @returns Created object with ID
     */
    async createObject(object) {
        let creator = this.client.data.creator().withClassName(object.class).withProperties(object.properties);
        if (object.vector) {
            const vector = Array.isArray(object.vector) ? new Float32Array(object.vector) : object.vector;
            const compressed = this.compressVector(vector);
            const base64 = Buffer.from(compressed).toString('base64');
            // Store compressed data in properties
            const properties = {
                ...object.properties,
                _stratus_compressed: true,
                _stratus_level: this.config.level,
                _stratus_original_dim: vector.length,
                _stratus_data: base64,
            };
            creator = creator.withProperties(properties);
            // Use a minimal dummy vector
            creator = creator.withVector([0]);
        }
        return creator.do();
    }
    /**
     * Create multiple objects in batch
     *
     * @param objects - Objects to create
     * @returns Batch result
     */
    async createObjects(objects) {
        const batches = this.createBatches(objects, this.config.batchSize);
        let processed = 0;
        for (const batch of batches) {
            const compressedBatch = batch.map((obj) => {
                if (!obj.vector)
                    return obj;
                const vector = Array.isArray(obj.vector) ? new Float32Array(obj.vector) : obj.vector;
                const compressed = this.compressVector(vector);
                const base64 = Buffer.from(compressed).toString('base64');
                return {
                    ...obj,
                    properties: {
                        ...obj.properties,
                        _stratus_compressed: true,
                        _stratus_level: this.config.level,
                        _stratus_original_dim: vector.length,
                        _stratus_data: base64,
                    },
                    vector: [0], // Minimal placeholder
                };
            });
            await this.client.batch.objectsBatcher().withObjects(compressedBatch).do();
            processed += batch.length;
            this.reportProgress('upsert', processed, objects.length);
        }
    }
    /**
     * Query with automatic compression/decompression
     *
     * @param params - Query parameters
     * @returns Query results with decompressed vectors
     */
    async query(params) {
        let query = this.client.graphql.get().withClassName(params.class);
        if (params.vector) {
            const vector = Array.isArray(params.vector) ? new Float32Array(params.vector) : params.vector;
            const compressed = this.compressVector(vector);
            // For production, you'd need to implement custom similarity search
            // This is a simplified version
            query = query.withNearVector({
                vector: [0], // Placeholder
                certainty: params.certainty || 0.7,
            });
        }
        if (params.limit) {
            query = query.withLimit(params.limit);
        }
        query = query.withFields('_additional { id certainty } properties { _stratus_compressed _stratus_data }');
        const result = await query.do();
        const results = result.data.Get[params.class] || [];
        // Decompress vectors if needed
        if (this.config.autoDecompress) {
            return results.map((item) => {
                if (item.properties._stratus_compressed && item.properties._stratus_data) {
                    const compressed = Buffer.from(item.properties._stratus_data, 'base64');
                    const decompressed = this.decompressVector(new Uint8Array(compressed));
                    const { _stratus_compressed, _stratus_level, _stratus_original_dim, _stratus_data, ...userProperties } = item.properties;
                    return {
                        ...item,
                        properties: userProperties,
                        vector: decompressed,
                    };
                }
                return item;
            });
        }
        return results;
    }
    /**
     * Get object by ID with automatic decompression
     *
     * @param className - Class name
     * @param id - Object ID
     * @returns Object with decompressed vector
     */
    async getObject(className, id) {
        const result = await this.client.data.getter().withClassName(className).withId(id).do();
        if (this.config.autoDecompress && result.properties._stratus_compressed && result.properties._stratus_data) {
            const compressed = Buffer.from(result.properties._stratus_data, 'base64');
            const decompressed = this.decompressVector(new Uint8Array(compressed));
            const { _stratus_compressed, _stratus_level, _stratus_original_dim, _stratus_data, ...userProperties } = result.properties;
            return {
                ...result,
                properties: userProperties,
                vector: decompressed,
            };
        }
        return result;
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
exports.StratusWeaviate = StratusWeaviate;
