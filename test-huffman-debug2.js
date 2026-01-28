/**
 * Debug canonical code generation
 */

const { huffmanEncode, huffmanDecode } = require('./dist/entropy/index.js');

// Simple test to see code generation
const values = new Uint8Array([128, 128, 128, 117, 92, 50, 50]);

console.log('Input:', Array.from(values));
console.log('Frequencies:', {
  '128': 3,
  '117': 1,
  '92': 1,
  '50': 2,
});
console.log();

const { encoded, codeLengths } = huffmanEncode(values);

console.log('Code lengths generated:');
for (let i = 0; i < codeLengths.length; i++) {
  if (codeLengths[i] > 0) {
    console.log(`  Symbol ${i}: length ${codeLengths[i]}`);
  }
}
console.log();

// Now manually generate canonical codes to see what they should be
function generateCanonicalCodes(codeLengths) {
  const codes = new Map();

  // Group symbols by code length
  const symbolsByLength = new Map();
  for (let symbol = 0; symbol < codeLengths.length; symbol++) {
    const length = codeLengths[symbol];
    if (length > 0) {
      if (!symbolsByLength.has(length)) {
        symbolsByLength.set(length, []);
      }
      symbolsByLength.get(length).push(symbol);
    }
  }

  console.log('Symbols by length:');
  for (const [len, syms] of symbolsByLength) {
    console.log(`  Length ${len}: symbols [${syms}]`);
  }
  console.log();

  // Sort lengths
  const lengths = Array.from(symbolsByLength.keys()).sort((a, b) => a - b);

  let code = 0;
  console.log('Canonical code assignment:');
  for (const length of lengths) {
    const symbols = symbolsByLength.get(length).sort((a, b) => a - b);

    console.log(`  Length ${length} (starting code=${code}, binary=${code.toString(2).padStart(length, '0')}):  `);
    for (const symbol of symbols) {
      codes.set(symbol, { code, length });
      console.log(`    Symbol ${symbol} -> code=${code} (binary=${code.toString(2).padStart(length, '0')})`);
      code++;
    }

    console.log(`    After assigning ${symbols.length} symbols, code=${code}`);
    code <<= 1; // Shift for next length
    console.log(`    Shifted for next length: code=${code} (binary=${code.toString(2)})`);
  }

  return codes;
}

const codes = generateCanonicalCodes(codeLengths);

console.log();
console.log('Encoded bytes:', Array.from(encoded).map(b => b.toString(2).padStart(8, '0')).join(' '));

// Try to decode
console.log();
console.log('Attempting decode...');
try {
  const decoded = huffmanDecode(encoded, codeLengths, values.length);
  console.log('✅ Decoded:', Array.from(decoded));
} catch (e) {
  console.log('❌ Error:', e.message);
}
