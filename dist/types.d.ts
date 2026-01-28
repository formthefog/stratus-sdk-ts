/**
 * Stratus Compression SDK - Type Definitions
 *
 * @purpose Core type definitions for vector compression
 */
export declare enum CompressionLevel {
    Low = 0,
    Medium = 1,
    High = 2,
    VeryHigh = 3
}
export interface CompressionOptions {
    level?: CompressionLevel;
    model?: string;
    preservePrecision?: number;
    profile?: 'auto' | 'openai' | 'generic';
    precisionMap?: Uint8Array;
}
export interface CompressionInfo {
    version: number;
    level: string;
    originalDims: number;
    compressedBytes: number;
    ratio: number;
    estimatedQuality: number;
}
export interface CompressionProfile {
    name: string;
    model: string;
    dimensions: number;
    centroid: Float32Array;
    precisionMaps: {
        low: Uint8Array;
        medium: Uint8Array;
        high: Uint8Array;
        veryHigh: Uint8Array;
    };
    metadata: {
        trainedOn: string;
        sampleSize: number;
        avgQuality: number;
    };
}
