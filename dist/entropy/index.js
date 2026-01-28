"use strict";
/**
 * Entropy coding (Huffman)
 *
 * @purpose Huffman encoding/decoding for quantized values
 * @spec SPEC.md#step-3-entropy-coding-huffman
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.huffmanEncode = huffmanEncode;
exports.huffmanDecode = huffmanDecode;
/**
 * Build Huffman tree from frequency map
 */
function buildHuffmanTree(frequencies) {
    const nodes = [];
    // Create leaf nodes
    for (const [value, freq] of frequencies) {
        nodes.push({ value, frequency: freq, left: null, right: null });
    }
    // Build tree bottom-up using priority queue (sorted array)
    while (nodes.length > 1) {
        // Sort by frequency (ascending)
        nodes.sort((a, b) => a.frequency - b.frequency);
        // Take two nodes with lowest frequency
        const left = nodes.shift();
        const right = nodes.shift();
        // Create parent node
        const parent = {
            value: null,
            frequency: left.frequency + right.frequency,
            left,
            right,
        };
        nodes.push(parent);
    }
    return nodes[0];
}
/**
 * Generate code lengths from Huffman tree
 */
function getCodeLengths(root, maxValue) {
    const lengths = new Uint8Array(maxValue + 1);
    function traverse(node, depth) {
        if (node.value !== null) {
            lengths[node.value] = depth;
            return;
        }
        if (node.left)
            traverse(node.left, depth + 1);
        if (node.right)
            traverse(node.right, depth + 1);
    }
    traverse(root, 0);
    return lengths;
}
/**
 * Generate canonical Huffman codes from code lengths
 */
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
    // Sort lengths
    const lengths = Array.from(symbolsByLength.keys()).sort((a, b) => a - b);
    let code = 0;
    let previousLength = 0;
    for (const length of lengths) {
        // Account for gap in lengths (e.g., jumping from length 2 to length 8)
        // We need to shift (length - previousLength) times
        if (previousLength > 0) {
            code <<= (length - previousLength);
        }
        const symbols = symbolsByLength.get(length).sort((a, b) => a - b);
        for (const symbol of symbols) {
            codes.set(symbol, { code, length });
            code++;
        }
        previousLength = length;
    }
    return codes;
}
/**
 * Encode quantized values using Huffman coding
 */
function huffmanEncode(values) {
    // Count frequencies
    const frequencies = new Map();
    for (const val of values) {
        frequencies.set(val, (frequencies.get(val) || 0) + 1);
    }
    // Handle edge case: only one unique value
    if (frequencies.size === 1) {
        const value = frequencies.keys().next().value;
        return {
            encoded: new Uint8Array(0), // Empty encoding
            codeLengths: new Uint8Array([1]), // Single value gets 1-bit code
        };
    }
    // Build Huffman tree and get code lengths
    const tree = buildHuffmanTree(frequencies);
    const maxValue = Math.max(...Array.from(frequencies.keys()));
    const codeLengths = getCodeLengths(tree, maxValue);
    // Generate canonical codes
    const codes = generateCanonicalCodes(codeLengths);
    // Encode to bitstream
    let bitBuffer = 0;
    let bitCount = 0;
    const bytes = [];
    for (const value of values) {
        const huffCode = codes.get(value);
        if (!huffCode) {
            throw new Error(`No Huffman code for value ${value}`);
        }
        // Add bits to buffer (MSB first)
        for (let i = huffCode.length - 1; i >= 0; i--) {
            const bit = (huffCode.code >> i) & 1;
            bitBuffer = (bitBuffer << 1) | bit;
            bitCount++;
            // Flush complete bytes
            if (bitCount === 8) {
                bytes.push(bitBuffer & 0xff);
                bitBuffer = 0;
                bitCount = 0;
            }
        }
    }
    // Flush remaining bits (pad with zeros)
    if (bitCount > 0) {
        bitBuffer <<= (8 - bitCount);
        bytes.push(bitBuffer & 0xff);
    }
    return {
        encoded: new Uint8Array(bytes),
        codeLengths,
    };
}
/**
 * Decode Huffman-encoded bitstream
 */
function huffmanDecode(encoded, codeLengths, count) {
    // Handle edge case: single unique value
    if (encoded.length === 0 && codeLengths.length === 1) {
        return new Uint8Array(count).fill(0);
    }
    // Generate canonical codes
    const codes = generateCanonicalCodes(codeLengths);
    // Build reverse lookup table (code -> symbol)
    const reverseTable = new Map();
    for (const [symbol, { code, length }] of codes) {
        reverseTable.set(`${length}:${code}`, symbol);
    }
    // Decode bitstream
    const decoded = [];
    let bitBuffer = 0;
    let bitCount = 0;
    let byteIndex = 0;
    while (decoded.length < count) {
        // Refill bit buffer
        while (bitCount < 24 && byteIndex < encoded.length) {
            bitBuffer = (bitBuffer << 8) | encoded[byteIndex++];
            bitCount += 8;
        }
        if (bitCount === 0) {
            throw new Error(`Unexpected end of stream at ${decoded.length}/${count}`);
        }
        // Try to match a code
        let found = false;
        for (let len = 1; len <= Math.min(bitCount, 16); len++) {
            const code = (bitBuffer >> (bitCount - len)) & ((1 << len) - 1);
            const symbol = reverseTable.get(`${len}:${code}`);
            if (symbol !== undefined) {
                decoded.push(symbol);
                bitCount -= len;
                bitBuffer &= (1 << bitCount) - 1;
                found = true;
                break;
            }
        }
        if (!found) {
            // Padding bits at end
            if (decoded.length === count)
                break;
            // Debug info
            const availableCodes = [];
            for (let len = 1; len <= Math.min(bitCount, 16); len++) {
                const code = (bitBuffer >> (bitCount - len)) & ((1 << len) - 1);
                const symbol = reverseTable.get(`${len}:${code}`);
                availableCodes.push(`${len}:${code}=${symbol !== undefined ? symbol : 'X'}`);
            }
            throw new Error(`Failed to decode at position ${decoded.length}/${count}\n` +
                `  bitCount=${bitCount}, byteIndex=${byteIndex}/${encoded.length}\n` +
                `  Tried codes: ${availableCodes.slice(0, 10).join(', ')}\n` +
                `  Last 3 decoded: [${decoded.slice(-3)}]`);
        }
    }
    return new Uint8Array(decoded);
}
