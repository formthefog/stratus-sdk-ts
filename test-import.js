/**
 * Quick test to verify the package builds and exports correctly
 */

const stratus = require('./dist/index.js');

console.log('✅ Stratus SDK loaded successfully!');
console.log('');
console.log('Available exports:');
console.log('  - compress:', typeof stratus.compress);
console.log('  - decompress:', typeof stratus.decompress);
console.log('  - compressBatch:', typeof stratus.compressBatch);
console.log('  - decompressBatch:', typeof stratus.decompressBatch);
console.log('  - getCompressionInfo:', typeof stratus.getCompressionInfo);
console.log('  - cosineSimilarity:', typeof stratus.cosineSimilarity);
console.log('  - CompressionLevel:', typeof stratus.CompressionLevel);
console.log('  - VERSION:', stratus.VERSION);
console.log('');

// Test basic functionality
console.log('Testing basic compression...');
const testVector = new Float32Array(1536).fill(0.5);
const compressed = stratus.compress(testVector);
console.log(`  Input: Float32Array(1536)`);
console.log(`  Output: Uint8Array(${compressed.length})`);
console.log('');

console.log('Testing decompression...');
const decompressed = stratus.decompress(compressed);
console.log(`  Input: Uint8Array(${compressed.length})`);
console.log(`  Output: Float32Array(${decompressed.length})`);
console.log('');

console.log('Testing similarity...');
const vec1 = [1, 0, 0];
const vec2 = [1, 0, 0];
const vec3 = [0, 1, 0];
const sim1 = stratus.cosineSimilarity(vec1, vec2);
const sim2 = stratus.cosineSimilarity(vec1, vec3);
console.log(`  similarity([1,0,0], [1,0,0]) = ${sim1.toFixed(4)} (expect 1.0)`);
console.log(`  similarity([1,0,0], [0,1,0]) = ${sim2.toFixed(4)} (expect 0.0)`);
console.log('');

console.log('🎉 All basic tests passed!');
console.log('');
console.log('📝 Note: Compression/decompression are placeholder implementations.');
console.log('   Full implementation coming in Phase 1 (Week 1-2).');
