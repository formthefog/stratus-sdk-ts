"use strict";
/**
 * Stratus SDK - Weaviate Integration
 *
 * Drop-in wrapper for Weaviate with transparent compression.
 *
 * @purpose Weaviate vector database integration with transparent compression
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.StratusWeaviate = void 0;
const base_js_1 = require("./base.js");
class StratusWeaviate extends base_js_1.StratusAdapter {
    constructor(client, config) {
        super(config);
        this.client = client;
    }
    async createObject(object) {
        let creator = this.client.data
            .creator()
            .withClassName(object.class)
            .withProperties(object.properties);
        if (object.vector) {
            const vector = Array.isArray(object.vector) ? new Float32Array(object.vector) : object.vector;
            const compressed = this.compressVector(vector);
            const base64 = Buffer.from(compressed).toString('base64');
            const properties = {
                ...object.properties,
                _stratus_compressed: true,
                _stratus_level: this.config.level,
                _stratus_original_dim: vector.length,
                _stratus_data: base64,
            };
            creator = creator.withProperties(properties).withVector([0]);
        }
        return creator.do();
    }
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
                    vector: [0],
                };
            });
            await this.client.batch.objectsBatcher().withObjects(compressedBatch).do();
            processed += batch.length;
            this.reportProgress('upsert', processed, objects.length);
        }
    }
    async query(params) {
        let query = this.client.graphql.get().withClassName(params.class);
        if (params.vector) {
            query = query.withNearVector({
                vector: [0],
                certainty: params.certainty ?? 0.7,
            });
        }
        if (params.limit) {
            query = query.withLimit(params.limit);
        }
        query = query.withFields('_additional { id certainty } properties { _stratus_compressed _stratus_data }');
        const result = await query.do();
        const results = result.data.Get[params.class] ?? [];
        if (this.config.autoDecompress) {
            return results.map((item) => {
                const props = item.properties;
                if (props._stratus_compressed && props._stratus_data) {
                    const compressed = Buffer.from(props._stratus_data, 'base64');
                    const decompressed = this.decompressVector(new Uint8Array(compressed));
                    const { _stratus_compressed: _c, _stratus_level: _l, _stratus_original_dim: _d, _stratus_data: _dd, ...userProperties } = props;
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
    async getObject(className, id) {
        const result = await this.client.data.getter().withClassName(className).withId(id).do();
        const props = result.properties;
        if (this.config.autoDecompress && props._stratus_compressed && props._stratus_data) {
            const compressed = Buffer.from(props._stratus_data, 'base64');
            const decompressed = this.decompressVector(new Uint8Array(compressed));
            const { _stratus_compressed: _c, _stratus_level: _l, _stratus_original_dim: _d, _stratus_data: _dd, ...userProperties } = props;
            return {
                ...result,
                properties: userProperties,
                vector: decompressed,
            };
        }
        return result;
    }
    createBatches(items, batchSize) {
        const batches = [];
        for (let i = 0; i < items.length; i += batchSize) {
            batches.push(items.slice(i, i + batchSize));
        }
        return batches;
    }
}
exports.StratusWeaviate = StratusWeaviate;
