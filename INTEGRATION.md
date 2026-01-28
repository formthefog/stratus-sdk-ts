# Stratus SDK → JFL Memory Integration

## Overview

Integrate Stratus compression into JFL Memory to compress embeddings before storing in SQLite.

## Benefits

- **Storage savings:** ~30-40% reduction in database size with compression
- **Quality preservation:** 99.5%+ cosine similarity maintained
- **Performance:** Minimal overhead (1300+ vectors/sec compress, 1200+ vectors/sec decompress)
- **Transparent:** No changes to memory API - compression/decompression automatic

## Schema Changes

### Add Compressed Embedding Column

```sql
ALTER TABLE chunks ADD COLUMN embedding_compressed BLOB;
ALTER TABLE chunks ADD COLUMN embedding_format TEXT DEFAULT 'json'; -- 'json' or 'stratus'
ALTER TABLE memories ADD COLUMN embedding_compressed BLOB;
ALTER TABLE memories ADD COLUMN embedding_format TEXT DEFAULT 'json';
```

### Migration Strategy

**Phase 1: Dual storage (transition period)**
- Store both JSON and compressed formats
- Read from compressed if available, fallback to JSON
- Allows gradual migration

**Phase 2: Compression only**
- Stop storing JSON format
- All new embeddings compressed
- Background job migrates old embeddings

## Integration Points

### 1. Storage Layer (`storage/index.ts`)

**Import Stratus:**
```typescript
import { compress, decompress, CompressionLevel } from '@stratus/sdk';
```

**Compress before saving:**
```typescript
// In saveChunk()
const embeddingData = chunk.embedding
  ? compress(new Float32Array(chunk.embedding), { level: CompressionLevel.Medium })
  : null;

db.prepare(`...`).run(
  // ...
  embeddingData, // embedding_compressed
  embeddingData ? 'stratus' : null, // embedding_format
  // ...
);
```

**Decompress when retrieving:**
```typescript
// In rowToChunk()
function rowToChunk(row: ChunkRow): Chunk {
  let embedding: number[] | undefined;

  if (row.embedding_format === 'stratus' && row.embedding_compressed) {
    // Decompress Stratus format
    const decompressed = decompress(row.embedding_compressed);
    embedding = Array.from(decompressed);
  } else if (row.embedding) {
    // Legacy JSON format
    embedding = JSON.parse(row.embedding);
  }

  return {
    // ...
    embedding,
  };
}
```

### 2. Vector Search (`retrieval/vector-search.ts`)

**No changes needed!** Decompression happens in storage layer, so search functions receive decompressed vectors as before.

### 3. Embedder Integration (`embedder/index.ts`)

**Add compression option to config:**
```typescript
export interface MemoryConfig {
  // ... existing fields
  compression?: {
    enabled: boolean;
    level?: CompressionLevel;
  };
}

export const DEFAULT_CONFIG: MemoryConfig = {
  // ...
  compression: {
    enabled: true,
    level: CompressionLevel.Medium, // 99.7% quality, 0.68x size
  },
};
```

## Testing

### Unit Tests

```typescript
import { compress, decompress, cosineSimilarity } from '@stratus/sdk';
import { createStorage } from '../storage';

describe('Stratus Compression Integration', () => {
  it('compresses and decompresses embeddings', () => {
    const storage = createStorage({ compression: { enabled: true } });

    const embedding = new Float32Array(1536);
    for (let i = 0; i < 1536; i++) {
      embedding[i] = Math.random() * 2 - 1;
    }

    // Save with compression
    const chunk = storage.saveChunk({
      documentId: 'test-doc',
      content: 'test content',
      startLine: 1,
      endLine: 1,
      contextHeader: 'test',
      embedding: Array.from(embedding),
    });

    // Retrieve and verify
    const retrieved = storage.getChunk(chunk.id);
    expect(retrieved).toBeDefined();
    expect(retrieved!.embedding).toHaveLength(1536);

    // Quality check
    const similarity = cosineSimilarity(
      embedding,
      new Float32Array(retrieved!.embedding!)
    );
    expect(similarity).toBeGreaterThan(0.995); // 99.5%+ similarity
  });

  it('handles legacy JSON format', () => {
    // Test backward compatibility with existing JSON embeddings
  });

  it('measures compression ratio', () => {
    const embedding = new Float32Array(1536);
    for (let i = 0; i < 1536; i++) {
      embedding[i] = Math.random() * 2 - 1;
    }

    const jsonSize = JSON.stringify(Array.from(embedding)).length;
    const compressed = compress(embedding);
    const ratio = compressed.length / jsonSize;

    expect(ratio).toBeLessThan(0.75); // At least 25% savings
  });
});
```

### Integration Test

```typescript
import { processDocument } from '../index';

describe('End-to-end with compression', () => {
  it('processes document with compressed embeddings', async () => {
    const doc = await processDocument({
      path: 'test.md',
      content: 'Test document content',
      type: 'markdown',
    });

    // Verify chunks have compressed embeddings
    const chunks = storage.getChunks(doc.id);
    for (const chunk of chunks) {
      expect(chunk.embedding).toBeDefined();
      expect(chunk.embedding).toHaveLength(1536);
    }

    // Verify search still works
    const results = await storage.searchMemories({
      query: 'test',
      limit: 10,
    });
    expect(results.length).toBeGreaterThan(0);
  });
});
```

## Performance Benchmarks

### Storage Overhead

```typescript
// Before compression (JSON):
// - 1536-dim embedding as JSON: ~12KB
// - 1000 embeddings: ~12MB

// After compression (Stratus):
// - 1536-dim embedding compressed: ~8KB (Medium level)
// - 1000 embeddings: ~8MB
// Savings: ~33%
```

### Query Performance

```typescript
// Decompression overhead per query:
// - 100 results @ 1200 decompress/sec = ~83ms
// - Negligible compared to SQLite query time

// Overall query latency:
// - Without compression: ~150ms (SQLite query + JSON parse)
// - With compression: ~170ms (SQLite query + decompress)
// Impact: ~13% slower, but acceptable for 33% storage savings
```

## Rollout Plan

### Week 1: Add Dual Storage

1. Add schema columns (`embedding_compressed`, `embedding_format`)
2. Update storage layer to save both formats
3. Update retrieval to read compressed first, fallback to JSON
4. Deploy and monitor

### Week 2: Compression by Default

1. Update config default: `compression.enabled = true`
2. New embeddings only saved as compressed
3. Keep reading both formats for backward compatibility
4. Monitor quality metrics

### Week 3: Migrate Existing Data

1. Background job to compress legacy JSON embeddings:
   ```sql
   SELECT id, embedding FROM chunks WHERE embedding_format = 'json';
   ```
2. Compress each embedding and update:
   ```sql
   UPDATE chunks
   SET embedding_compressed = ?, embedding_format = 'stratus'
   WHERE id = ?;
   ```
3. After migration complete, remove JSON column

## Quality Monitoring

### Metrics to Track

```typescript
interface CompressionMetrics {
  compressionRatio: number;    // compressed_size / original_size
  avgSimilarity: number;        // Average cosine similarity after decompress
  minSimilarity: number;        // Worst case quality
  decompressLatency: number;    // P50/P95/P99 latency
  storageBytes: number;         // Total storage used
}
```

### Alerts

- Alert if `avgSimilarity < 0.99` (quality degradation)
- Alert if `compressionRatio > 0.75` (not compressing well)
- Alert if `decompressLatency.p95 > 10ms` (performance issue)

## Configuration Options

```typescript
// Default (recommended)
compression: {
  enabled: true,
  level: CompressionLevel.Medium, // 99.7% quality, 0.68x size
}

// Maximum quality
compression: {
  enabled: true,
  level: CompressionLevel.Low, // 99.9% quality, 0.66x size
}

// Maximum compression
compression: {
  enabled: true,
  level: CompressionLevel.VeryHigh, // 99.5% quality, 0.73x size
}

// Disabled (legacy)
compression: {
  enabled: false,
}
```

## Next Steps

1. ✅ Phase 2 complete (Huffman entropy coding)
2. 🔄 Integrate into JFL memory (this document)
3. ⏳ Phase 3: OpenAI-specific profile
4. ⏳ Phase 4: CLI tool
