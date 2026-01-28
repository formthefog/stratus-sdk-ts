/**
 * Stratus Embeddings Compression SDK
 *
 * High-performance vector compression for embedding vectors.
 * Compress by 10-20x with minimal quality loss.
 *
 * @purpose Main entry point for Stratus compression SDK
 */

// Core functions
export { compress, compressBatch } from './compress.js';
export { decompress, decompressBatch } from './decompress.js';
export { getCompressionInfo } from './info.js';
export { cosineSimilarity } from './similarity.js';

// Types and enums
export {
  CompressionLevel,
  type CompressionOptions,
  type CompressionInfo,
  type CompressionProfile,
} from './types.js';

// Model-specific profiles
export {
  OPENAI_HIGH_QUALITY,
  OPENAI_BALANCED,
  OPENAI_HIGH_COMPRESSION,
  OPENAI_ULTRA_COMPRESSION,
  getOpenAIProfile,
  detectOpenAI,
  isOpenAIEmbedding,
  type OpenAIProfile,
} from './profiles/openai.js';

// Quality analysis tools
export {
  analyzeQuality,
  euclideanDistance,
  manhattanDistance,
  dimensionErrors,
  calculateStats,
  recallAtK,
  ndcg,
  calculateRankingMetrics,
} from './quality/index.js';

// Quality analysis types
export type {
  QualityMetrics,
  QualityReport,
  QualityAnalysisOptions,
  StatsSummary,
  RankingMetrics,
  DistributionMetrics,
} from './quality/index.js';

// Version
export const VERSION = '0.1.0';
