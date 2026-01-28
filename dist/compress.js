"use strict";
/**
 * Stratus Compression SDK - Compression
 *
 * @purpose Main compression function
 * @spec PRD.md#compression-algorithm
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.compress = compress;
exports.compressBatch = compressBatch;
const types_js_1 = require("./types.js");
const index_js_1 = require("./quantize/index.js");
const index_js_2 = require("./entropy/index.js");
const index_js_3 = require("./packing/index.js");
const openai_js_1 = require("./profiles/openai.js");
/**
 * Compress a vector embedding
 *
 * @param vector - Float32Array or number[] of embedding values
 * @param options - Compression options
 * @returns Compressed vector as Uint8Array
 */
function compress(vector, options = {}) {
    const level = options.level ?? types_js_1.CompressionLevel.Medium;
    // Convert to Float32Array if needed
    const vec = vector instanceof Float32Array ? vector : new Float32Array(vector);
    const dimensions = vec.length;
    // Step 1: Delta encoding (center & scale)
    const centroid = (0, index_js_1.getDefaultCentroid)(dimensions);
    const { normalized, scale } = (0, index_js_1.applyDelta)(vec, centroid);
    // Step 2: Adaptive quantization
    let precisionMap;
    if (options.precisionMap) {
        // Use custom precision map
        precisionMap = options.precisionMap;
    }
    else if (options.profile === 'openai' || (options.profile === 'auto' && (0, openai_js_1.detectOpenAI)(vec))) {
        // Use OpenAI-specific profile
        const profile = (0, openai_js_1.getOpenAIProfile)(level);
        precisionMap = profile.precisionMap;
    }
    else {
        // Use generic precision map
        precisionMap = (0, index_js_1.getPrecisionMap)(dimensions, level);
    }
    const quantized = (0, index_js_1.quantize)(normalized, precisionMap);
    // Step 3: Entropy coding (Huffman)
    const { encoded, codeLengths } = (0, index_js_2.huffmanEncode)(quantized);
    // Step 4: Binary packing
    const compressed = (0, index_js_3.pack)(centroid, precisionMap, codeLengths, encoded, level, scale);
    return compressed;
}
/**
 * Compress multiple vectors in batch
 *
 * @param vectors - Array of vectors
 * @param options - Compression options
 * @returns Array of compressed vectors
 */
function compressBatch(vectors, options = {}) {
    return vectors.map(v => compress(v, options));
}
