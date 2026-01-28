/**
 * Test with increasing symbol counts to find breaking point
 */

const { huffmanEncode, huffmanDecode } = require('./dist/entropy/index.js');

function test(uniqueSymbols, totalLength) {
  // Generate values with specified unique symbols
  const values = new Uint8Array(totalLength);
  for (let i = 0; i < totalLength; i++) {
    values[i] = i % uniqueSymbols;
  }

  console.log(`Testing ${uniqueSymbols} unique symbols, ${totalLength} values...`);

  try {
    const { encoded, codeLengths } = huffmanEncode(values);
    const decoded = huffmanDecode(encoded, codeLengths, values.length);

    // Quick verify
    let matches = true;
    for (let i = 0; i < Math.min(values.length, 100); i++) {
      if (values[i] !== decoded[i]) {
        matches = false;
        break;
      }
    }

    console.log(matches ? '  ✅ PASS' : '  ❌ FAIL');
    return true;
  } catch (e) {
    console.log(`  ❌ FAIL: ${e.message.split('\n')[0]}`);
    return false;
  }
}

// Test with increasing complexity
const tests = [
  [10, 100],
  [50, 500],
  [100, 1000],
  [150, 1500],
  [200, 1536],
  [256, 1536],
];

for (const [unique, total] of tests) {
  test(unique, total);
}
