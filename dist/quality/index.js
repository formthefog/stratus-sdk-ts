"use strict";
/**
 * Stratus Compression SDK - Quality Analysis
 *
 * @purpose Quality analysis tools for compression evaluation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateRankingMetrics = exports.ndcg = exports.recallAtK = exports.calculateStats = exports.dimensionErrors = exports.manhattanDistance = exports.euclideanDistance = exports.cosineSimilarity = exports.analyzeQuality = void 0;
var analyzer_js_1 = require("./analyzer.js");
Object.defineProperty(exports, "analyzeQuality", { enumerable: true, get: function () { return analyzer_js_1.analyzeQuality; } });
var metrics_js_1 = require("./metrics.js");
Object.defineProperty(exports, "cosineSimilarity", { enumerable: true, get: function () { return metrics_js_1.cosineSimilarity; } });
Object.defineProperty(exports, "euclideanDistance", { enumerable: true, get: function () { return metrics_js_1.euclideanDistance; } });
Object.defineProperty(exports, "manhattanDistance", { enumerable: true, get: function () { return metrics_js_1.manhattanDistance; } });
Object.defineProperty(exports, "dimensionErrors", { enumerable: true, get: function () { return metrics_js_1.dimensionErrors; } });
Object.defineProperty(exports, "calculateStats", { enumerable: true, get: function () { return metrics_js_1.calculateStats; } });
var ranking_js_1 = require("./ranking.js");
Object.defineProperty(exports, "recallAtK", { enumerable: true, get: function () { return ranking_js_1.recallAtK; } });
Object.defineProperty(exports, "ndcg", { enumerable: true, get: function () { return ranking_js_1.ndcg; } });
Object.defineProperty(exports, "calculateRankingMetrics", { enumerable: true, get: function () { return ranking_js_1.calculateRankingMetrics; } });
