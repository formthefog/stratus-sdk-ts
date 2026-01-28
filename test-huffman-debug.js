/**
 * Debug Huffman encoding/decoding
 */

const { huffmanEncode, huffmanDecode } = require('./dist/entropy/index.js');

console.log('Testing with problematic pattern...\n');

// Generate a pattern more like real quantized data
const values = new Uint8Array(1536);
for (let i = 0; i < 1536; i++) {
  // Mix of common and rare values (like real quantized embeddings)
  if (i < 256) values[i] = 128; // Very common center value
  else if (i < 512) values[i] = Math.floor(Math.random() * 50) + 100;
  else if (i < 768) values[i] = Math.floor(Math.random() * 100) + 50;
  else values[i] = Math.floor(Math.random() * 200);
}

console.log('Input stats:');
console.log('- Length:', values.length);
console.log('- Unique values:', new Set(values).size);
console.log('- Min/max:', Math.min(...values), '/', Math.max(...values));
console.log('- First 20:', Array.from(values.slice(0, 20)));
console.log();

try {
  const { encoded, codeLengths } = huffmanEncode(values);
  console.log('Encoded successfully:');
  console.log('- Encoded bytes:', encoded.length);
  console.log('- Code lengths array size:', codeLengths.length);
  console.log('- Non-zero code lengths:', Array.from(codeLengths).filter(x => x > 0).length);
  console.log('- First 20 code lengths:', Array.from(codeLengths.slice(0, 20)));
  console.log();

  console.log('Attempting decode...');
  const decoded = huffmanDecode(encoded, codeLengths, values.length);

  console.log('Decoded successfully:');
  console.log('- Decoded length:', decoded.length);
  console.log('- First 20 decoded:', Array.from(decoded.slice(0, 20)));
  console.log();

  // Check match
  let firstMismatch = -1;
  for (let i = 0; i < values.length; i++) {
    if (values[i] !== decoded[i]) {
      firstMismatch = i;
      break;
    }
  }

  if (firstMismatch === -1) {
    console.log('✅ Perfect match!');
  } else {
    console.log(`❌ Mismatch at position ${firstMismatch}`);
    console.log(`   Expected: ${values[firstMismatch]}, Got: ${decoded[firstMismatch]}`);
    console.log(`   Context: expected [${Array.from(values.slice(Math.max(0, firstMismatch-5), firstMismatch+5))}]`);
    console.log(`            decoded  [${Array.from(decoded.slice(Math.max(0, firstMismatch-5), firstMismatch+5))}]`);
  }
} catch (e) {
  console.log('❌ Error:', e.message);
  console.log('Stack:', e.stack);
}
