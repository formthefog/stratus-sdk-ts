/**
 * Stratus Compression SDK - Quality Metrics
 *
 * @purpose Individual quality metric calculations
 */
import { StatsSummary } from './types.js';
/**
 * Calculate cosine similarity between two vectors
 */
export declare function cosineSimilarity(a: Float32Array, b: Float32Array): number;
/**
 * Calculate Euclidean distance
 */
export declare function euclideanDistance(a: Float32Array, b: Float32Array): number;
/**
 * Calculate Manhattan (L1) distance
 */
export declare function manhattanDistance(a: Float32Array, b: Float32Array): number;
/**
 * Calculate per-dimension errors
 */
export declare function dimensionErrors(original: Float32Array, restored: Float32Array): {
    max: number;
    avg: number;
    distribution: number[];
};
/**
 * Calculate statistical summary of an array of values
 */
export declare function calculateStats(values: number[]): StatsSummary;
/**
 * Calculate KL divergence between two distributions
 */
export declare function klDivergence(p: number[], q: number[]): number;
/**
 * Calculate Wasserstein (Earth Mover's) distance
 * Simplified 1D version
 */
export declare function wassersteinDistance(p: number[], q: number[]): number;
/**
 * Calculate Spearman rank correlation
 */
export declare function spearmanCorrelation(x: number[], y: number[]): number;
