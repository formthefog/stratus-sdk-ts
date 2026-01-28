"use strict";
/**
 * Stratus Compression SDK - Quality Metrics
 *
 * @purpose Individual quality metric calculations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.cosineSimilarity = cosineSimilarity;
exports.euclideanDistance = euclideanDistance;
exports.manhattanDistance = manhattanDistance;
exports.dimensionErrors = dimensionErrors;
exports.calculateStats = calculateStats;
exports.klDivergence = klDivergence;
exports.wassersteinDistance = wassersteinDistance;
exports.spearmanCorrelation = spearmanCorrelation;
/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a, b) {
    if (a.length !== b.length) {
        throw new Error('Vectors must have same length');
    }
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);
    if (normA === 0 || normB === 0) {
        return 0;
    }
    return dotProduct / (normA * normB);
}
/**
 * Calculate Euclidean distance
 */
function euclideanDistance(a, b) {
    if (a.length !== b.length) {
        throw new Error('Vectors must have same length');
    }
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
        const diff = a[i] - b[i];
        sum += diff * diff;
    }
    return Math.sqrt(sum);
}
/**
 * Calculate Manhattan (L1) distance
 */
function manhattanDistance(a, b) {
    if (a.length !== b.length) {
        throw new Error('Vectors must have same length');
    }
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
        sum += Math.abs(a[i] - b[i]);
    }
    return sum;
}
/**
 * Calculate per-dimension errors
 */
function dimensionErrors(original, restored) {
    if (original.length !== restored.length) {
        throw new Error('Vectors must have same length');
    }
    const errors = [];
    let sum = 0;
    let max = 0;
    for (let i = 0; i < original.length; i++) {
        const error = Math.abs(original[i] - restored[i]);
        errors.push(error);
        sum += error;
        max = Math.max(max, error);
    }
    return {
        max,
        avg: sum / original.length,
        distribution: errors,
    };
}
/**
 * Calculate statistical summary of an array of values
 */
function calculateStats(values) {
    if (values.length === 0) {
        return {
            mean: 0,
            median: 0,
            min: 0,
            max: 0,
            stddev: 0,
            percentile95: 0,
            percentile99: 0,
        };
    }
    // Sort for median and percentiles
    const sorted = [...values].sort((a, b) => a - b);
    // Mean
    const sum = values.reduce((acc, val) => acc + val, 0);
    const mean = sum / values.length;
    // Median
    const mid = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 === 0
        ? (sorted[mid - 1] + sorted[mid]) / 2
        : sorted[mid];
    // Min/Max
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    // Standard deviation
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    const variance = squaredDiffs.reduce((acc, val) => acc + val, 0) / values.length;
    const stddev = Math.sqrt(variance);
    // Percentiles
    const p95Index = Math.floor(sorted.length * 0.95);
    const p99Index = Math.floor(sorted.length * 0.99);
    const percentile95 = sorted[p95Index];
    const percentile99 = sorted[p99Index];
    return {
        mean,
        median,
        min,
        max,
        stddev,
        percentile95,
        percentile99,
    };
}
/**
 * Calculate KL divergence between two distributions
 */
function klDivergence(p, q) {
    if (p.length !== q.length) {
        throw new Error('Distributions must have same length');
    }
    let kl = 0;
    const epsilon = 1e-10; // Prevent log(0)
    for (let i = 0; i < p.length; i++) {
        const pi = Math.max(p[i], epsilon);
        const qi = Math.max(q[i], epsilon);
        kl += pi * Math.log(pi / qi);
    }
    return kl;
}
/**
 * Calculate Wasserstein (Earth Mover's) distance
 * Simplified 1D version
 */
function wassersteinDistance(p, q) {
    if (p.length !== q.length) {
        throw new Error('Distributions must have same length');
    }
    // Sort both distributions
    const pSorted = [...p].sort((a, b) => a - b);
    const qSorted = [...q].sort((a, b) => a - b);
    // Calculate cumulative difference
    let sum = 0;
    for (let i = 0; i < pSorted.length; i++) {
        sum += Math.abs(pSorted[i] - qSorted[i]);
    }
    return sum / pSorted.length;
}
/**
 * Calculate Spearman rank correlation
 */
function spearmanCorrelation(x, y) {
    if (x.length !== y.length) {
        throw new Error('Arrays must have same length');
    }
    const n = x.length;
    // Convert to ranks
    const rankX = getRanks(x);
    const rankY = getRanks(y);
    // Calculate d^2 sum
    let d2Sum = 0;
    for (let i = 0; i < n; i++) {
        const d = rankX[i] - rankY[i];
        d2Sum += d * d;
    }
    // Spearman formula
    const rho = 1 - (6 * d2Sum) / (n * (n * n - 1));
    return rho;
}
/**
 * Convert values to ranks
 */
function getRanks(values) {
    const sorted = values
        .map((val, idx) => ({ val, idx }))
        .sort((a, b) => b.val - a.val); // Descending for similarity
    const ranks = new Array(values.length);
    for (let i = 0; i < sorted.length; i++) {
        ranks[sorted[i].idx] = i + 1;
    }
    return ranks;
}
