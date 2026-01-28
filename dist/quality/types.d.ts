/**
 * Stratus Compression SDK - Quality Analysis Types
 *
 * @purpose Type definitions for quality analysis tools
 */
export interface QualityMetrics {
    cosineSimilarity: StatsSummary;
    euclideanDistance: StatsSummary;
    manhattanDistance: StatsSummary;
    maxDimensionError: number;
    avgDimensionError: number;
    dimensionErrorDistribution: number[];
    rankingPreservation: RankingMetrics;
    distributionShift: DistributionMetrics;
    overallQuality: number;
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
    recallAt10: number;
    recallAt50: number;
    recallAt100: number;
    ndcg: number;
    spearmanCorrelation: number;
}
export interface DistributionMetrics {
    klDivergence: number;
    wasserstein: number;
    meanShift: number;
    varianceRatio: number;
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
    sampleSize?: number;
    rankingQueries?: number;
    topK?: number[];
    includeDimensionAnalysis?: boolean;
    generateVisualReport?: boolean;
}
