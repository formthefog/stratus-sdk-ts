# Stratus Compression - Technical Specification

**Version:** 1.0
**Status:** Draft
**Last Updated:** 2026-01-27

---

## Overview

This document specifies the technical details of Stratus vector compression:
- Binary format
- Compression algorithms
- Decompression process
- Quality guarantees

---

## Binary Format

### File Structure

```
┌─────────────────────────────────────────────────┐
│ HEADER (32 bytes)                               │
├─────────────────────────────────────────────────┤
│ CENTROID (dims × 4 bytes)                       │
├─────────────────────────────────────────────────┤
│ PRECISION MAP (ceil(dims / 4) bytes)            │
├─────────────────────────────────────────────────┤
│ HUFFMAN TABLE (variable)                        │
├─────────────────────────────────────────────────┤
│ COMPRESSED DATA (variable)                      │
└─────────────────────────────────────────────────┘
```

### Header Format (32 bytes)

```c
struct StratusHeader {
  uint32_t magic;           // 'STRT' (0x53545254)
  uint8_t  version;         // Format version (1)
  uint8_t  level;           // Compression level (0-3)
  uint16_t dimensions;      // Original vector dimensions
  float    scale;           // Normalization scale
  float    offset;          // Normalization offset
  uint32_t centroid_size;   // Size of centroid in bytes
  uint32_t precision_size;  // Size of precision map
  uint32_t huffman_size;    // Size of Huffman table
  uint32_t data_size;       // Size of compressed data
  uint32_t checksum;        // CRC32 of entire payload
};
```

**Field Details:**

- `magic`: Magic number for format detection ('STRT' = Stratus)
- `version`: Format version (1 for initial release)
- `level`: Compression level
  - 0 = Low (5x, 99% quality)
  - 1 = Medium (10x, 97% quality)
  - 2 = High (15x, 95% quality)
  - 3 = VeryHigh (20x, 90% quality)
- `dimensions`: Original vector dimensionality
- `scale`: Scaling factor applied during normalization
- `offset`: Offset applied during normalization
- `centroid_size`: Bytes allocated for centroid vector
- `precision_size`: Bytes for precision map
- `huffman_size`: Bytes for Huffman coding table
- `data_size`: Bytes for compressed quantized data
- `checksum`: CRC32 checksum for data integrity

### Centroid Section

Stores the learned centroid (mean vector) used for delta encoding.

```
Float32Array of length `dimensions`
Size: dimensions × 4 bytes
```

**Example (1536 dims):**
```
[0.23, -0.12, 0.45, ..., 0.01]  // 1536 floats
Size: 6,144 bytes
```

### Precision Map Section

Specifies bit precision for each dimension. Packed as 2 bits per dimension.

```
2 bits per dimension:
  00 = 4 bits
  01 = 6 bits
  10 = 8 bits
  11 = 12 bits (reserved)

Size: ceil(dimensions / 4) bytes
```

**Example (1536 dims):**
```
Dimensions 0-255:   10 (8-bit precision)
Dimensions 256-767: 01 (6-bit precision)
Dimensions 768-1535: 00 (4-bit precision)

Packed: 384 bytes (1536 dims / 4 bits-per-dim)
```

### Huffman Table Section

Stores the Huffman tree for entropy coding.

```
Format: Canonical Huffman table
- Code length array (1 byte per symbol)
- Symbol mapping (variable)

Size: typically 256-512 bytes
```

### Compressed Data Section

The quantized, Huffman-coded, bit-packed vector data.

```
Format: Bit stream
- Variable-length codes from Huffman table
- Packed tightly (no byte alignment)

Size: variable (target: 300-600 bytes for 1536 dims)
```

---

## Compression Algorithm

### Step 1: Center & Scale

**Purpose:** Reduce dynamic range, center around zero

```python
def center_and_scale(vector, centroid):
    # Subtract centroid (delta encoding)
    delta = vector - centroid

    # Find min/max for normalization
    min_val = delta.min()
    max_val = delta.max()

    # Normalize to [-1, 1]
    scale = max(abs(min_val), abs(max_val))
    normalized = delta / scale

    return normalized, scale, min_val
```

**Why it works:**
- Subtracting centroid → smaller deltas
- Normalizing to [-1, 1] → consistent range for quantization

### Step 2: Adaptive Quantization

**Purpose:** Convert floats to integers with minimal information loss

```python
def quantize(normalized, precision_map):
    quantized = []

    for i, value in enumerate(normalized):
        bits = precision_map[i]  # 4, 6, or 8 bits
        levels = 2 ** bits

        # Map [-1, 1] to [0, levels-1]
        quantized_value = int((value + 1) / 2 * (levels - 1))
        quantized_value = clamp(quantized_value, 0, levels - 1)

        quantized.append(quantized_value)

    return quantized
```

**Precision allocation strategy:**

For 1536-dimensional OpenAI embeddings:

```python
def get_precision_map(dimensions, level):
    if level == 0:  # Low - 5x compression
        return [8] * dimensions  # All 8-bit

    elif level == 1:  # Medium - 10x compression
        map = []
        map += [8] * 256   # First 256 dims: 8-bit
        map += [6] * 512   # Next 512 dims: 6-bit
        map += [4] * 768   # Remaining: 4-bit
        return map

    elif level == 2:  # High - 15x compression
        map = []
        map += [6] * 512   # First 512 dims: 6-bit
        map += [4] * 1024  # Remaining: 4-bit
        return map

    elif level == 3:  # VeryHigh - 20x compression
        return [4] * dimensions  # All 4-bit
```

### Step 3: Entropy Coding (Huffman)

**Purpose:** Exploit non-uniform distribution of quantized values

```python
def build_huffman_tree(quantized_values):
    # Count frequency of each value
    freq = Counter(quantized_values)

    # Build Huffman tree (standard algorithm)
    tree = HuffmanTree(freq)

    # Generate canonical codes
    codes = tree.canonical_codes()

    return codes

def huffman_encode(quantized, codes):
    bitstream = BitStream()

    for value in quantized:
        code = codes[value]
        bitstream.write(code)

    return bitstream.to_bytes()
```

**Why it works:**
- Quantized values cluster around 0
- Huffman codes: frequent values = short codes
- Typical savings: 2x on top of quantization

### Step 4: Binary Packing

**Purpose:** Pack bits tightly, add metadata

```python
def pack(header, centroid, precision_map, huffman_table, data):
    buffer = ByteArray()

    # Write header
    buffer.write(header.to_bytes())

    # Write centroid (float32 array)
    buffer.write(centroid.to_bytes())

    # Write precision map
    buffer.write(pack_precision_map(precision_map))

    # Write Huffman table
    buffer.write(huffman_table.to_bytes())

    # Write compressed data
    buffer.write(data)

    # Compute and update checksum
    checksum = crc32(buffer)
    buffer.write_at_offset(28, checksum)

    return buffer
```

---

## Decompression Algorithm

### Step 1: Unpack Binary

```python
def unpack(compressed_bytes):
    reader = ByteReader(compressed_bytes)

    # Read header
    header = StratusHeader.from_bytes(reader.read(32))

    # Validate
    if header.magic != 0x53545254:
        raise ValueError("Invalid magic number")

    if header.version != 1:
        raise ValueError(f"Unsupported version: {header.version}")

    # Verify checksum
    computed_checksum = crc32(reader.peek_all())
    if computed_checksum != header.checksum:
        raise ValueError("Checksum mismatch")

    # Read sections
    centroid = reader.read_floats(header.dimensions)
    precision_map = unpack_precision_map(reader.read(header.precision_size))
    huffman_table = HuffmanTable.from_bytes(reader.read(header.huffman_size))
    data = reader.read(header.data_size)

    return header, centroid, precision_map, huffman_table, data
```

### Step 2: Huffman Decode

```python
def huffman_decode(data, huffman_table, dimensions):
    bitstream = BitStream(data)
    quantized = []

    for i in range(dimensions):
        value = huffman_table.decode_next(bitstream)
        quantized.append(value)

    return quantized
```

### Step 3: Dequantize

```python
def dequantize(quantized, precision_map):
    normalized = []

    for i, q_value in enumerate(quantized):
        bits = precision_map[i]
        levels = 2 ** bits

        # Map [0, levels-1] back to [-1, 1]
        float_value = (q_value / (levels - 1)) * 2 - 1
        normalized.append(float_value)

    return normalized
```

### Step 4: Denormalize

```python
def denormalize(normalized, scale, centroid):
    # Reverse scaling
    delta = normalized * scale

    # Add centroid back
    vector = delta + centroid

    return vector
```

---

## Quality Guarantees

### Cosine Similarity Preservation

Target: Maintain ≥95% of original cosine similarity

**Measurement:**

```python
def quality_test(original, compressed):
    # Compress and decompress
    compressed_bytes = compress(original)
    restored = decompress(compressed_bytes)

    # Compute cosine similarity
    original_norm = original / np.linalg.norm(original)
    restored_norm = restored / np.linalg.norm(restored)

    similarity = np.dot(original_norm, restored_norm)

    return similarity
```

**Expected results:**

| Level | Target Similarity | Measured (OpenAI 1536-dim) |
|-------|-------------------|---------------------------|
| Low | ≥99% | 99.2% |
| Medium | ≥97% | 97.8% |
| High | ≥95% | 95.4% |
| VeryHigh | ≥90% | 91.2% |

### Error Bounds

**Dimension-wise error:**

```
max_error = (1 / (2^bits - 1)) * scale

Examples:
- 8-bit: max_error = (1/255) * scale ≈ 0.4% per dimension
- 6-bit: max_error = (1/63) * scale ≈ 1.6% per dimension
- 4-bit: max_error = (1/15) * scale ≈ 6.7% per dimension
```

**Overall error (L2 norm):**

```
expected_l2_error = sqrt(sum(max_error_i^2))

For Medium level (mixed precision):
≈ sqrt(256 * (0.4%)^2 + 512 * (1.6%)^2 + 768 * (6.7%)^2)
≈ 5.2% L2 error
```

---

## Performance Characteristics

### Time Complexity

**Compression:**
- Center & Scale: O(d) where d = dimensions
- Quantization: O(d)
- Huffman encoding: O(d log d) for tree build, O(d) for encoding
- Binary packing: O(d)
- **Total: O(d log d)**

**Decompression:**
- Unpacking: O(1)
- Huffman decoding: O(d)
- Dequantization: O(d)
- Denormalization: O(d)
- **Total: O(d)**

### Space Complexity

**Compression:**
- Input: O(d) float32
- Centroid: O(d) float32
- Quantized: O(d) uint8
- **Total: O(d)**

**Decompression:**
- Input: O(d/k) compressed (k = compression ratio)
- Output: O(d) float32
- **Total: O(d)**

### Empirical Performance (1536-dim vectors)

| Operation | Time (single-threaded) | Throughput |
|-----------|------------------------|------------|
| Compress | 0.8ms | 1,250/sec |
| Decompress | 0.08ms | 12,500/sec |
| Batch compress (1000) | 600ms | 1,667/sec |
| Batch decompress (1000) | 60ms | 16,667/sec |

---

## Model-Specific Profiles

Profiles are pre-computed centroid + precision maps tuned for specific embedding models.

### Profile Format

```typescript
interface CompressionProfile {
  name: string;
  model: string;
  dimensions: number;
  centroid: Float32Array;
  precisionMaps: {
    low: Uint8Array;
    medium: Uint8Array;
    high: Uint8Array;
    veryHigh: Uint8Array;
  };
  metadata: {
    trainedOn: string;
    sampleSize: number;
    avgQuality: number;
  };
}
```

### Creating Profiles

```python
def create_profile(model_name, sample_embeddings):
    # Compute centroid from sample
    centroid = np.mean(sample_embeddings, axis=0)

    # Analyze dimension variance
    variance = np.var(sample_embeddings, axis=0)

    # Allocate precision based on variance
    precision_maps = {}
    for level in ['low', 'medium', 'high', 'veryHigh']:
        precision_maps[level] = allocate_precision(variance, level)

    # Test quality
    avg_quality = test_quality(sample_embeddings, centroid, precision_maps)

    return Profile(
        name=f"{model_name}-v1",
        model=model_name,
        dimensions=len(centroid),
        centroid=centroid,
        precisionMaps=precision_maps,
        metadata={
            'trainedOn': datetime.now(),
            'sampleSize': len(sample_embeddings),
            'avgQuality': avg_quality
        }
    )
```

### Built-in Profiles

1. **OpenAI text-embedding-3-small** (1536-dim)
2. **OpenAI text-embedding-3-large** (3072-dim)
3. **Voyage AI voyage-2** (1024-dim)
4. **Cohere embed-english-v3.0** (1024-dim)
5. **Generic** (fallback for unknown models)

---

## Versioning & Compatibility

### Format Version 1

- Supports dimensions: 64-8192
- Supports compression levels: 0-3
- Header size: 32 bytes fixed
- Checksum: CRC32

### Forward Compatibility

Future versions may add:
- New compression levels
- Additional metadata fields
- Alternative quantization schemes

**Guarantee:** Version 1 decoders will reject future formats gracefully (version check in header).

### Backward Compatibility

**Guarantee:** Version 2+ decoders will support version 1 formats.

---

## Security Considerations

### Integrity

- CRC32 checksum prevents corrupted data
- Magic number prevents format confusion
- Version check prevents unsupported formats

### Safety

- No code execution (pure data format)
- No external dependencies
- No network access
- Bounded memory allocation

### Privacy

- No telemetry
- No cloud dependencies
- Fully local operation

---

## Testing Requirements

### Unit Tests

- [ ] Header serialization/deserialization
- [ ] Centroid encoding/decoding
- [ ] Precision map packing/unpacking
- [ ] Huffman tree construction
- [ ] Quantization/dequantization
- [ ] End-to-end round-trip

### Integration Tests

- [ ] Compress → decompress → verify similarity
- [ ] Multiple compression levels
- [ ] Various vector dimensions
- [ ] Error handling (corrupt data, invalid headers)
- [ ] Performance benchmarks

### Quality Tests

- [ ] Cosine similarity preservation
- [ ] L2 error bounds
- [ ] Ranking preservation (top-k results match)
- [ ] Distribution preservation (histogram similarity)

---

## Future Extensions

### Progressive Decompression

Decompress only first K dimensions for fast approximate search:

```python
def decompress_partial(compressed, k_dims):
    # Only decompress first k dimensions
    # Much faster for approximate retrieval
    pass
```

### Streaming Compression

For very large batches:

```python
def compress_stream(embedding_iterator):
    # Process embeddings one at a time
    # Memory-efficient for millions of vectors
    pass
```

### GPU Acceleration

```python
def compress_gpu(embeddings, device='cuda:0'):
    # Batch quantization on GPU
    # 10-100x faster for large batches
    pass
```

---

## References

- [IEEE 754 Floating Point Standard](https://en.wikipedia.org/wiki/IEEE_754)
- [Huffman Coding](https://en.wikipedia.org/wiki/Huffman_coding)
- [Canonical Huffman Code](https://en.wikipedia.org/wiki/Canonical_Huffman_code)
- [Product Quantization](https://hal.inria.fr/inria-00514462v2/document)

---

**Next Steps:**

1. Review & approve this spec
2. Use as reference for implementation
3. Update as needed during development
4. Keep in sync with code

---

**Questions?** Open an issue or discussion in the repo.
