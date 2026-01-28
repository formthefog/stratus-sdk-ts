/**
 * Buffer utilities
 *
 * @purpose Helper functions for working with Uint8Array buffers
 */

/**
 * Write a 32-bit unsigned integer to buffer (little endian)
 */
export function writeUint32(buffer: Uint8Array, offset: number, value: number): void {
  buffer[offset] = value & 0xff;
  buffer[offset + 1] = (value >>> 8) & 0xff;
  buffer[offset + 2] = (value >>> 16) & 0xff;
  buffer[offset + 3] = (value >>> 24) & 0xff;
}

/**
 * Read a 32-bit unsigned integer from buffer (little endian)
 */
export function readUint32(buffer: Uint8Array, offset: number): number {
  return (
    buffer[offset] |
    (buffer[offset + 1] << 8) |
    (buffer[offset + 2] << 16) |
    (buffer[offset + 3] << 24)
  ) >>> 0;
}

/**
 * Write a 16-bit unsigned integer to buffer (little endian)
 */
export function writeUint16(buffer: Uint8Array, offset: number, value: number): void {
  buffer[offset] = value & 0xff;
  buffer[offset + 1] = (value >>> 8) & 0xff;
}

/**
 * Read a 16-bit unsigned integer from buffer (little endian)
 */
export function readUint16(buffer: Uint8Array, offset: number): number {
  return buffer[offset] | (buffer[offset + 1] << 8);
}

/**
 * Write a 32-bit float to buffer (little endian)
 */
export function writeFloat32(buffer: Uint8Array, offset: number, value: number): void {
  const view = new DataView(buffer.buffer, buffer.byteOffset + offset, 4);
  view.setFloat32(0, value, true);
}

/**
 * Read a 32-bit float from buffer (little endian)
 */
export function readFloat32(buffer: Uint8Array, offset: number): number {
  const view = new DataView(buffer.buffer, buffer.byteOffset + offset, 4);
  return view.getFloat32(0, true);
}

/**
 * CRC32 checksum (simple implementation)
 */
export function crc32(buffer: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buffer.length; i++) {
    crc ^= buffer[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}
