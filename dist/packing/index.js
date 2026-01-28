"use strict";
/**
 * Binary packing
 *
 * @purpose Pack/unpack compressed vectors with header
 * @spec SPEC.md#binary-format
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.pack = pack;
exports.unpack = unpack;
const buffer_js_1 = require("../utils/buffer.js");
const MAGIC = 0x53545254; // 'STRT'
const VERSION = 1;
const HEADER_SIZE = 36; // magic(4) + version(1) + level(1) + dims(2) + scale(4) + offset(4) + 4 sizes(16) + checksum(4)
/**
 * Pack compressed data with header
 */
function pack(centroid, precisionMap, codeLengths, encoded, level, scale) {
    const dimensions = centroid.length;
    // Calculate sizes
    const centroidSize = dimensions * 4; // float32
    const precisionSize = precisionMap.length;
    const codeLengthsSize = codeLengths.length;
    const encodedSize = encoded.length;
    const totalSize = HEADER_SIZE +
        centroidSize +
        precisionSize +
        codeLengthsSize +
        encodedSize;
    const buffer = new Uint8Array(totalSize);
    let offset = 0;
    // Write header (32 bytes)
    (0, buffer_js_1.writeUint32)(buffer, offset, MAGIC);
    offset += 4;
    buffer[offset++] = VERSION;
    buffer[offset++] = level;
    (0, buffer_js_1.writeUint16)(buffer, offset, dimensions);
    offset += 2;
    (0, buffer_js_1.writeFloat32)(buffer, offset, scale);
    offset += 4;
    (0, buffer_js_1.writeFloat32)(buffer, offset, 0); // offset (unused)
    offset += 4;
    (0, buffer_js_1.writeUint32)(buffer, offset, centroidSize);
    offset += 4;
    (0, buffer_js_1.writeUint32)(buffer, offset, precisionSize);
    offset += 4;
    (0, buffer_js_1.writeUint32)(buffer, offset, codeLengthsSize);
    offset += 4;
    (0, buffer_js_1.writeUint32)(buffer, offset, encodedSize);
    offset += 4;
    // Placeholder for checksum (will write at end)
    const checksumOffset = offset;
    offset += 4;
    // Write centroid
    for (let i = 0; i < centroid.length; i++) {
        (0, buffer_js_1.writeFloat32)(buffer, offset, centroid[i]);
        offset += 4;
    }
    // Write precision map
    buffer.set(precisionMap, offset);
    offset += precisionSize;
    // Write code lengths
    buffer.set(codeLengths, offset);
    offset += codeLengthsSize;
    // Write encoded data
    if (offset + encodedSize > buffer.length) {
        throw new Error(`Buffer overflow: offset=${offset}, encodedSize=${encodedSize}, bufferLength=${buffer.length}`);
    }
    buffer.set(encoded, offset);
    offset += encodedSize;
    // Compute and write checksum (excluding checksum field itself)
    const dataForChecksum = new Uint8Array(buffer.length - 4);
    dataForChecksum.set(buffer.subarray(0, checksumOffset));
    dataForChecksum.set(buffer.subarray(checksumOffset + 4), checksumOffset);
    const checksum = (0, buffer_js_1.crc32)(dataForChecksum);
    (0, buffer_js_1.writeUint32)(buffer, checksumOffset, checksum);
    return buffer;
}
/**
 * Unpack compressed data
 */
function unpack(compressed) {
    if (compressed.length < HEADER_SIZE) {
        throw new Error('Invalid compressed data: too short');
    }
    let offset = 0;
    // Read header
    const magic = (0, buffer_js_1.readUint32)(compressed, offset);
    offset += 4;
    if (magic !== MAGIC) {
        throw new Error(`Invalid magic number: 0x${magic.toString(16)}`);
    }
    const version = compressed[offset++];
    if (version !== VERSION) {
        throw new Error(`Unsupported version: ${version}`);
    }
    const level = compressed[offset++];
    const dimensions = (0, buffer_js_1.readUint16)(compressed, offset);
    offset += 2;
    const scale = (0, buffer_js_1.readFloat32)(compressed, offset);
    offset += 4;
    offset += 4; // skip offset field
    const centroidSize = (0, buffer_js_1.readUint32)(compressed, offset);
    offset += 4;
    const precisionSize = (0, buffer_js_1.readUint32)(compressed, offset);
    offset += 4;
    const codeLengthsSize = (0, buffer_js_1.readUint32)(compressed, offset);
    offset += 4;
    const encodedSize = (0, buffer_js_1.readUint32)(compressed, offset);
    offset += 4;
    const storedChecksum = (0, buffer_js_1.readUint32)(compressed, offset);
    const checksumOffset = offset;
    offset += 4;
    // Verify checksum
    const dataForChecksum = new Uint8Array(compressed.length - 4);
    dataForChecksum.set(compressed.subarray(0, checksumOffset));
    dataForChecksum.set(compressed.subarray(checksumOffset + 4), checksumOffset);
    const computedChecksum = (0, buffer_js_1.crc32)(dataForChecksum);
    if (computedChecksum !== storedChecksum) {
        throw new Error('Checksum mismatch: data may be corrupted');
    }
    // Read centroid
    const centroid = new Float32Array(dimensions);
    for (let i = 0; i < dimensions; i++) {
        centroid[i] = (0, buffer_js_1.readFloat32)(compressed, offset);
        offset += 4;
    }
    // Read precision map
    const precisionMap = compressed.subarray(offset, offset + precisionSize);
    offset += precisionSize;
    // Read code lengths
    const codeLengths = compressed.subarray(offset, offset + codeLengthsSize);
    offset += codeLengthsSize;
    // Read encoded data
    const encoded = compressed.subarray(offset, offset + encodedSize);
    return {
        centroid,
        precisionMap,
        codeLengths,
        encoded,
        dimensions,
        level,
        scale,
    };
}
