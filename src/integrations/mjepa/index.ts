/**
 * M-JEPA-G Integration
 *
 * Complete toolkit for working with M-JEPA-G world model:
 * - Type-safe API client
 * - Trajectory prediction tools
 * - Model comparison utilities
 * - Production helpers
 *
 * @purpose Comprehensive M-JEPA-G integration for Stratus SDK
 * @spec Plan: M-JEPA-G Ecosystem Integration
 */

// Client
export { MJepaGClient } from './client.js';

// Trajectory prediction
export { TrajectoryPredictor } from './trajectory.js';

// Model comparison
export { ModelComparison, compareModels } from './comparison.js';

// Production helpers
export {
  SimpleCache,
  RateLimiter,
  CreditMonitor,
  HealthChecker,
  BatchProcessor,
  retryWithBackoff,
  generateCacheKey,
} from './helpers.js';

// Types
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
} from './types.js';

export type {
  ModelName,
  TaskType,
  CompressionLevel,
  ModelMetrics,
  ComparisonOptions,
  ComparisonResult,
} from './comparison.js';
