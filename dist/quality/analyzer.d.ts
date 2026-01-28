/**
 * Stratus Compression SDK - Quality Analyzer
 *
 * @purpose Main quality analysis tool for compressed embeddings
 */
import { QualityReport, QualityAnalysisOptions } from './types.js';
/**
 * Analyze compression quality for a set of vectors
 *
 * @param original - Original uncompressed vectors
 * @param restored - Decompressed vectors
 * @param options - Analysis options
 * @returns Comprehensive quality report
 */
export declare function analyzeQuality(original: Float32Array[], restored: Float32Array[], options?: QualityAnalysisOptions): QualityReport;
