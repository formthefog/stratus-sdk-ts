/**
 * M-JEPA-G Model-Specific Compression Profile
 *
 * Optimized quantization for M-JEPA-G embeddings (512-dim small, 768-dim medium).
 *
 * @purpose Model-specific compression tuning for M-JEPA-G world model embeddings
 * @spec SPEC.md#m-jepa-g-integration
 */
import { CompressionLevel } from '../types.js';
export interface MJepaProfile {
    dimensions: number;
    precisionMap: Uint8Array;
    description: string;
}
/**
 * M-JEPA-G model characteristics:
 *
 * - 512 dimensions (small model) or 768 dimensions (medium model)
 * - L2-normalized representations (norm ≈ 1.0)
 * - Continuous semantic space (not token-based)
 * - Trained for representation prediction (world modeling)
 * - Earlier dimensions encode core semantic features
 * - Later dimensions encode refinement/contextual details
 *
 * Optimization strategy:
 * - Allocate higher precision to early dimensions (semantic core)
 * - Progressive precision reduction for later dimensions
 * - Balance quality vs compression for different use cases
 * - Optimized for state trajectory prediction tasks
 */
/**
 * High Quality profile for M-JEPA-G 768-dim embeddings.
 *
 * Quality: 99.9%+ cosine similarity
 * Ratio: ~0.28x (72% savings)
 */
export declare const MJEPA_768_HIGH_QUALITY: MJepaProfile;
/**
 * Balanced profile for M-JEPA-G 768-dim embeddings.
 *
 * Quality: 99.7%+ cosine similarity
 * Ratio: ~0.25x (75% savings)
 */
export declare const MJEPA_768_BALANCED: MJepaProfile;
/**
 * High Compression profile for M-JEPA-G 768-dim embeddings.
 *
 * Quality: 99.5%+ cosine similarity
 * Ratio: ~0.22x (78% savings)
 */
export declare const MJEPA_768_HIGH_COMPRESSION: MJepaProfile;
/**
 * Ultra Compression profile for M-JEPA-G 768-dim embeddings.
 *
 * Quality: 99.0%+ cosine similarity
 * Ratio: ~0.20x (80% savings)
 */
export declare const MJEPA_768_ULTRA_COMPRESSION: MJepaProfile;
/**
 * High Quality profile for M-JEPA-G 512-dim embeddings.
 *
 * Quality: 99.9%+ cosine similarity
 * Ratio: ~0.28x (72% savings)
 */
export declare const MJEPA_512_HIGH_QUALITY: MJepaProfile;
/**
 * Balanced profile for M-JEPA-G 512-dim embeddings.
 *
 * Quality: 99.7%+ cosine similarity
 * Ratio: ~0.25x (75% savings)
 */
export declare const MJEPA_512_BALANCED: MJepaProfile;
/**
 * High Compression profile for M-JEPA-G 512-dim embeddings.
 *
 * Quality: 99.5%+ cosine similarity
 * Ratio: ~0.22x (78% savings)
 */
export declare const MJEPA_512_HIGH_COMPRESSION: MJepaProfile;
/**
 * Ultra Compression profile for M-JEPA-G 512-dim embeddings.
 *
 * Quality: 99.0%+ cosine similarity
 * Ratio: ~0.20x (80% savings)
 */
export declare const MJEPA_512_ULTRA_COMPRESSION: MJepaProfile;
/**
 * Get M-JEPA-G profile by compression level and dimension count.
 */
export declare function getMJepaProfile(level: CompressionLevel, dimensions?: 512 | 768): MJepaProfile;
/**
 * Validate that an embedding matches M-JEPA-G dimensions.
 */
export declare function isMJepaEmbedding(embedding: Float32Array | number[]): boolean;
/**
 * Auto-detect if embedding is from M-JEPA-G based on characteristics.
 *
 * Heuristics:
 * - Length is 512 or 768
 * - L2 norm is close to 1.0 (normalized)
 * - Value distribution characteristics of continuous semantic space
 */
export declare function detectMJepa(embedding: Float32Array | number[]): boolean;
