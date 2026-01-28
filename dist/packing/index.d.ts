/**
 * Binary packing
 *
 * @purpose Pack/unpack compressed vectors with header
 * @spec SPEC.md#binary-format
 */
import { CompressionLevel } from '../types.js';
export interface PackedData {
    compressed: Uint8Array;
    metadata: {
        dimensions: number;
        level: CompressionLevel;
        scale: number;
    };
}
export interface UnpackedData {
    centroid: Float32Array;
    precisionMap: Uint8Array;
    codeLengths: Uint8Array;
    encoded: Uint8Array;
    dimensions: number;
    level: CompressionLevel;
    scale: number;
}
/**
 * Pack compressed data with header
 */
export declare function pack(centroid: Float32Array, precisionMap: Uint8Array, codeLengths: Uint8Array, encoded: Uint8Array, level: CompressionLevel, scale: number): Uint8Array;
/**
 * Unpack compressed data
 */
export declare function unpack(compressed: Uint8Array): UnpackedData;
