"use strict";
/**
 * Stratus SDK - Pinecone Integration
 *
 * Drop-in replacement for Pinecone Index with transparent compression.
 *
 * @purpose Pinecone vector database integration with transparent compression
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.StratusPinecone = void 0;
const base_js_1 = require("./base.js");
class StratusPinecone extends base_js_1.StratusAdapter {
    constructor(index, config) {
        super(config);
        this.index = index;
    }
    async upsert(vectors) {
        const batches = this.createBatches(vectors, this.config.batchSize);
        let processed = 0;
        for (const batch of batches) {
            const compressedBatch = batch.map((v) => {
                const values = Array.isArray(v.values) ? new Float32Array(v.values) : v.values;
                const compressed = this.compressVector(values);
                const base64 = Buffer.from(compressed).toString('base64');
                const metadata = {
                    ...v.metadata,
                    _stratus_compressed: true,
                    _stratus_level: String(this.config.level),
                    _stratus_original_dim: values.length,
                    _stratus_data: base64,
                };
                return {
                    ...v,
                    values: [0],
                    metadata,
                };
            });
            await this.index.upsert(compressedBatch);
            processed += batch.length;
            this.reportProgress('upsert', processed, vectors.length);
        }
    }
    async query(params) {
        let queryParams = { ...params };
        if (params.vector) {
            queryParams = {
                ...params,
                vector: [0],
                includeMetadata: true,
                includeValues: true,
            };
        }
        const result = await this.index.query(queryParams);
        if (this.config.autoDecompress && params.includeValues) {
            result.matches = result.matches.map((match) => {
                const meta = match.metadata;
                if (meta?._stratus_compressed && meta?._stratus_data) {
                    const compressed = Buffer.from(meta._stratus_data, 'base64');
                    const decompressed = this.decompressVector(new Uint8Array(compressed));
                    const { _stratus_compressed: _c, _stratus_level: _l, _stratus_original_dim: _d, _stratus_data: _dd, ...userMetadata } = meta;
                    return {
                        ...match,
                        values: decompressed,
                        metadata: userMetadata,
                    };
                }
                return match;
            });
        }
        return result;
    }
    async fetch(ids) {
        const result = await this.index.fetch(ids);
        if (this.config.autoDecompress) {
            for (const [id, vector] of Object.entries(result.vectors)) {
                const meta = vector.metadata;
                if (meta?._stratus_compressed && meta?._stratus_data) {
                    const compressed = Buffer.from(meta._stratus_data, 'base64');
                    const decompressed = this.decompressVector(new Uint8Array(compressed));
                    const { _stratus_compressed: _c, _stratus_level: _l, _stratus_original_dim: _d, _stratus_data: _dd, ...userMetadata } = meta;
                    result.vectors[id] = {
                        ...vector,
                        values: decompressed,
                        metadata: userMetadata,
                    };
                }
            }
        }
        return result;
    }
    async delete(ids) {
        return this.index.delete(ids);
    }
    async describeIndexStats() {
        return this.index.describeIndexStats();
    }
    async migrateIndex(_batchSize = 100) {
        throw new Error('Migration not yet implemented - requires Pinecone list operation');
    }
    createBatches(items, batchSize) {
        const batches = [];
        for (let i = 0; i < items.length; i += batchSize) {
            batches.push(items.slice(i, i + batchSize));
        }
        return batches;
    }
}
exports.StratusPinecone = StratusPinecone;
