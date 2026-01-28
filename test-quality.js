/**
 * Test compression quality
 */

const stratus = require('./dist/index.js');

console.log('Testing compression quality...\n');

// Test 1: Random vector
console.log('Test 1: Random 1536-dim vector');
const random = new Float32Array(1536);
for (let i = 0; i < 1536; i++) {
  random[i] = Math.random() * 2 - 1; // [-1, 1]
}

const compressed = stratus.compress(random, {
  level: stratus.CompressionLevel.Medium,
});

const decompressed = stratus.decompress(compressed);

console.log(`  Original dims: ${random.length}`);
console.log(`  Decompressed dims: ${decompressed.length}`);
console.log(`  Compressed size: ${compressed.length} bytes`);
console.log(`  Original size: ${random.length * 4} bytes`);
console.log(`  Compression ratio: ${((random.length * 4) / compressed.length).toFixed(2)}x`);

// Check cosine similarity
const similarity = stratus.cosineSimilarity(random, decompressed);
console.log(`  Cosine similarity: ${similarity.toFixed(6)}`);

// Check dimension-wise error
let maxError = 0;
let avgError = 0;
for (let i = 0; i < Math.min(random.length, decompressed.length); i++) {
  const error = Math.abs(random[i] - decompressed[i]);
  maxError = Math.max(maxError, error);
  avgError += error;
}
avgError /= Math.min(random.length, decompressed.length);

console.log(`  Max dimension error: ${maxError.toFixed(6)}`);
console.log(`  Avg dimension error: ${avgError.toFixed(6)}`);
console.log();

// Test 2: Test different compression levels
console.log('Test 2: Compression levels');
const testVec = new Float32Array(1536);
for (let i = 0; i < 1536; i++) {
  testVec[i] = Math.sin(i / 100); // Structured pattern
}

for (const level of Object.values(stratus.CompressionLevel)) {
  if (typeof level !== 'number') continue;

  const c = stratus.compress(testVec, { level });
  const d = stratus.decompress(c);
  const sim = stratus.cosineSimilarity(testVec, d);
  const ratio = (testVec.length * 4 / c.length).toFixed(2);

  console.log(`  Level ${level}: ${c.length} bytes, ${ratio}x, similarity ${sim.toFixed(4)}`);
}
console.log();

console.log(decompressed.length === random.length ? '✅ PASS: Dimensions match' : '❌ FAIL: Dimension mismatch!');
console.log(similarity > 0.90 ? '✅ PASS: Quality good (>90%)' : '❌ FAIL: Quality too low');
