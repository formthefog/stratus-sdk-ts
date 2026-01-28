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

export {
  MJEPA_768_HIGH_QUALITY,
  MJEPA_768_BALANCED,
  MJEPA_768_HIGH_COMPRESSION,
  MJEPA_768_ULTRA_COMPRESSION,
  MJEPA_512_HIGH_QUALITY,
  MJEPA_512_BALANCED,
  MJEPA_512_HIGH_COMPRESSION,
  MJEPA_512_ULTRA_COMPRESSION,
  getMJepaProfile,
  detectMJepa,
  isMJepaEmbedding,
  type MJepaProfile,
} from './profiles/mjepa.js';

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

// Vector database integrations
export {
  StratusAdapter,
  StratusPinecone,
  StratusWeaviate,
  StratusQdrant,
} from './integrations/index.js';

// M-JEPA-G integration
export {
  MJepaGClient,
  TrajectoryPredictor,
  ModelComparison,
  compareModels,
  SimpleCache,
  RateLimiter,
  CreditMonitor,
  HealthChecker,
  BatchProcessor,
  retryWithBackoff,
  generateCacheKey,
} from './integrations/mjepa/index.js';

export type {
  MJepaClientConfig,
  Message,
  MessageRole,
  ChatCompletionRequest,
  ChatCompletionResponse,
  ChatCompletionChunk,
  RolloutRequest,
  RolloutResponse,
  StatePrediction,
  Action,
  TrajectoryOptions,
  TrajectoryResult,
  BatchTrajectoryOptions,
  OptimizationCriteria,
  Usage,
  ModelName,
  TaskType,
  ModelMetrics,
  ComparisonOptions,
  ComparisonResult,
} from './integrations/mjepa/index.js';

// Integration types
export type {
  StratusIntegrationConfig,
  ProgressUpdate,
  CostStats,
  CompressedVectorMetadata,
  MigrationProgress,
  PineconeVector,
  PineconeQueryParams,
  PineconeQueryResult,
  PineconeMatch,
  PineconeIndex,
  WeaviateObject,
  WeaviateQueryParams,
  WeaviateResult,
  WeaviateClient,
  QdrantPoint,
  QdrantSearchParams,
  QdrantSearchResult,
  QdrantClient,
} from './integrations/index.js';

// Version
export const VERSION = '0.1.0';
