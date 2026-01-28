/**
 * Stratus Compression SDK - Quality Analyzer
 *
 * @purpose Main quality analysis tool for compressed embeddings
 */

import {
  QualityMetrics,
  QualityReport,
  QualityAnalysisOptions,
  DistributionMetrics,
} from './types.js';
import {
  cosineSimilarity,
  euclideanDistance,
  manhattanDistance,
  dimensionErrors,
  calculateStats,
  klDivergence,
  wassersteinDistance,
} from './metrics.js';
import { calculateRankingMetrics } from './ranking.js';

/**
 * Analyze compression quality for a set of vectors
 *
 * @param original - Original uncompressed vectors
 * @param restored - Decompressed vectors
 * @param options - Analysis options
 * @returns Comprehensive quality report
 */
export function analyzeQuality(
  original: Float32Array[],
  restored: Float32Array[],
  options: QualityAnalysisOptions = {}
): QualityReport {
  if (original.length !== restored.length) {
    throw new Error('Original and restored must have same length');
  }

  if (original.length === 0) {
    throw new Error('Cannot analyze empty vector set');
  }

  // Apply sampling if requested
  const sampleSize = Math.min(
    options.sampleSize || original.length,
    original.length
  );
  const sampledOriginal =
    sampleSize < original.length
      ? sampleVectors(original, sampleSize)
      : original;
  const sampledRestored =
    sampleSize < original.length
      ? sampleVectors(restored, sampleSize)
      : restored;

  // Calculate all metrics
  const metrics = calculateAllMetrics(
    sampledOriginal,
    sampledRestored,
    options
  );

  // Generate warnings and recommendations
  const warnings = generateWarnings(metrics);
  const recommendations = generateRecommendations(metrics);

  // Generate summary
  const summary = generateSummary(metrics);

  return {
    summary,
    metrics,
    warnings,
    recommendations,
    timestamp: new Date().toISOString(),
    sampleSize: sampledOriginal.length,
  };
}

/**
 * Calculate all quality metrics
 */
function calculateAllMetrics(
  original: Float32Array[],
  restored: Float32Array[],
  options: QualityAnalysisOptions
): QualityMetrics {
  // Similarity metrics
  const cosineSims: number[] = [];
  const euclideanDists: number[] = [];
  const manhattanDists: number[] = [];
  const dimensionErrorsList: number[][] = [];

  for (let i = 0; i < original.length; i++) {
    cosineSims.push(cosineSimilarity(original[i], restored[i]));
    euclideanDists.push(euclideanDistance(original[i], restored[i]));
    manhattanDists.push(manhattanDistance(original[i], restored[i]));

    if (options.includeDimensionAnalysis !== false) {
      const errors = dimensionErrors(original[i], restored[i]);
      dimensionErrorsList.push(errors.distribution);
    }
  }

  // Aggregate dimension errors
  let maxDimError = 0;
  let avgDimError = 0;
  let dimErrorDist: number[] = [];

  if (dimensionErrorsList.length > 0) {
    for (let i = 0; i < original.length; i++) {
      const errors = dimensionErrors(original[i], restored[i]);
      maxDimError = Math.max(maxDimError, errors.max);
      avgDimError += errors.avg;
    }
    avgDimError /= original.length;

    // Average error per dimension across all vectors
    const dims = original[0].length;
    dimErrorDist = new Array(dims).fill(0);
    for (const errors of dimensionErrorsList) {
      for (let d = 0; d < dims; d++) {
        dimErrorDist[d] += errors[d];
      }
    }
    for (let d = 0; d < dims; d++) {
      dimErrorDist[d] /= dimensionErrorsList.length;
    }
  }

  // Ranking metrics (if enough vectors)
  const rankingQueries = Math.min(
    options.rankingQueries || 100,
    Math.floor(original.length * 0.1)
  );
  const queries =
    original.length >= 100
      ? sampleVectors(original, rankingQueries)
      : [];

  const ranking =
    queries.length > 0
      ? calculateRankingMetrics(queries, original, restored)
      : {
          recallAt10: 1,
          recallAt50: 1,
          recallAt100: 1,
          ndcg: 1,
          spearmanCorrelation: 1,
        };

  // Distribution metrics
  const distribution = calculateDistributionMetrics(original, restored);

  // Overall quality score (weighted average)
  const overallQuality = calculateOverallQuality({
    cosineSimilarity: calculateStats(cosineSims),
    ranking,
    distribution,
  });

  // Recommendation
  const recommendation = getRecommendation(overallQuality);
  const suggestedLevel = getSuggestedLevel(overallQuality);

  return {
    cosineSimilarity: calculateStats(cosineSims),
    euclideanDistance: calculateStats(euclideanDists),
    manhattanDistance: calculateStats(manhattanDists),
    maxDimensionError: maxDimError,
    avgDimensionError: avgDimError,
    dimensionErrorDistribution: dimErrorDist,
    rankingPreservation: ranking,
    distributionShift: distribution,
    overallQuality,
    recommendation,
    suggestedLevel,
  };
}

/**
 * Calculate distribution shift metrics
 */
function calculateDistributionMetrics(
  original: Float32Array[],
  restored: Float32Array[]
): DistributionMetrics {
  // Flatten all vectors for distribution analysis
  const origFlat: number[] = [];
  const restFlat: number[] = [];

  for (let i = 0; i < original.length; i++) {
    for (let d = 0; d < original[i].length; d++) {
      origFlat.push(original[i][d]);
      restFlat.push(restored[i][d]);
    }
  }

  // Mean shift
  const origMean = origFlat.reduce((s, v) => s + v, 0) / origFlat.length;
  const restMean = restFlat.reduce((s, v) => s + v, 0) / restFlat.length;
  const meanShift = Math.abs(origMean - restMean);

  // Variance ratio
  const origVar =
    origFlat.reduce((s, v) => s + Math.pow(v - origMean, 2), 0) /
    origFlat.length;
  const restVar =
    restFlat.reduce((s, v) => s + Math.pow(v - restMean, 2), 0) /
    restFlat.length;
  const varianceRatio = restVar / (origVar || 1);

  // Simplified KL divergence (using histograms)
  const numBins = 100;
  const origHist = histogram(origFlat, numBins);
  const restHist = histogram(restFlat, numBins);
  const kl = klDivergence(origHist, restHist);

  // Wasserstein distance
  const wasserstein = wassersteinDistance(origFlat, restFlat);

  return {
    klDivergence: kl,
    wasserstein,
    meanShift,
    varianceRatio,
  };
}

/**
 * Create histogram from values
 */
function histogram(values: number[], numBins: number): number[] {
  // Find min/max without spread operator (avoids stack overflow)
  let min = values[0];
  let max = values[0];
  for (let i = 1; i < values.length; i++) {
    if (values[i] < min) min = values[i];
    if (values[i] > max) max = values[i];
  }

  const range = max - min;
  const binSize = range / numBins;

  const bins = new Array(numBins).fill(0);
  for (const val of values) {
    const bin = Math.min(
      Math.floor((val - min) / binSize),
      numBins - 1
    );
    bins[bin]++;
  }

  // Normalize to probability
  const total = values.length;
  for (let i = 0; i < bins.length; i++) {
    bins[i] /= total;
  }

  return bins;
}

/**
 * Calculate overall quality score
 */
function calculateOverallQuality(metrics: {
  cosineSimilarity: { mean: number };
  ranking: { recallAt10: number; ndcg: number };
  distribution: { klDivergence: number };
}): number {
  // Weighted average of key metrics
  const weights = {
    cosineSimilarity: 0.4,
    recallAt10: 0.3,
    ndcg: 0.2,
    klDivergence: 0.1,
  };

  const score =
    metrics.cosineSimilarity.mean * weights.cosineSimilarity +
    metrics.ranking.recallAt10 * weights.recallAt10 +
    metrics.ranking.ndcg * weights.ndcg +
    (1 - Math.min(metrics.distribution.klDivergence, 1)) *
      weights.klDivergence;

  return score;
}

/**
 * Get quality recommendation
 */
function getRecommendation(
  score: number
): 'excellent' | 'good' | 'acceptable' | 'poor' {
  if (score >= 0.98) return 'excellent';
  if (score >= 0.95) return 'good';
  if (score >= 0.90) return 'acceptable';
  return 'poor';
}

/**
 * Get suggested compression level
 */
function getSuggestedLevel(score: number): string {
  if (score >= 0.98) return 'Can use High or VeryHigh compression';
  if (score >= 0.95) return 'Use Medium compression (current)';
  if (score >= 0.90) return 'Use Low compression';
  return 'Compression may not be suitable for this dataset';
}

/**
 * Generate warnings based on metrics
 */
function generateWarnings(metrics: QualityMetrics): string[] {
  const warnings: string[] = [];

  if (metrics.cosineSimilarity.mean < 0.95) {
    warnings.push(
      `Low cosine similarity (${(metrics.cosineSimilarity.mean * 100).toFixed(1)}%). ` +
        'Consider using a lower compression level.'
    );
  }

  if (metrics.rankingPreservation.recallAt10 < 0.90) {
    warnings.push(
      `Poor ranking preservation (${(metrics.rankingPreservation.recallAt10 * 100).toFixed(1)}% recall@10). ` +
        'Search quality may be impacted.'
    );
  }

  if (metrics.distributionShift.varianceRatio < 0.8 || metrics.distributionShift.varianceRatio > 1.2) {
    warnings.push(
      `Significant variance shift (ratio: ${metrics.distributionShift.varianceRatio.toFixed(2)}). ` +
        'Vector distribution has changed.'
    );
  }

  if (metrics.maxDimensionError > 0.1) {
    warnings.push(
      `High maximum dimension error (${metrics.maxDimensionError.toFixed(4)}). ` +
        'Some dimensions have large errors.'
    );
  }

  return warnings;
}

/**
 * Generate recommendations based on metrics
 */
function generateRecommendations(metrics: QualityMetrics): string[] {
  const recommendations: string[] = [];

  if (metrics.recommendation === 'excellent') {
    recommendations.push(
      'Quality is excellent! Consider using a higher compression level to save more space.'
    );
  } else if (metrics.recommendation === 'good') {
    recommendations.push(
      'Quality is good. Current compression level is appropriate.'
    );
  } else if (metrics.recommendation === 'acceptable') {
    recommendations.push(
      'Quality is acceptable but could be better. Consider using a lower compression level.'
    );
  } else {
    recommendations.push(
      'Quality is poor. Use a lower compression level or consider if compression is appropriate for this dataset.'
    );
  }

  if (metrics.cosineSimilarity.stddev > 0.05) {
    recommendations.push(
      'High variance in similarity scores. Quality varies significantly across vectors. ' +
        'Consider analyzing outliers separately.'
    );
  }

  if (metrics.rankingPreservation.recallAt10 > 0.98 && metrics.cosineSimilarity.mean > 0.99) {
    recommendations.push(
      'Excellent ranking preservation! Safe to use in production search systems.'
    );
  }

  return recommendations;
}

/**
 * Generate text summary
 */
function generateSummary(metrics: QualityMetrics): string {
  const sim = (metrics.cosineSimilarity.mean * 100).toFixed(2);
  const recall = (metrics.rankingPreservation.recallAt10 * 100).toFixed(1);

  return (
    `Quality Analysis: ${metrics.recommendation.toUpperCase()} ` +
    `(Overall Score: ${(metrics.overallQuality * 100).toFixed(1)}%). ` +
    `Cosine similarity: ${sim}%, Recall@10: ${recall}%. ` +
    metrics.suggestedLevel
  );
}

/**
 * Sample vectors randomly
 */
function sampleVectors(vectors: Float32Array[], n: number): Float32Array[] {
  if (n >= vectors.length) return vectors;

  const sampled: Float32Array[] = [];
  const indices = new Set<number>();

  while (indices.size < n) {
    const idx = Math.floor(Math.random() * vectors.length);
    if (!indices.has(idx)) {
      indices.add(idx);
      sampled.push(vectors[idx]);
    }
  }

  return sampled;
}
