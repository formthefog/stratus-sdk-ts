/**
 * Stratus Compression SDK - Ranking Quality Metrics
 *
 * @purpose Measure how well compression preserves search ranking
 */
import { RankingMetrics } from './types.js';
/**
 * Calculate recall@K (what % of top-K results are preserved)
 */
export declare function recallAtK(query: Float32Array, originalCorpus: Float32Array[], compressedCorpus: Float32Array[], k: number): number;
/**
 * Calculate NDCG (Normalized Discounted Cumulative Gain)
 */
export declare function ndcg(query: Float32Array, originalCorpus: Float32Array[], compressedCorpus: Float32Array[], k: number): number;
/**
 * Calculate full ranking metrics
 */
export declare function calculateRankingMetrics(queries: Float32Array[], originalCorpus: Float32Array[], compressedCorpus: Float32Array[]): RankingMetrics;
