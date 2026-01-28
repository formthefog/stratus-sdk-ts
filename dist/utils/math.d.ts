/**
 * Math utilities for compression
 *
 * @purpose Math helpers for quantization and normalization
 */
/**
 * Clamp a value between min and max
 */
export declare function clamp(value: number, min: number, max: number): number;
/**
 * Compute mean of an array
 */
export declare function mean(values: number[] | Float32Array): number;
/**
 * Compute variance of an array
 */
export declare function variance(values: number[] | Float32Array): number;
/**
 * Find min and max values in array
 */
export declare function minMax(values: number[] | Float32Array): [number, number];
