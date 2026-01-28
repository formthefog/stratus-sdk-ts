"use strict";
/**
 * Stratus Compression SDK - Ranking Quality Metrics
 *
 * @purpose Measure how well compression preserves search ranking
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.recallAtK = recallAtK;
exports.ndcg = ndcg;
exports.calculateRankingMetrics = calculateRankingMetrics;
const metrics_js_1 = require("./metrics.js");
/**
 * Calculate recall@K (what % of top-K results are preserved)
 */
function recallAtK(query, originalCorpus, compressedCorpus, k) {
    if (originalCorpus.length !== compressedCorpus.length) {
        throw new Error('Corpus sizes must match');
    }
    // Get top-K from original
    const originalSims = originalCorpus.map((vec, idx) => ({
        idx,
        sim: (0, metrics_js_1.cosineSimilarity)(query, vec),
    }));
    originalSims.sort((a, b) => b.sim - a.sim);
    const topKOriginal = new Set(originalSims.slice(0, k).map(x => x.idx));
    // Get top-K from compressed
    const compressedSims = compressedCorpus.map((vec, idx) => ({
        idx,
        sim: (0, metrics_js_1.cosineSimilarity)(query, vec),
    }));
    compressedSims.sort((a, b) => b.sim - a.sim);
    const topKCompressed = new Set(compressedSims.slice(0, k).map(x => x.idx));
    // Calculate overlap
    let overlap = 0;
    for (const idx of topKOriginal) {
        if (topKCompressed.has(idx)) {
            overlap++;
        }
    }
    return overlap / k;
}
/**
 * Calculate NDCG (Normalized Discounted Cumulative Gain)
 */
function ndcg(query, originalCorpus, compressedCorpus, k) {
    if (originalCorpus.length !== compressedCorpus.length) {
        throw new Error('Corpus sizes must match');
    }
    // Get original relevance scores (similarities)
    const originalSims = originalCorpus.map((vec, idx) => ({
        idx,
        sim: (0, metrics_js_1.cosineSimilarity)(query, vec),
    }));
    originalSims.sort((a, b) => b.sim - a.sim);
    // Get compressed ranking
    const compressedSims = compressedCorpus.map((vec, idx) => ({
        idx,
        sim: (0, metrics_js_1.cosineSimilarity)(query, vec),
    }));
    compressedSims.sort((a, b) => b.sim - a.sim);
    // Build relevance map from original ranking
    const relevance = new Map();
    for (let i = 0; i < originalSims.length; i++) {
        relevance.set(originalSims[i].idx, originalSims[i].sim);
    }
    // Calculate DCG for compressed ranking
    let dcg = 0;
    for (let i = 0; i < Math.min(k, compressedSims.length); i++) {
        const idx = compressedSims[i].idx;
        const rel = relevance.get(idx) || 0;
        dcg += rel / Math.log2(i + 2); // i+2 because positions start at 1
    }
    // Calculate ideal DCG (original ranking)
    let idcg = 0;
    for (let i = 0; i < Math.min(k, originalSims.length); i++) {
        const rel = originalSims[i].sim;
        idcg += rel / Math.log2(i + 2);
    }
    if (idcg === 0) {
        return 0;
    }
    return dcg / idcg;
}
/**
 * Calculate full ranking metrics
 */
function calculateRankingMetrics(queries, originalCorpus, compressedCorpus) {
    const recall10s = [];
    const recall50s = [];
    const recall100s = [];
    const ndcgs = [];
    const correlations = [];
    for (const query of queries) {
        // Recall at different K values
        recall10s.push(recallAtK(query, originalCorpus, compressedCorpus, 10));
        recall50s.push(recallAtK(query, originalCorpus, compressedCorpus, 50));
        recall100s.push(recallAtK(query, originalCorpus, compressedCorpus, 100));
        // NDCG
        ndcgs.push(ndcg(query, originalCorpus, compressedCorpus, 100));
        // Spearman correlation
        const originalSims = originalCorpus.map(vec => (0, metrics_js_1.cosineSimilarity)(query, vec));
        const compressedSims = compressedCorpus.map(vec => (0, metrics_js_1.cosineSimilarity)(query, vec));
        correlations.push(spearmanCorrelation(originalSims, compressedSims));
    }
    return {
        recallAt10: mean(recall10s),
        recallAt50: mean(recall50s),
        recallAt100: mean(recall100s),
        ndcg: mean(ndcgs),
        spearmanCorrelation: mean(correlations),
    };
}
function mean(values) {
    if (values.length === 0)
        return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
}
function spearmanCorrelation(x, y) {
    if (x.length !== y.length) {
        throw new Error('Arrays must have same length');
    }
    const n = x.length;
    const rankX = getRanks(x);
    const rankY = getRanks(y);
    let d2Sum = 0;
    for (let i = 0; i < n; i++) {
        const d = rankX[i] - rankY[i];
        d2Sum += d * d;
    }
    return 1 - (6 * d2Sum) / (n * (n * n - 1));
}
function getRanks(values) {
    const sorted = values
        .map((val, idx) => ({ val, idx }))
        .sort((a, b) => b.val - a.val);
    const ranks = new Array(values.length);
    for (let i = 0; i < sorted.length; i++) {
        ranks[sorted[i].idx] = i + 1;
    }
    return ranks;
}
