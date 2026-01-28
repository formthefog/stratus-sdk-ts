/**
 * Stratus Compression SDK - Quality Analysis Types
 *
 * @purpose Type definitions for quality analysis tools
 */

export interface QualityMetrics {
  // Similarity metrics
  cosineSimilarity: StatsSummary;
  euclideanDistance: StatsSummary;
  manhattanDistance: StatsSummary;

  // Dimension-level metrics
  maxDimensionError: number;
  avgDimensionError: number;
  dimensionErrorDistribution: number[];

  // Ranking metrics
  rankingPreservation: RankingMetrics;

  // Distribution metrics
  distributionShift: DistributionMetrics;

  // Overall assessment
  overallQuality: number;  // 0-1 score
  recommendation: 'excellent' | 'good' | 'acceptable' | 'poor';
  suggestedLevel: string;
}

export interface StatsSummary {
  mean: number;
  median: number;
  min: number;
  max: number;
  stddev: number;
  percentile95: number;
  percentile99: number;
}

export interface RankingMetrics {
  recallAt10: number;   // Top-10 overlap
  recallAt50: number;   // Top-50 overlap
  recallAt100: number;  // Top-100 overlap
  ndcg: number;         // Normalized Discounted Cumulative Gain
  spearmanCorrelation: number;  // Ranking correlation
}

export interface DistributionMetrics {
  klDivergence: number;        // KL divergence
  wasserstein: number;         // Wasserstein distance
  meanShift: number;           // Mean value shift
  varianceRatio: number;       // Variance ratio
}

export interface QualityReport {
  summary: string;
  metrics: QualityMetrics;
  warnings: string[];
  recommendations: string[];
  timestamp: string;
  compressionLevel?: string;
  sampleSize: number;
}

export interface QualityAnalysisOptions {
  // Number of sample vectors to analyze (default: all)
  sampleSize?: number;

  // Number of query vectors for ranking tests (default: 100)
  rankingQueries?: number;

  // Top-K values to test for ranking (default: [10, 50, 100])
  topK?: number[];

  // Include detailed per-dimension analysis
  includeDimensionAnalysis?: boolean;

  // Generate visual report (ASCII charts)
  generateVisualReport?: boolean;
}
