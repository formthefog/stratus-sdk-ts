"use strict";
/**
 * Stratus Embeddings Compression SDK
 *
 * High-performance vector compression for embedding vectors.
 * Compress by 10-20x with minimal quality loss.
 *
 * @purpose Main entry point for Stratus compression SDK
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.VERSION = exports.calculateRankingMetrics = exports.ndcg = exports.recallAtK = exports.calculateStats = exports.dimensionErrors = exports.manhattanDistance = exports.euclideanDistance = exports.analyzeQuality = exports.isOpenAIEmbedding = exports.detectOpenAI = exports.getOpenAIProfile = exports.OPENAI_ULTRA_COMPRESSION = exports.OPENAI_HIGH_COMPRESSION = exports.OPENAI_BALANCED = exports.OPENAI_HIGH_QUALITY = exports.CompressionLevel = exports.cosineSimilarity = exports.getCompressionInfo = exports.decompressBatch = exports.decompress = exports.compressBatch = exports.compress = void 0;
// Core functions
var compress_js_1 = require("./compress.js");
Object.defineProperty(exports, "compress", { enumerable: true, get: function () { return compress_js_1.compress; } });
Object.defineProperty(exports, "compressBatch", { enumerable: true, get: function () { return compress_js_1.compressBatch; } });
var decompress_js_1 = require("./decompress.js");
Object.defineProperty(exports, "decompress", { enumerable: true, get: function () { return decompress_js_1.decompress; } });
Object.defineProperty(exports, "decompressBatch", { enumerable: true, get: function () { return decompress_js_1.decompressBatch; } });
var info_js_1 = require("./info.js");
Object.defineProperty(exports, "getCompressionInfo", { enumerable: true, get: function () { return info_js_1.getCompressionInfo; } });
var similarity_js_1 = require("./similarity.js");
Object.defineProperty(exports, "cosineSimilarity", { enumerable: true, get: function () { return similarity_js_1.cosineSimilarity; } });
// Types and enums
var types_js_1 = require("./types.js");
Object.defineProperty(exports, "CompressionLevel", { enumerable: true, get: function () { return types_js_1.CompressionLevel; } });
// Model-specific profiles
var openai_js_1 = require("./profiles/openai.js");
Object.defineProperty(exports, "OPENAI_HIGH_QUALITY", { enumerable: true, get: function () { return openai_js_1.OPENAI_HIGH_QUALITY; } });
Object.defineProperty(exports, "OPENAI_BALANCED", { enumerable: true, get: function () { return openai_js_1.OPENAI_BALANCED; } });
Object.defineProperty(exports, "OPENAI_HIGH_COMPRESSION", { enumerable: true, get: function () { return openai_js_1.OPENAI_HIGH_COMPRESSION; } });
Object.defineProperty(exports, "OPENAI_ULTRA_COMPRESSION", { enumerable: true, get: function () { return openai_js_1.OPENAI_ULTRA_COMPRESSION; } });
Object.defineProperty(exports, "getOpenAIProfile", { enumerable: true, get: function () { return openai_js_1.getOpenAIProfile; } });
Object.defineProperty(exports, "detectOpenAI", { enumerable: true, get: function () { return openai_js_1.detectOpenAI; } });
Object.defineProperty(exports, "isOpenAIEmbedding", { enumerable: true, get: function () { return openai_js_1.isOpenAIEmbedding; } });
// Quality analysis tools
var index_js_1 = require("./quality/index.js");
Object.defineProperty(exports, "analyzeQuality", { enumerable: true, get: function () { return index_js_1.analyzeQuality; } });
Object.defineProperty(exports, "euclideanDistance", { enumerable: true, get: function () { return index_js_1.euclideanDistance; } });
Object.defineProperty(exports, "manhattanDistance", { enumerable: true, get: function () { return index_js_1.manhattanDistance; } });
Object.defineProperty(exports, "dimensionErrors", { enumerable: true, get: function () { return index_js_1.dimensionErrors; } });
Object.defineProperty(exports, "calculateStats", { enumerable: true, get: function () { return index_js_1.calculateStats; } });
Object.defineProperty(exports, "recallAtK", { enumerable: true, get: function () { return index_js_1.recallAtK; } });
Object.defineProperty(exports, "ndcg", { enumerable: true, get: function () { return index_js_1.ndcg; } });
Object.defineProperty(exports, "calculateRankingMetrics", { enumerable: true, get: function () { return index_js_1.calculateRankingMetrics; } });
// Version
exports.VERSION = '0.1.0';
