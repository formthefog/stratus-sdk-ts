/**
 * Stratus SDK
 *
 * TypeScript SDK for the Stratus API with embedding compression utilities.
 *
 * @purpose Main entry point for the Stratus SDK
 */

export { compress, compressBatch } from './compress.js';
export { decompress, decompressBatch } from './decompress.js';
export { getCompressionInfo } from './info.js';
export { cosineSimilarity } from './similarity.js';

export {
  CompressionLevel,
  type CompressionOptions,
  type CompressionInfo,
  type CompressionProfile,
} from './types.js';

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

export type {
  QualityMetrics,
  QualityReport,
  QualityAnalysisOptions,
  StatsSummary,
  RankingMetrics,
  DistributionMetrics,
} from './quality/index.js';

export {
  StratusAdapter,
  StratusPinecone,
  StratusWeaviate,
  StratusQdrant,
} from './integrations/index.js';

export {
  StratusClient,
  StratusAPIError,
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
  StratusClientConfig,
  Message,
  MessageRole,
  ContentBlock,
  ToolCall,
  ToolDefinition,
  ToolChoiceObject,
  StratusExtensions,
  ChatCompletionRequest,
  ChatCompletionResponse,
  ChatCompletionChunk,
  Usage,
  StratusMetadata,
  ExecutionTraceStep,
  BrainSignal,
  ActionStep,
  StatePrediction,
  RolloutRequest,
  RolloutResponse,
  RolloutSummary,
  HealthResponse,
  Model,
  ModelsListResponse,
  EmbeddingRequest,
  EmbeddingResponse,
  EmbeddingObject,
  AnthropicRequest,
  AnthropicResponse,
  AnthropicContentBlock,
  AnthropicTool,
  SetLLMKeysRequest,
  GetLLMKeysResponse,
  LLMProvider,
  CreditPackageName,
  CreditPackage,
  CreditPackagesResponse,
  CreditPurchaseResponse,
  PaymentChallenge,
  StratusErrorType,
  StratusErrorResponse,
  InsufficientCreditsErrorResponse,
  TrajectoryOptions,
  TrajectoryResult,
  BatchTrajectoryOptions,
  OptimizationCriteria,
  ModelName,
  TaskType,
  ModelMetrics,
  ComparisonOptions,
  ComparisonResult,
} from './integrations/mjepa/index.js';

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

export const VERSION = '0.1.0';
