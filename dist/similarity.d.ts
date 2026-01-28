/**
 * Stratus Compression SDK - Similarity Functions
 *
 * @purpose Vector similarity computations
 */
/**
 * Compute cosine similarity between two vectors
 *
 * @param a - First vector
 * @param b - Second vector
 * @returns Cosine similarity (0-1)
 */
export declare function cosineSimilarity(a: Float32Array | number[], b: Float32Array | number[]): number;
