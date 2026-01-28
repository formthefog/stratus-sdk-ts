/**
 * Entropy coding (Huffman)
 *
 * @purpose Huffman encoding/decoding for quantized values
 * @spec SPEC.md#step-3-entropy-coding-huffman
 */
/**
 * Encode quantized values using Huffman coding
 */
export declare function huffmanEncode(values: Uint8Array): {
    encoded: Uint8Array;
    codeLengths: Uint8Array;
};
/**
 * Decode Huffman-encoded bitstream
 */
export declare function huffmanDecode(encoded: Uint8Array, codeLengths: Uint8Array, count: number): Uint8Array;
