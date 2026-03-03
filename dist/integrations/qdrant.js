"use strict";
/**
 * Stratus SDK - Qdrant Integration
 *
 * Drop-in wrapper for Qdrant with transparent compression.
 *
 * @purpose Qdrant vector database integration with transparent compression
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.StratusQdrant = void 0;
const base_js_1 = require("./base.js");
class StratusQdrant extends base_js_1.StratusAdapter {
    constructor(client, collectionName, config) {
        super(config);
        this.client = client;
        this.collectionName = collectionName;
    }
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
                    vector: [0],
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
    async search(params) {
        const searchParams = {
            ...params,
            vector: [0],
            with_payload: true,
        };
        const results = await this.client.search(this.collectionName, searchParams);
        if (this.config.autoDecompress) {
            return results.map((result) => {
                const payload = result.payload;
                if (payload?._stratus_compressed && payload?._stratus_data) {
                    const compressed = Buffer.from(payload._stratus_data, 'base64');
                    const decompressed = this.decompressVector(new Uint8Array(compressed));
                    const { _stratus_compressed: _c, _stratus_level: _l, _stratus_original_dim: _d, _stratus_data: _dd, ...userPayload } = payload;
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
    async retrieve(ids) {
        const results = await this.client.retrieve(this.collectionName, { ids });
        if (this.config.autoDecompress) {
            return results.map((point) => {
                const payload = point.payload;
                if (payload?._stratus_compressed && payload?._stratus_data) {
                    const compressed = Buffer.from(payload._stratus_data, 'base64');
                    const decompressed = this.decompressVector(new Uint8Array(compressed));
                    const { _stratus_compressed: _c, _stratus_level: _l, _stratus_original_dim: _d, _stratus_data: _dd, ...userPayload } = payload;
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
    async delete(ids) {
        return this.client.delete(this.collectionName, { points: ids });
    }
    async getCollectionInfo() {
        return this.client.getCollectionInfo(this.collectionName);
    }
    createBatches(items, batchSize) {
        const batches = [];
        for (let i = 0; i < items.length; i += batchSize) {
            batches.push(items.slice(i, i + batchSize));
        }
        return batches;
    }
}
exports.StratusQdrant = StratusQdrant;
