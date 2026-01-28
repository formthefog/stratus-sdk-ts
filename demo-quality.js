#!/usr/bin/env node
/**
 * Stratus Compression SDK - Quality Analysis Demo
 *
 * Demonstrates quality analysis tools for compression evaluation
 */

const stratus = require('./dist/index.js');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  STRATUS QUALITY ANALYZER - DEMO');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log();

// Generate realistic embedding vectors (simulating OpenAI text-embedding-3-small)
console.log('📦 Generating 100 test embedding vectors (1536-dim)...');
const vectors = [];
for (let i = 0; i < 100; i++) {
  const v = new Float32Array(1536);
  for (let d = 0; d < 1536; d++) {
    // Mix of different frequency components (more realistic than pure random)
    v[d] = Math.sin(d / 100) * 0.3 + Math.cos(d / 50 + i) * 0.2 + (Math.random() - 0.5) * 0.5;
  }
  vectors.push(v);
}
console.log(`   Generated: ${vectors.length} vectors`);
console.log();

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  ANALYZING COMPRESSION QUALITY');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log();

const levels = [
  { name: 'Low', level: stratus.CompressionLevel.Low },
  { name: 'Medium', level: stratus.CompressionLevel.Medium },
  { name: 'High', level: stratus.CompressionLevel.High },
  { name: 'VeryHigh', level: stratus.CompressionLevel.VeryHigh },
];

for (const { name, level } of levels) {
  console.log(`\n📊 ${name} Compression Level`);
  console.log('─'.repeat(60));

  // Compress and decompress
  const compressed = stratus.compressBatch(vectors, { level });
  const restored = stratus.decompressBatch(compressed);

  // Analyze quality
  const report = stratus.analyzeQuality(vectors, restored, {
    rankingQueries: 20,  // Use 20 vectors as queries
    includeDimensionAnalysis: true
  });

  // Display results
  console.log(`\n✨ Overall Assessment: ${report.metrics.recommendation.toUpperCase()}`);
  console.log(`   Quality Score: ${(report.metrics.overallQuality * 100).toFixed(2)}%`);
  console.log();

  console.log('📈 Similarity Metrics:');
  const cosine = report.metrics.cosineSimilarity;
  console.log(`   Cosine Similarity: ${(cosine.mean * 100).toFixed(4)}% (avg)`);
  console.log(`                      ${(cosine.min * 100).toFixed(4)}% (min)`);
  console.log(`                      ${(cosine.max * 100).toFixed(4)}% (max)`);
  console.log(`                      ${(cosine.stddev * 100).toFixed(4)}% (stddev)`);
  console.log();

  console.log('🎯 Dimension Errors:');
  console.log(`   Max error: ${report.metrics.maxDimensionError.toFixed(6)}`);
  console.log(`   Avg error: ${report.metrics.avgDimensionError.toFixed(6)}`);
  console.log();

  console.log('🔍 Ranking Preservation:');
  const ranking = report.metrics.rankingPreservation;
  console.log(`   Recall@10:  ${(ranking.recallAt10 * 100).toFixed(2)}%`);
  console.log(`   Recall@50:  ${(ranking.recallAt50 * 100).toFixed(2)}%`);
  console.log(`   Recall@100: ${(ranking.recallAt100 * 100).toFixed(2)}%`);
  console.log(`   NDCG:       ${(ranking.ndcg * 100).toFixed(2)}%`);
  console.log(`   Spearman:   ${(ranking.spearmanCorrelation * 100).toFixed(2)}%`);
  console.log();

  console.log('📊 Distribution Metrics:');
  const dist = report.metrics.distributionShift;
  console.log(`   KL Divergence:   ${dist.klDivergence.toFixed(6)}`);
  console.log(`   Wasserstein:     ${dist.wasserstein.toFixed(6)}`);
  console.log(`   Mean Shift:      ${dist.meanShift.toFixed(6)}`);
  console.log(`   Variance Ratio:  ${dist.varianceRatio.toFixed(4)}`);
  console.log();

  if (report.warnings.length > 0) {
    console.log('⚠️  Warnings:');
    report.warnings.forEach(w => console.log(`   - ${w}`));
    console.log();
  }

  if (report.recommendations.length > 0) {
    console.log('💡 Recommendations:');
    report.recommendations.forEach(r => console.log(`   - ${r}`));
  }
}

console.log();
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  COMPRESSION SIZE COMPARISON');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log();

const originalSize = vectors.length * 1536 * 4;
console.log(`Original size: ${(originalSize / 1024).toFixed(2)} KB`);
console.log();

for (const { name, level } of levels) {
  const compressed = stratus.compressBatch(vectors, { level });
  const compressedSize = compressed.reduce((sum, c) => sum + c.length, 0);
  const ratio = originalSize / compressedSize;

  console.log(`${name.padEnd(10)} ${(compressedSize / 1024).toFixed(2).padStart(8)} KB  (${ratio.toFixed(2)}x compression)`);
}

console.log();
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  SUMMARY');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log();
console.log('✅ Quality analysis: COMPLETE');
console.log('✅ All compression levels analyzed');
console.log('✅ Ranking preservation verified');
console.log('✅ Distribution metrics calculated');
console.log();
console.log('📝 Use analyzeQuality() to test compression on YOUR embeddings');
console.log('   before deploying to production!');
console.log();
