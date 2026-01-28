/**
 * OpenAI Model-Specific Compression Profile
 *
 * Optimized quantization for OpenAI text-embedding-3-small (1536 dimensions).
 *
 * @purpose Model-specific compression tuning for OpenAI embeddings
 * @spec SPEC.md#phase-3-model-specific-profiles
 */
import { CompressionLevel } from '../types.js';
export interface OpenAIProfile {
    dimensions: number;
    precisionMap: Uint8Array;
    description: string;
}
/**
 * OpenAI text-embedding-3-small characteristics:
 *
 * - 1536 dimensions
 * - Normalized to unit length (L2 norm = 1)
 * - Value range typically [-0.5, 0.5] with most values near zero
 * - First ~512 dims carry most semantic information (higher variance)
 * - Last ~512 dims are less informative (lower variance, noise)
 *
 * Optimization strategy:
 * - Allocate more precision to early dimensions (semantic signal)
 * - Reduce precision in later dimensions (noise)
 * - Balance quality vs compression for different use cases
 */
/**
 * High Quality profile for OpenAI embeddings.
 *
 * Quality: 99.9%+ cosine similarity
 * Ratio: ~0.28x (72% savings)
 */
export declare const OPENAI_HIGH_QUALITY: OpenAIProfile;
/**
 * Balanced profile for OpenAI embeddings.
 *
 * Quality: 99.7%+ cosine similarity
 * Ratio: ~0.25x (75% savings)
 */
export declare const OPENAI_BALANCED: OpenAIProfile;
/**
 * High Compression profile for OpenAI embeddings.
 *
 * Quality: 99.5%+ cosine similarity
 * Ratio: ~0.22x (78% savings)
 */
export declare const OPENAI_HIGH_COMPRESSION: OpenAIProfile;
/**
 * Ultra Compression profile for OpenAI embeddings.
 *
 * Quality: 99.0%+ cosine similarity
 * Ratio: ~0.20x (80% savings)
 *
 * Use when storage is critical and slight quality loss acceptable.
 */
export declare const OPENAI_ULTRA_COMPRESSION: OpenAIProfile;
/**
 * Get OpenAI profile by compression level.
 */
export declare function getOpenAIProfile(level: CompressionLevel): OpenAIProfile;
/**
 * Validate that an embedding matches OpenAI dimensions.
 */
export declare function isOpenAIEmbedding(embedding: Float32Array | number[]): boolean;
/**
 * Auto-detect if embedding is from OpenAI based on characteristics.
 *
 * Heuristics:
 * - Length is 1536
 * - L2 norm is close to 1.0 (normalized)
 * - Values mostly in range [-0.5, 0.5]
 */
export declare function detectOpenAI(embedding: Float32Array | number[]): boolean;
