"use strict";
/**
 * Stratus Compression SDK - Type Definitions
 *
 * @purpose Core type definitions for vector compression
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompressionLevel = void 0;
var CompressionLevel;
(function (CompressionLevel) {
    CompressionLevel[CompressionLevel["Low"] = 0] = "Low";
    CompressionLevel[CompressionLevel["Medium"] = 1] = "Medium";
    CompressionLevel[CompressionLevel["High"] = 2] = "High";
    CompressionLevel[CompressionLevel["VeryHigh"] = 3] = "VeryHigh";
})(CompressionLevel || (exports.CompressionLevel = CompressionLevel = {}));
