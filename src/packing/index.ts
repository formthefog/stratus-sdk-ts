/**
 * Binary packing
 *
 * @purpose Pack/unpack compressed vectors with header
 * @spec SPEC.md#binary-format
 */

import {
  writeUint32,
  readUint32,
  writeUint16,
  readUint16,
  writeFloat32,
  readFloat32,
  crc32,
} from '../utils/buffer.js';
import { CompressionLevel } from '../types.js';

const MAGIC = 0x53545254; // 'STRT'
const VERSION = 1;
const HEADER_SIZE = 36; // magic(4) + version(1) + level(1) + dims(2) + scale(4) + offset(4) + 4 sizes(16) + checksum(4)

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
export function pack(
  centroid: Float32Array,
  precisionMap: Uint8Array,
  codeLengths: Uint8Array,
  encoded: Uint8Array,
  level: CompressionLevel,
  scale: number
): Uint8Array {
  const dimensions = centroid.length;

  // Calculate sizes
  const centroidSize = dimensions * 4; // float32
  const precisionSize = precisionMap.length;
  const codeLengthsSize = codeLengths.length;
  const encodedSize = encoded.length;

  const totalSize =
    HEADER_SIZE +
    centroidSize +
    precisionSize +
    codeLengthsSize +
    encodedSize;

  const buffer = new Uint8Array(totalSize);
  let offset = 0;

  // Write header (32 bytes)
  writeUint32(buffer, offset, MAGIC);
  offset += 4;
  buffer[offset++] = VERSION;
  buffer[offset++] = level;
  writeUint16(buffer, offset, dimensions);
  offset += 2;
  writeFloat32(buffer, offset, scale);
  offset += 4;
  writeFloat32(buffer, offset, 0); // offset (unused)
  offset += 4;
  writeUint32(buffer, offset, centroidSize);
  offset += 4;
  writeUint32(buffer, offset, precisionSize);
  offset += 4;
  writeUint32(buffer, offset, codeLengthsSize);
  offset += 4;
  writeUint32(buffer, offset, encodedSize);
  offset += 4;

  // Placeholder for checksum (will write at end)
  const checksumOffset = offset;
  offset += 4;

  // Write centroid
  for (let i = 0; i < centroid.length; i++) {
    writeFloat32(buffer, offset, centroid[i]);
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
  dataForChecksum.set(
    buffer.subarray(checksumOffset + 4),
    checksumOffset
  );
  const checksum = crc32(dataForChecksum);
  writeUint32(buffer, checksumOffset, checksum);

  return buffer;
}

/**
 * Unpack compressed data
 */
export function unpack(compressed: Uint8Array): UnpackedData {
  if (compressed.length < HEADER_SIZE) {
    throw new Error('Invalid compressed data: too short');
  }

  let offset = 0;

  // Read header
  const magic = readUint32(compressed, offset);
  offset += 4;
  if (magic !== MAGIC) {
    throw new Error(`Invalid magic number: 0x${magic.toString(16)}`);
  }

  const version = compressed[offset++];
  if (version !== VERSION) {
    throw new Error(`Unsupported version: ${version}`);
  }

  const level = compressed[offset++] as CompressionLevel;
  const dimensions = readUint16(compressed, offset);
  offset += 2;
  const scale = readFloat32(compressed, offset);
  offset += 4;
  offset += 4; // skip offset field
  const centroidSize = readUint32(compressed, offset);
  offset += 4;
  const precisionSize = readUint32(compressed, offset);
  offset += 4;
  const codeLengthsSize = readUint32(compressed, offset);
  offset += 4;
  const encodedSize = readUint32(compressed, offset);
  offset += 4;

  const storedChecksum = readUint32(compressed, offset);
  const checksumOffset = offset;
  offset += 4;

  // Verify checksum
  const dataForChecksum = new Uint8Array(compressed.length - 4);
  dataForChecksum.set(compressed.subarray(0, checksumOffset));
  dataForChecksum.set(
    compressed.subarray(checksumOffset + 4),
    checksumOffset
  );
  const computedChecksum = crc32(dataForChecksum);
  if (computedChecksum !== storedChecksum) {
    throw new Error('Checksum mismatch: data may be corrupted');
  }

  // Read centroid
  const centroid = new Float32Array(dimensions);
  for (let i = 0; i < dimensions; i++) {
    centroid[i] = readFloat32(compressed, offset);
    offset += 4;
  }

  // Read precision map
  const precisionMap = compressed.subarray(offset, offset + precisionSize);
  offset += precisionSize;

  // Read code lengths
  const codeLengths = compressed.subarray(
    offset,
    offset + codeLengthsSize
  );
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
