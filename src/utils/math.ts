/**
 * Math utilities for compression
 *
 * @purpose Math helpers for quantization and normalization
 */

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Compute mean of an array
 */
export function mean(values: number[] | Float32Array): number {
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
  }
  return sum / values.length;
}

/**
 * Compute variance of an array
 */
export function variance(values: number[] | Float32Array): number {
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
export function minMax(values: number[] | Float32Array): [number, number] {
  let min = values[0];
  let max = values[0];
  for (let i = 1; i < values.length; i++) {
    if (values[i] < min) min = values[i];
    if (values[i] > max) max = values[i];
  }
  return [min, max];
}
