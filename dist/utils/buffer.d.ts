/**
 * Buffer utilities
 *
 * @purpose Helper functions for working with Uint8Array buffers
 */
/**
 * Write a 32-bit unsigned integer to buffer (little endian)
 */
export declare function writeUint32(buffer: Uint8Array, offset: number, value: number): void;
/**
 * Read a 32-bit unsigned integer from buffer (little endian)
 */
export declare function readUint32(buffer: Uint8Array, offset: number): number;
/**
 * Write a 16-bit unsigned integer to buffer (little endian)
 */
export declare function writeUint16(buffer: Uint8Array, offset: number, value: number): void;
/**
 * Read a 16-bit unsigned integer from buffer (little endian)
 */
export declare function readUint16(buffer: Uint8Array, offset: number): number;
/**
 * Write a 32-bit float to buffer (little endian)
 */
export declare function writeFloat32(buffer: Uint8Array, offset: number, value: number): void;
/**
 * Read a 32-bit float from buffer (little endian)
 */
export declare function readFloat32(buffer: Uint8Array, offset: number): number;
/**
 * CRC32 checksum (simple implementation)
 */
export declare function crc32(buffer: Uint8Array): number;
