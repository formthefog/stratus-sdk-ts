"use strict";
/**
 * Stratus Compression SDK - Decompression
 *
 * @purpose Main decompression function
 * @spec PRD.md#decompression-algorithm
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.decompress = decompress;
exports.decompressBatch = decompressBatch;
const index_js_1 = require("./quantize/index.js");
const index_js_2 = require("./entropy/index.js");
const index_js_3 = require("./packing/index.js");
/**
 * Decompress a compressed vector
 *
 * @param compressed - Compressed vector (Uint8Array)
 * @returns Decompressed vector as Float32Array
 */
function decompress(compressed) {
    // Step 1: Unpack binary
    const { centroid, precisionMap, codeLengths, encoded, dimensions, scale, } = (0, index_js_3.unpack)(compressed);
    // Step 2: Huffman decode
    const quantized = (0, index_js_2.huffmanDecode)(encoded, codeLengths, dimensions);
    // Step 3: Dequantize
    const normalized = (0, index_js_1.dequantize)(quantized, precisionMap);
    // Step 4: Reverse delta encoding (denormalize)
    const vector = (0, index_js_1.reverseDelta)(normalized, scale, centroid);
    return vector;
}
/**
 * Decompress multiple vectors in batch
 *
 * @param compressed - Array of compressed vectors
 * @returns Array of decompressed vectors
 */
function decompressBatch(compressed) {
    return compressed.map(c => decompress(c));
}
