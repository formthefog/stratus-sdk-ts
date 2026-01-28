/**
 * Stratus Compression SDK - Decompression
 *
 * @purpose Main decompression function
 * @spec PRD.md#decompression-algorithm
 */
/**
 * Decompress a compressed vector
 *
 * @param compressed - Compressed vector (Uint8Array)
 * @returns Decompressed vector as Float32Array
 */
export declare function decompress(compressed: Uint8Array): Float32Array;
/**
 * Decompress multiple vectors in batch
 *
 * @param compressed - Array of compressed vectors
 * @returns Array of decompressed vectors
 */
export declare function decompressBatch(compressed: Uint8Array[]): Float32Array[];
