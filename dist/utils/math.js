"use strict";
/**
 * Math utilities for compression
 *
 * @purpose Math helpers for quantization and normalization
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.clamp = clamp;
exports.mean = mean;
exports.variance = variance;
exports.minMax = minMax;
/**
 * Clamp a value between min and max
 */
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}
/**
 * Compute mean of an array
 */
function mean(values) {
    let sum = 0;
    for (let i = 0; i < values.length; i++) {
        sum += values[i];
    }
    return sum / values.length;
}
/**
 * Compute variance of an array
 */
function variance(values) {
    const m = mean(values);
    let sumSq = 0;
    for (let i = 0; i < values.length; i++) {
        const diff = values[i] - m;
        sumSq += diff * diff;
    }
    return sumSq / values.length;
}
/**
 * Find min and max values in array
 */
function minMax(values) {
    let min = values[0];
    let max = values[0];
    for (let i = 1; i < values.length; i++) {
        if (values[i] < min)
            min = values[i];
        if (values[i] > max)
            max = values[i];
    }
    return [min, max];
}
