# Stratus TypeScript SDK - Claude Instructions

**Context:** When working with Stratus TypeScript SDK for vector embedding compression.

## What This SDK Does

The Stratus TypeScript SDK provides:
- **High-Performance Vector Compression** - Compress embeddings by 10-20x with minimal quality loss
- **Framework Agnostic** - Works with any embedding provider (OpenAI, Cohere, Voyage, etc.)
- **Zero Dependencies** - Pure TypeScript implementation
- **Quality Preservation** - 99%+ cosine similarity maintained
- **Fast Operations** - 1000s of vectors/second compression

## When to Use This SDK

Use the Stratus TypeScript SDK when:
1. Storing large collections of embedding vectors
2. Building RAG (Retrieval Augmented Generation) systems
3. Working with vector databases (Pinecone, Chroma, Weaviate, etc.)
4. Need to reduce memory usage for embeddings
5. Deploying to edge environments with limited storage
6. Working in TypeScript/JavaScript environments

## Core Patterns

### 1. Basic Compression

```typescript
import { compress, decompress, cosineSimilarity } from '@stratus/sdk';

// Get embedding from your provider
const embedding = new Float32Array(1536); // OpenAI embedding
// ... fill with actual values

// Compress (6144 bytes → ~600 bytes)
const compressed = compress(embedding);

// Decompress when needed
const restored = decompress(compressed);

// Quality check
const similarity = cosineSimilarity(embedding, restored);
console.log(`Similarity: ${(similarity * 100).toFixed(2)}%`); // ~99.5%
```

### 2. Compression Levels

```typescript
import { compress, CompressionLevel } from '@stratus/sdk';

// Low: 5x compression, 99.5%+ quality
const low = compress(embedding, { level: CompressionLevel.Low });

// Medium: 10x compression, 97-99% quality (default)
const medium = compress(embedding, { level: CompressionLevel.Medium });

// High: 15x compression, 95-97% quality
const high = compress(embedding, { level: CompressionLevel.High });

// VeryHigh: 20x compression, 90-95% quality
const ultra = compress(embedding, { level: CompressionLevel.VeryHigh });
```

### 3. Batch Operations

```typescript
import { compressBatch, decompressBatch } from '@stratus/sdk';

// Compress many vectors efficiently
const embeddings: Float32Array[] = [...];
const compressed = compressBatch(embeddings);

// Decompress batch
const restored = decompressBatch(compressed);
```

### 4. Model-Specific Profiles

```typescript
import { compress } from '@stratus/sdk';
import { OPENAI_BALANCED, OPENAI_HIGH_QUALITY } from '@stratus/sdk/profiles';

// Use OpenAI-optimized compression
const compressed = compress(embedding, {
  profile: OPENAI_BALANCED  // Optimized for OpenAI embeddings
});
```

## Key Files

| File | Purpose |
|------|---------|
| `src/compress.ts` | Core compression/decompression logic |
| `src/profiles/openai.ts` | OpenAI-specific optimization profiles |
| `src/types.ts` | TypeScript type definitions |
| `src/index.ts` | Public API exports |
| `demo.js` | Usage examples |

## Compression Levels Explained

| Level | Ratio | Quality | Use Case |
|-------|-------|---------|----------|
| **Low** | 5x | 99.5%+ | Production search, strict quality requirements |
| **Medium** | 10x | 97-99% | General RAG, recommended default |
| **High** | 15x | 95-97% | Large-scale storage, quality acceptable |
| **VeryHigh** | 20x | 90-95% | Maximum compression, quality loss acceptable |

## OpenAI Embedding Profiles

The SDK includes optimized profiles for OpenAI text-embedding-3-small (1536 dimensions):

```typescript
import {
  OPENAI_HIGH_QUALITY,      // 99.9%+ quality, ~0.28x ratio (72% savings)
  OPENAI_BALANCED,          // 99.7%+ quality, ~0.25x ratio (75% savings)
  OPENAI_HIGH_COMPRESSION,  // 99.5%+ quality, ~0.22x ratio (78% savings)
  OPENAI_ULTRA_COMPRESSION, // 99.0%+ quality, ~0.20x ratio (80% savings)
  getOpenAIProfile,
  isOpenAIEmbedding,
  detectOpenAI
} from '@stratus/sdk/profiles';

// Auto-detect and apply OpenAI profile
if (detectOpenAI(embedding)) {
  const profile = getOpenAIProfile(CompressionLevel.Medium);
  const compressed = compress(embedding, { profile });
}
```

## Vector Database Integration

### Pinecone

```typescript
import { compress, decompress } from '@stratus/sdk';
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: '...' });
const index = pc.index('my-index');

// Store compressed
const embedding = new Float32Array(1536);
const compressed = compress(embedding);

await index.upsert([{
  id: 'doc-1',
  values: Array.from(decompress(compressed)), // Decompress for storage
  metadata: {
    compressed_bytes: compressed.byteLength,
    original_bytes: embedding.byteLength
  }
}]);
```

### Chroma

```typescript
import { ChromaClient } from 'chromadb';
import { compress, decompress } from '@stratus/sdk';

const client = new ChromaClient();
const collection = await client.getOrCreateCollection({ name: 'docs' });

// Compress before storing
const embeddings = [...]; // Float32Array[]
const compressed = compressBatch(embeddings);

// Store metadata about compression
await collection.add({
  ids: ['doc-1', 'doc-2'],
  embeddings: compressed.map(c => Array.from(decompress(c))),
  metadatas: compressed.map(c => ({ compressed_size: c.byteLength }))
});
```

## Quality Metrics

```typescript
import {
  cosineSimilarity,
  euclideanDistance,
  dotProduct,
  computeStats
} from '@stratus/sdk';

const original = new Float32Array(1536);
const compressed = compress(original);
const restored = decompress(compressed);

// Cosine similarity (most important for semantic search)
const similarity = cosineSimilarity(original, restored);

// Other metrics
const euclidean = euclideanDistance(original, restored);
const dot = dotProduct(original, restored);

// Compression stats
const stats = computeStats(original, compressed);
console.log(`
  Original size: ${stats.originalBytes} bytes
  Compressed size: ${stats.compressedBytes} bytes
  Ratio: ${stats.ratio.toFixed(2)}x
  Similarity: ${(stats.similarity * 100).toFixed(2)}%
`);
```

## Installation

```bash
npm install @stratus/sdk
```

**Requirements:** Node.js 16+ or modern browser

## TypeScript Support

The SDK is written in TypeScript with full type definitions:

```typescript
import type {
  CompressionOptions,
  CompressionLevel,
  CompressionStats,
  OpenAIProfile
} from '@stratus/sdk';

const options: CompressionOptions = {
  level: CompressionLevel.Medium,
  profile: undefined
};
```

## Performance Benchmarks

On 1536-dim OpenAI embeddings:

| Operation | Throughput | Notes |
|-----------|------------|-------|
| **Compression** | ~1000 vectors/sec | Single-threaded |
| **Decompression** | ~1500 vectors/sec | Single-threaded |
| **Batch (100 vectors)** | ~10x faster | Amortized overhead |

Memory overhead: <1MB (no large lookup tables needed)

## Best Practices

1. **Use batch operations** - `compressBatch()` is faster than individual `compress()` calls
2. **Choose the right level** - Start with Medium, adjust based on quality metrics
3. **Measure quality** - Always check cosine similarity for your use case
4. **Use model-specific profiles** - OpenAI profile gives better results for OpenAI embeddings
5. **Store compressed metadata** - Track compression ratio and quality in metadata
6. **Cache decompressed** - Decompress once and reuse if querying multiple times

## Common Mistakes to Avoid

1. ❌ Using VeryHigh compression for production search (quality may suffer)
2. ❌ Not measuring quality metrics for your specific use case
3. ❌ Compressing individual vectors in a loop (use batch operations)
4. ❌ Storing original + compressed (defeats the purpose)
5. ❌ Not using model-specific profiles when available

## Edge Cases

```typescript
// Handle different embedding sizes
const embedding = new Float32Array(768); // Different dimension
const compressed = compress(embedding); // Works for any size

// Handle normalized vs unnormalized
import { normalize } from '@stratus/sdk';
const unnormalized = new Float32Array(1536);
const normalized = normalize(unnormalized); // Better compression results

// Handle sparse vectors (mostly zeros)
// Compression is less effective on sparse vectors
const sparse = new Float32Array(1536).fill(0);
sparse[0] = 1.0;
const compressed = compress(sparse); // May not compress much
```

## Related Documentation

- **README.md** - Installation and quick start
- **SPEC.md** - Technical specification and architecture
- **PRD.md** - Product requirements and roadmap
- **INTEGRATION.md** - Integration guides for specific frameworks
- **PROJECT_STRUCTURE.md** - Codebase structure

## When Writing Code

When implementing features with this SDK:

1. **Import from @stratus/sdk** - Use package exports, not internal files
2. **Use TypeScript** - Leverage full type safety
3. **Measure quality** - Always check cosine similarity for your use case
4. **Profile-specific optimization** - Use OpenAI profile for OpenAI embeddings
5. **Batch when possible** - Use batch operations for multiple vectors

## Testing

```typescript
import { compress, decompress, cosineSimilarity } from '@stratus/sdk';

// Generate test embedding
function randomEmbedding(dims: number): Float32Array {
  const arr = new Float32Array(dims);
  for (let i = 0; i < dims; i++) {
    arr[i] = Math.random() * 2 - 1; // Range [-1, 1]
  }
  return arr;
}

// Test compression quality
const original = randomEmbedding(1536);
const compressed = compress(original);
const restored = decompress(compressed);
const similarity = cosineSimilarity(original, restored);

console.assert(similarity > 0.95, 'Quality check failed');
```

## Environment-Specific Usage

### Node.js

```typescript
import { compress, decompress } from '@stratus/sdk';
// Works out of the box
```

### Browser

```typescript
import { compress, decompress } from '@stratus/sdk';
// Also works - pure TypeScript, no Node dependencies
```

### Deno

```typescript
import { compress, decompress } from 'npm:@stratus/sdk';
// Works with npm: specifier
```

### Cloudflare Workers

```typescript
import { compress, decompress } from '@stratus/sdk';
// Works in Workers - no IO dependencies
```
