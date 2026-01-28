/**
 * Stratus Compression SDK - Metadata
 *
 * @purpose Extract compression metadata from compressed vectors
 */
import { CompressionInfo } from './types.js';
/**
 * Get compression metadata from a compressed vector
 *
 * @param compressed - Compressed vector
 * @returns Compression info
 */
export declare function getCompressionInfo(compressed: Uint8Array): CompressionInfo;
