/**
 * Test Huffman encoding/decoding in isolation
 */

const { huffmanEncode, huffmanDecode } = require('./dist/entropy/index.js');

console.log('Testing Huffman encoding...\n');

// Test 1: Simple case
console.log('Test 1: Simple values');
const simple = new Uint8Array([1, 2, 3, 1, 2, 3, 1, 2, 3]);
console.log('Input:', Array.from(simple));

const { encoded: enc1, codeLengths: len1 } = huffmanEncode(simple);
console.log('Encoded:', enc1.length, 'bytes');
console.log('Code lengths:', Array.from(len1));

const dec1 = huffmanDecode(enc1, len1, simple.length);
console.log('Decoded:', Array.from(dec1));
console.log('Match:', Array.from(simple).every((v, i) => v === dec1[i]) ? '✅' : '❌');
console.log();

// Test 2: Random values (like quantized data)
console.log('Test 2: Random quantized values');
const random = new Uint8Array(100);
for (let i = 0; i < 100; i++) {
  random[i] = Math.floor(Math.random() * 256);
}

try {
  const { encoded: enc2, codeLengths: len2 } = huffmanEncode(random);
  console.log('Encoded:', enc2.length, 'bytes (original:', random.length, ')');
  console.log('Unique values:', new Set(random).size);

  const dec2 = huffmanDecode(enc2, len2, random.length);
  console.log('Decoded length:', dec2.length);
  console.log('Match:', Array.from(random).every((v, i) => v === dec2[i]) ? '✅' : '❌');

  if (!Array.from(random).every((v, i) => v === dec2[i])) {
    // Find first mismatch
    for (let i = 0; i < random.length; i++) {
      if (random[i] !== dec2[i]) {
        console.log(`First mismatch at index ${i}: expected ${random[i]}, got ${dec2[i]}`);
        break;
      }
    }
  }
} catch (e) {
  console.log('Error:', e.message);
}
