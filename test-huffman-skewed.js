/**
 * Test with skewed frequency distribution (like real quantized data)
 */

const { huffmanEncode, huffmanDecode } = require('./dist/entropy/index.js');

function test(description, values) {
  console.log(`\nTest: ${description}`);
  console.log(`- Length: ${values.length}`);
  console.log(`- Unique: ${new Set(values).size}`);

  // Show frequency distribution
  const freqs = {};
  for (const v of values) {
    freqs[v] = (freqs[v] || 0) + 1;
  }
  const sorted = Object.entries(freqs).sort((a, b) => b[1] - a[1]);
  console.log(`- Top 5 frequencies: ${sorted.slice(0, 5).map(([v, c]) => `${v}:${c}`).join(', ')}`);

  try {
    const { encoded, codeLengths } = huffmanEncode(values);

    // Show code length distribution
    const lengthCounts = {};
    for (const len of codeLengths) {
      if (len > 0) {
        lengthCounts[len] = (lengthCounts[len] || 0) + 1;
      }
    }
    console.log(`- Code lengths: ${Object.entries(lengthCounts).sort((a, b) => a[0] - b[0]).map(([l, c]) => `${l}:${c}`).join(', ')}`);

    const decoded = huffmanDecode(encoded, codeLengths, values.length);

    // Verify
    let matches = 0;
    for (let i = 0; i < values.length; i++) {
      if (values[i] === decoded[i]) matches++;
    }

    if (matches === values.length) {
      console.log('✅ PASS');
    } else {
      console.log(`❌ FAIL: ${matches}/${values.length} match`);
    }
  } catch (e) {
    console.log(`❌ FAIL: ${e.message.split('\n')[0]}`);
  }
}

// Test 1: One very common value
const test1 = new Uint8Array(1536);
for (let i = 0; i < 1536; i++) {
  if (i < 256) test1[i] = 128;  // Very common
  else test1[i] = i % 200;       // Others
}
test('One dominant value', test1);

// Test 2: Zipf distribution (natural frequency distribution)
const test2 = new Uint8Array(1536);
let idx = 0;
for (let symbol = 0; symbol < 100 && idx < 1536; symbol++) {
  const freq = Math.floor(100 / (symbol + 1)); // Zipf-like
  for (let j = 0; j < freq && idx < 1536; j++) {
    test2[idx++] = symbol;
  }
}
test('Zipf-like distribution', test2);

// Test 3: Like the failing case - very skewed
const test3 = new Uint8Array(1536);
for (let i = 0; i < 1536; i++) {
  if (i < 256) test3[i] = 128;
  else if (i < 512) test3[i] = Math.floor(Math.random() * 50) + 100;
  else if (i < 768) test3[i] = Math.floor(Math.random() * 100) + 50;
  else test3[i] = Math.floor(Math.random() * 200);
}
test('Realistic skewed (like debug test)', test3);
