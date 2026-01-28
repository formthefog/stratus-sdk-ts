/**
 * Test with medium complexity (50 unique values)
 */

const { huffmanEncode, huffmanDecode } = require('./dist/entropy/index.js');

// Generate 100 values with 50 unique symbols
const values = new Uint8Array(100);
for (let i = 0; i < 100; i++) {
  values[i] = i % 50; // 50 unique values, each appears twice
}

console.log('Input:');
console.log('- Length:', values.length);
console.log('- Unique:', new Set(values).size);
console.log();

try {
  const { encoded, codeLengths } = huffmanEncode(values);

  console.log('Encoded:');
  console.log('- Bytes:', encoded.length);
  console.log('- Code lengths size:', codeLengths.length);
  console.log('- Non-zero lengths:', Array.from(codeLengths).filter(x => x > 0).length);
  console.log();

  console.log('Code length distribution:');
  const lengthCounts = {};
  for (const len of codeLengths) {
    if (len > 0) {
      lengthCounts[len] = (lengthCounts[len] || 0) + 1;
    }
  }
  for (const [len, count] of Object.entries(lengthCounts).sort((a, b) => a[0] - b[0])) {
    console.log(`  Length ${len}: ${count} symbols`);
  }
  console.log();

  const decoded = huffmanDecode(encoded, codeLengths, values.length);
  console.log('✅ Decode success! Length:', decoded.length);

  // Verify
  let matches = true;
  for (let i = 0; i < values.length; i++) {
    if (values[i] !== decoded[i]) {
      console.log(`❌ Mismatch at ${i}: expected ${values[i]}, got ${decoded[i]}`);
      matches = false;
      break;
    }
  }
  if (matches) console.log('✅ All values match!');
} catch (e) {
  console.log('❌ Error:', e.message);
}
