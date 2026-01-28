/**
 * Stratus Embeddings Compression SDK
 *
 * High-performance vector compression for embedding vectors.
 * Compress by 10-20x with minimal quality loss.
 *
 * @purpose Main entry point for Stratus compression SDK
 */
export { compress, compressBatch } from './compress.js';
export { decompress, decompressBatch } from './decompress.js';
export { getCompressionInfo } from './info.js';
export { cosineSimilarity } from './similarity.js';
export { CompressionLevel, type CompressionOptions, type CompressionInfo, type CompressionProfile, } from './types.js';
export { OPENAI_HIGH_QUALITY, OPENAI_BALANCED, OPENAI_HIGH_COMPRESSION, OPENAI_ULTRA_COMPRESSION, getOpenAIProfile, detectOpenAI, isOpenAIEmbedding, type OpenAIProfile, } from './profiles/openai.js';
export { analyzeQuality, euclideanDistance, manhattanDistance, dimensionErrors, calculateStats, recallAtK, ndcg, calculateRankingMetrics, } from './quality/index.js';
export type { QualityMetrics, QualityReport, QualityAnalysisOptions, StatsSummary, RankingMetrics, DistributionMetrics, } from './quality/index.js';
export declare const VERSION = "0.1.0";
