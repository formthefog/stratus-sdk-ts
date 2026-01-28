/**
 * Stratus Compression SDK - Quality Analysis
 *
 * @purpose Quality analysis tools for compression evaluation
 */

export { analyzeQuality } from './analyzer.js';
export {
  cosineSimilarity,
  euclideanDistance,
  manhattanDistance,
  dimensionErrors,
  calculateStats,
} from './metrics.js';
export {
  recallAtK,
  ndcg,
  calculateRankingMetrics,
} from './ranking.js';

// Export types
export type {
  QualityMetrics,
  QualityReport,
  QualityAnalysisOptions,
  StatsSummary,
  RankingMetrics,
  DistributionMetrics,
} from './types.js';
