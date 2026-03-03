"use strict";
/**
 * Stratus SDK
 *
 * TypeScript SDK for the Stratus API with embedding compression utilities.
 *
 * @purpose Main entry point for the Stratus SDK
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.VERSION = exports.generateCacheKey = exports.retryWithBackoff = exports.BatchProcessor = exports.HealthChecker = exports.CreditMonitor = exports.RateLimiter = exports.SimpleCache = exports.compareModels = exports.ModelComparison = exports.TrajectoryPredictor = exports.StratusAPIError = exports.MJepaGClient = exports.StratusQdrant = exports.StratusWeaviate = exports.StratusPinecone = exports.StratusAdapter = exports.calculateRankingMetrics = exports.ndcg = exports.recallAtK = exports.calculateStats = exports.dimensionErrors = exports.manhattanDistance = exports.euclideanDistance = exports.analyzeQuality = exports.isMJepaEmbedding = exports.detectMJepa = exports.getMJepaProfile = exports.MJEPA_512_ULTRA_COMPRESSION = exports.MJEPA_512_HIGH_COMPRESSION = exports.MJEPA_512_BALANCED = exports.MJEPA_512_HIGH_QUALITY = exports.MJEPA_768_ULTRA_COMPRESSION = exports.MJEPA_768_HIGH_COMPRESSION = exports.MJEPA_768_BALANCED = exports.MJEPA_768_HIGH_QUALITY = exports.isOpenAIEmbedding = exports.detectOpenAI = exports.getOpenAIProfile = exports.OPENAI_ULTRA_COMPRESSION = exports.OPENAI_HIGH_COMPRESSION = exports.OPENAI_BALANCED = exports.OPENAI_HIGH_QUALITY = exports.CompressionLevel = exports.cosineSimilarity = exports.getCompressionInfo = exports.decompressBatch = exports.decompress = exports.compressBatch = exports.compress = void 0;
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
var types_js_1 = require("./types.js");
Object.defineProperty(exports, "CompressionLevel", { enumerable: true, get: function () { return types_js_1.CompressionLevel; } });
var openai_js_1 = require("./profiles/openai.js");
Object.defineProperty(exports, "OPENAI_HIGH_QUALITY", { enumerable: true, get: function () { return openai_js_1.OPENAI_HIGH_QUALITY; } });
Object.defineProperty(exports, "OPENAI_BALANCED", { enumerable: true, get: function () { return openai_js_1.OPENAI_BALANCED; } });
Object.defineProperty(exports, "OPENAI_HIGH_COMPRESSION", { enumerable: true, get: function () { return openai_js_1.OPENAI_HIGH_COMPRESSION; } });
Object.defineProperty(exports, "OPENAI_ULTRA_COMPRESSION", { enumerable: true, get: function () { return openai_js_1.OPENAI_ULTRA_COMPRESSION; } });
Object.defineProperty(exports, "getOpenAIProfile", { enumerable: true, get: function () { return openai_js_1.getOpenAIProfile; } });
Object.defineProperty(exports, "detectOpenAI", { enumerable: true, get: function () { return openai_js_1.detectOpenAI; } });
Object.defineProperty(exports, "isOpenAIEmbedding", { enumerable: true, get: function () { return openai_js_1.isOpenAIEmbedding; } });
var mjepa_js_1 = require("./profiles/mjepa.js");
Object.defineProperty(exports, "MJEPA_768_HIGH_QUALITY", { enumerable: true, get: function () { return mjepa_js_1.MJEPA_768_HIGH_QUALITY; } });
Object.defineProperty(exports, "MJEPA_768_BALANCED", { enumerable: true, get: function () { return mjepa_js_1.MJEPA_768_BALANCED; } });
Object.defineProperty(exports, "MJEPA_768_HIGH_COMPRESSION", { enumerable: true, get: function () { return mjepa_js_1.MJEPA_768_HIGH_COMPRESSION; } });
Object.defineProperty(exports, "MJEPA_768_ULTRA_COMPRESSION", { enumerable: true, get: function () { return mjepa_js_1.MJEPA_768_ULTRA_COMPRESSION; } });
Object.defineProperty(exports, "MJEPA_512_HIGH_QUALITY", { enumerable: true, get: function () { return mjepa_js_1.MJEPA_512_HIGH_QUALITY; } });
Object.defineProperty(exports, "MJEPA_512_BALANCED", { enumerable: true, get: function () { return mjepa_js_1.MJEPA_512_BALANCED; } });
Object.defineProperty(exports, "MJEPA_512_HIGH_COMPRESSION", { enumerable: true, get: function () { return mjepa_js_1.MJEPA_512_HIGH_COMPRESSION; } });
Object.defineProperty(exports, "MJEPA_512_ULTRA_COMPRESSION", { enumerable: true, get: function () { return mjepa_js_1.MJEPA_512_ULTRA_COMPRESSION; } });
Object.defineProperty(exports, "getMJepaProfile", { enumerable: true, get: function () { return mjepa_js_1.getMJepaProfile; } });
Object.defineProperty(exports, "detectMJepa", { enumerable: true, get: function () { return mjepa_js_1.detectMJepa; } });
Object.defineProperty(exports, "isMJepaEmbedding", { enumerable: true, get: function () { return mjepa_js_1.isMJepaEmbedding; } });
var index_js_1 = require("./quality/index.js");
Object.defineProperty(exports, "analyzeQuality", { enumerable: true, get: function () { return index_js_1.analyzeQuality; } });
Object.defineProperty(exports, "euclideanDistance", { enumerable: true, get: function () { return index_js_1.euclideanDistance; } });
Object.defineProperty(exports, "manhattanDistance", { enumerable: true, get: function () { return index_js_1.manhattanDistance; } });
Object.defineProperty(exports, "dimensionErrors", { enumerable: true, get: function () { return index_js_1.dimensionErrors; } });
Object.defineProperty(exports, "calculateStats", { enumerable: true, get: function () { return index_js_1.calculateStats; } });
Object.defineProperty(exports, "recallAtK", { enumerable: true, get: function () { return index_js_1.recallAtK; } });
Object.defineProperty(exports, "ndcg", { enumerable: true, get: function () { return index_js_1.ndcg; } });
Object.defineProperty(exports, "calculateRankingMetrics", { enumerable: true, get: function () { return index_js_1.calculateRankingMetrics; } });
var index_js_2 = require("./integrations/index.js");
Object.defineProperty(exports, "StratusAdapter", { enumerable: true, get: function () { return index_js_2.StratusAdapter; } });
Object.defineProperty(exports, "StratusPinecone", { enumerable: true, get: function () { return index_js_2.StratusPinecone; } });
Object.defineProperty(exports, "StratusWeaviate", { enumerable: true, get: function () { return index_js_2.StratusWeaviate; } });
Object.defineProperty(exports, "StratusQdrant", { enumerable: true, get: function () { return index_js_2.StratusQdrant; } });
var index_js_3 = require("./integrations/mjepa/index.js");
Object.defineProperty(exports, "MJepaGClient", { enumerable: true, get: function () { return index_js_3.MJepaGClient; } });
Object.defineProperty(exports, "StratusAPIError", { enumerable: true, get: function () { return index_js_3.StratusAPIError; } });
Object.defineProperty(exports, "TrajectoryPredictor", { enumerable: true, get: function () { return index_js_3.TrajectoryPredictor; } });
Object.defineProperty(exports, "ModelComparison", { enumerable: true, get: function () { return index_js_3.ModelComparison; } });
Object.defineProperty(exports, "compareModels", { enumerable: true, get: function () { return index_js_3.compareModels; } });
Object.defineProperty(exports, "SimpleCache", { enumerable: true, get: function () { return index_js_3.SimpleCache; } });
Object.defineProperty(exports, "RateLimiter", { enumerable: true, get: function () { return index_js_3.RateLimiter; } });
Object.defineProperty(exports, "CreditMonitor", { enumerable: true, get: function () { return index_js_3.CreditMonitor; } });
Object.defineProperty(exports, "HealthChecker", { enumerable: true, get: function () { return index_js_3.HealthChecker; } });
Object.defineProperty(exports, "BatchProcessor", { enumerable: true, get: function () { return index_js_3.BatchProcessor; } });
Object.defineProperty(exports, "retryWithBackoff", { enumerable: true, get: function () { return index_js_3.retryWithBackoff; } });
Object.defineProperty(exports, "generateCacheKey", { enumerable: true, get: function () { return index_js_3.generateCacheKey; } });
exports.VERSION = '0.1.0';
