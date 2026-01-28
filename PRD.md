# Stratus Embeddings Compression SDK - PRD

**Package:** `@stratus-embeddings/compression`
**Version:** 1.0.0
**Status:** Planning
**Owner:** Formation Team
**Created:** 2026-01-27

---

## Executive Summary

Stratus is a high-performance vector compression SDK for embedding vectors. It provides **10-20x compression** with minimal quality loss, dramatically reducing storage and bandwidth costs for embedding-heavy applications while maintaining semantic search quality.

---

## Problem Statement

### Current State

Modern embedding models produce high-dimensional vectors:
- OpenAI `text-embedding-3-small`: **1536 dimensions** (6KB per vector as JSON)
- OpenAI `text-embedding-3-large`: **3072 dimensions** (12KB per vector)
- Voyage AI: **1024 dimensions** (4KB per vector)
- Cohere: **1024-4096 dimensions** (4-16KB per vector)

For applications with millions of embeddings:
- **Storage:** 1M vectors × 6KB = **6GB** uncompressed
- **Bandwidth:** Syncing embeddings across systems is slow/expensive
- **Memory:** Loading vectors into memory for search requires significant RAM
- **Cost:** Cloud storage/bandwidth charges compound quickly

### Why Existing Solutions Don't Work

1. **General compression (gzip, brotli):**
   - Only 2-3x compression on vectors
   - Must decompress entire dataset for search
   - Adds latency to every query

2. **Quantization alone:**
   - int8 quantization: 4x compression, significant quality loss
   - Binary quantization: 32x compression, severe quality loss
   - Not reversible - can't get original precision back

3. **Product Quantization (PQ):**
   - Complex to configure (codebook training)
   - Requires large datasets to train
   - Not portable across different embedding models

### The Gap

We need compression that is:
- **High ratio:** 10-20x compression
- **High quality:** <5% semantic search quality loss
- **Fast:** Near-zero decompression overhead
- **Simple:** Works out-of-the-box, no training
- **Portable:** Works with any embedding model

---

## Solution: Stratus Compression

Stratus combines multiple compression techniques into a single, optimized pipeline:

1. **Hybrid Quantization**
   - Adaptive precision: Higher precision for important dimensions
   - Dimension-aware: Preserves semantic structure

2. **Entropy Coding**
   - Huffman/Arithmetic coding on quantized values
   - Exploits clustering in embedding space

3. **Delta Encoding**
   - Stores differences from a learned centroid
   - Reduces value ranges, improves compression

4. **Binary Packing**
   - Tight bit packing (no wasted space)
   - Vectorized operations for fast decompression

### Key Innovation

**Zero-configuration compression profiles** tuned for common embedding models:
- No training required
- Works immediately with OpenAI, Voyage, Cohere, etc.
- Falls back to generic compression for custom models

---

## API Design

### TypeScript API

```typescript
import { compress, decompress, CompressionLevel } from '@stratus-embeddings/compression';

// === Basic Usage ===

// Compress a single vector
const embedding = [...]; // 1536 floats from OpenAI
const compressed = compress(embedding);
// Returns: Uint8Array (~300-600 bytes)

// Decompress
const restored = decompress(compressed);
// Returns: Float32Array (1536 floats)

// === Advanced Usage ===

// Configure compression level
const compressed = compress(embedding, {
  level: CompressionLevel.High, // High = 10x, VeryHigh = 20x
  preservePrecision: 0.95,      // 95% quality target
});

// Batch compression (more efficient)
const embeddings = [[...], [...], [...]]; // Array of vectors
const compressedBatch = compressBatch(embeddings);

// === Model-Specific Optimization ===

// Auto-detect and optimize for specific models
const compressed = compress(embedding, {
  model: 'openai/text-embedding-3-small', // Uses tuned profile
});

// === Metadata & Versioning ===

// Get compression metadata
const info = getCompressionInfo(compressed);
console.log(info);
// {
//   version: 1,
//   level: 'high',
//   originalDims: 1536,
//   compressedBytes: 312,
//   ratio: 19.2,
//   estimatedQuality: 0.96
// }

// === Similarity Search (Compressed) ===

// Compare compressed vectors without full decompression
import { cosineSimilarity } from '@stratus-embeddings/compression';

const sim = cosineSimilarity(compressed1, compressed2);
// Fast approximate similarity on compressed vectors
```

### CLI Usage

```bash
# Compress embeddings file
stratus compress embeddings.json -o embeddings.stratus

# Decompress
stratus decompress embeddings.stratus -o embeddings.json

# Benchmark compression
stratus bench embeddings.json --show-quality

# Migrate database
stratus migrate sqlite:memory.db --compress-vectors
```

---

## Technical Architecture

### Core Modules

```
@stratus-embeddings/compression/
├── src/
│   ├── compress.ts          # Main compression logic
│   ├── decompress.ts        # Decompression logic
│   ├── quantize.ts          # Quantization algorithms
│   ├── entropy.ts           # Entropy coding
│   ├── delta.ts             # Delta encoding
│   ├── profiles/            # Model-specific profiles
│   │   ├── openai.ts
│   │   ├── voyage.ts
│   │   └── generic.ts
│   ├── similarity.ts        # Compressed vector similarity
│   ├── utils.ts             # Helpers
│   └── types.ts             # TypeScript types
├── cli/                     # CLI tool
├── benchmarks/              # Performance tests
└── tests/                   # Unit tests
```

### Compression Pipeline

```
Input: Float32Array (1536 dims)
  ↓
[1] Center & Scale
    - Subtract learned centroid
    - Normalize to [-1, 1]
  ↓
[2] Adaptive Quantization
    - High-precision: First 256 dims (8-bit)
    - Med-precision: Next 512 dims (6-bit)
    - Low-precision: Remaining dims (4-bit)
  ↓
[3] Entropy Coding
    - Huffman encode quantized values
    - Exploits value clustering
  ↓
[4] Binary Packing
    - Pack bits tightly
    - Add header metadata
  ↓
Output: Uint8Array (~300-600 bytes)
```

### Decompression Pipeline

```
Input: Uint8Array
  ↓
[1] Unpack Binary
    - Read header metadata
    - Extract bit-packed values
  ↓
[2] Entropy Decode
    - Huffman decode
  ↓
[3] Dequantize
    - Reconstruct floats from quantized values
  ↓
[4] Denormalize
    - Apply inverse scaling
    - Add centroid back
  ↓
Output: Float32Array
```

---

## Performance Targets

### Compression Ratio

| Level | Target Ratio | Quality (Cosine Sim) | Use Case |
|-------|--------------|----------------------|----------|
| **Low** | 5x | 99%+ | Production search |
| **Medium** | 10x | 97%+ | General storage |
| **High** | 15x | 95%+ | Archival |
| **VeryHigh** | 20x | 90%+ | Aggressive savings |

### Speed Targets

- **Compression:** <1ms per vector (single-threaded)
- **Decompression:** <0.1ms per vector
- **Batch compression:** 10,000 vectors/sec
- **Similarity (compressed):** <0.05ms per comparison

### Size Targets (OpenAI text-embedding-3-small, 1536 dims)

| Format | Size per Vector | Reduction |
|--------|-----------------|-----------|
| JSON (uncompressed) | 6,144 bytes | Baseline |
| Float32 binary | 6,144 bytes | 0% |
| gzip | ~2,000 bytes | 67% |
| **Stratus Low** | ~1,200 bytes | **80%** |
| **Stratus Medium** | ~600 bytes | **90%** |
| **Stratus High** | ~400 bytes | **93%** |
| **Stratus VeryHigh** | ~300 bytes | **95%** |

---

## Implementation Phases

### Phase 1: Core Compression (Week 1-2)

**Goal:** Basic compress/decompress working

- [ ] Set up TypeScript package structure
- [ ] Implement quantization (adaptive precision)
- [ ] Implement entropy coding (Huffman)
- [ ] Implement binary packing
- [ ] Unit tests for each component
- [ ] Benchmark against gzip baseline

**Deliverable:** `compress()` and `decompress()` functions work, pass tests

### Phase 2: Quality & Performance (Week 3)

**Goal:** Hit performance targets

- [ ] Optimize quantization for quality
- [ ] Add batch compression
- [ ] Vectorize operations (SIMD where possible)
- [ ] Profile and optimize hot paths
- [ ] Quality benchmarks (cosine similarity preservation)

**Deliverable:** Meets speed and quality targets

### Phase 3: Model Profiles (Week 4)

**Goal:** Model-specific optimization

- [ ] Create OpenAI profile (text-embedding-3-small, 3-large)
- [ ] Create Voyage profile
- [ ] Create Cohere profile
- [ ] Auto-detection from vector dimensions
- [ ] Generic fallback profile

**Deliverable:** Better compression for common models

### Phase 4: Production Features (Week 5)

**Goal:** Production-ready

- [ ] CLI tool (`stratus compress/decompress/bench`)
- [ ] Compressed similarity search
- [ ] Migration helpers (SQLite, Postgres, etc.)
- [ ] Error handling & validation
- [ ] Documentation & examples

**Deliverable:** Ready for npm publish

### Phase 5: Ecosystem Integration (Week 6+)

**Goal:** Easy adoption

- [ ] Integrations: LangChain, LlamaIndex
- [ ] Database plugins: SQLite, Postgres vector extensions
- [ ] Example projects
- [ ] Blog post & benchmarks
- [ ] Community feedback

**Deliverable:** Ecosystem adoption

---

## Success Metrics

### Technical Metrics

- **Compression ratio:** ≥10x at Medium level
- **Quality preservation:** ≥95% cosine similarity
- **Speed:** <1ms compression, <0.1ms decompression
- **Package size:** <100KB (no heavy dependencies)

### Adoption Metrics

- **npm downloads:** 1,000/month by Month 3
- **GitHub stars:** 500+ by Month 6
- **Integrations:** 3+ major frameworks
- **Issues closed:** 90%+ within 1 week

### Business Metrics

- **Storage savings:** Users save ≥80% storage costs
- **Performance improvement:** Search latency reduced by 20%+ (from I/O savings)
- **User feedback:** 4.5+ stars, positive testimonials

---

## Dependencies

### Core Dependencies (Minimal)

```json
{
  "dependencies": {
    // NONE - pure TypeScript, no runtime dependencies
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "vitest": "^1.0.0",
    "tsup": "^8.0.0"
  }
}
```

**Why no dependencies?**
- Faster install
- Smaller bundle size
- No supply chain risk
- Maximum portability

---

## Open Questions

### Q1: Should we support streaming compression?

For large batches of vectors, streaming could reduce memory usage.

**Tradeoff:**
- Pro: Lower memory footprint
- Con: Less opportunity for batch optimization
- **Decision:** Start with batch, add streaming if needed

### Q2: What about GPU acceleration?

GPU-accelerated compression could be 10-100x faster.

**Tradeoff:**
- Pro: Much faster for large batches
- Con: Requires CUDA/GPU setup, less portable
- **Decision:** CPU-first, GPU as optional addon later

### Q3: Should we support progressive decompression?

Decompress only top-K dimensions for approximate search, then full decompress for reranking.

**Tradeoff:**
- Pro: Even faster search
- Con: More complex API
- **Decision:** Add in Phase 5 if there's demand

### Q4: License?

MIT vs Apache 2.0 vs Commercial

**Options:**
- MIT: Permissive, good for adoption
- Apache 2.0: Patent protection
- Dual license: Free for OSS, commercial for enterprise
- **Decision:** MIT for maximum adoption, can change later

---

## Competitive Landscape

| Solution | Compression Ratio | Quality | Speed | Ease of Use |
|----------|-------------------|---------|-------|-------------|
| **gzip** | 2-3x | 100% | Fast | Easy |
| **Int8 quantization** | 4x | 85-90% | Very fast | Easy |
| **Product Quantization** | 8-32x | 80-95% | Fast | Hard (training) |
| **ScaNN (Google)** | 8-16x | 90-95% | Very fast | Medium |
| **Faiss compression** | 8-32x | 85-95% | Very fast | Hard |
| **Stratus** | **10-20x** | **95%+** | **Fast** | **Very easy** |

**Stratus Differentiation:**
- No training required (unlike PQ)
- Better quality than quantization alone
- Simpler API than Faiss/ScaNN
- Language-agnostic format (works everywhere)

---

## Risks & Mitigations

### Risk 1: Quality doesn't meet targets

**Mitigation:**
- Extensive benchmarking on real datasets
- Multiple quality levels (users choose tradeoff)
- Conservative defaults (Medium level = 10x @ 97%)

### Risk 2: Speed too slow for production

**Mitigation:**
- Profile early, optimize hot paths
- SIMD/vectorization where possible
- Batch operations for throughput
- GPU acceleration as escape hatch

### Risk 3: Low adoption (too niche)

**Mitigation:**
- Clear value prop: "Save 90% on storage"
- Dead-simple API (one-liner)
- Integrate with popular frameworks
- Open source + great docs

### Risk 4: Format becomes obsolete

**Mitigation:**
- Versioned format (forward/backward compatible)
- Migration tools
- Long-term stability commitment

---

## Go-to-Market

### Launch Strategy

**Week 1: Soft Launch**
- Publish to npm as `@stratus-embeddings/compression@1.0.0-beta`
- Announce on Twitter, HN, Reddit (r/MachineLearning)
- Share benchmarks & comparisons

**Week 2-4: Content Marketing**
- Blog post: "We Compressed 1M Embeddings by 95%"
- Tutorial: "Integrate Stratus with Your Vector DB"
- Benchmarks: "Stratus vs Quantization vs Faiss"

**Month 2: Integrations**
- LangChain plugin
- LlamaIndex integration
- SQLite vector extension support

**Month 3+: Community Growth**
- Conference talks (apply to NeurIPS, ICLR workshops)
- Partnerships with vector DB companies
- Enterprise features (if demand exists)

### Pricing (Future)

**Open Core Model:**
- **Free (MIT):** Core compression SDK
- **Pro ($99/mo):** GPU acceleration, advanced profiles, support
- **Enterprise (Custom):** On-prem deployment, SLA, custom models

---

## Appendix: Technical Deep Dives

### A. Quantization Strategy

**Adaptive Precision Allocation:**

Embedding dimensions are NOT equally important:
- Early dimensions: Capture broad semantic categories
- Later dimensions: Capture fine-grained distinctions

**Our approach:**
- Analyze dimension variance across large corpus
- Allocate more bits to high-variance dimensions
- Use fewer bits for low-variance dimensions

**Example (1536 dims):**
```
Dims 0-255:    8 bits each (high precision)
Dims 256-767:  6 bits each (medium precision)
Dims 768-1535: 4 bits each (low precision)

Total bits: (256×8) + (512×6) + (768×4) = 8,240 bits = 1,030 bytes
Baseline: 1536×32 = 49,152 bits = 6,144 bytes
Ratio: 6.0x
```

After entropy coding: **~600 bytes** (10x compression)

### B. Entropy Coding

**Why it works:**

Quantized values are NOT uniformly distributed:
- Most values near 0 (after centering)
- Rare values at extremes

**Huffman coding:**
- Frequent values: Short codes (2-3 bits)
- Rare values: Long codes (8+ bits)
- Average: 4-5 bits per value (vs 8 bits fixed)

**Additional 2x compression** on top of quantization.

### C. Delta Encoding

**Centroid-based delta:**

1. Learn a "typical embedding" (centroid) from training data
2. Store difference from centroid, not absolute values
3. Differences are smaller → better compression

**Example:**
```
Original: [0.23, -0.45, 0.12, ...]
Centroid: [0.20, -0.40, 0.10, ...]
Delta:    [0.03, -0.05, 0.02, ...]  ← Smaller range!
```

Smaller range → fewer bits needed in quantization.

---

## References

- [Product Quantization for Nearest Neighbor Search](https://hal.inria.fr/inria-00514462v2/document) (Jégou et al., 2010)
- [ScaNN: Efficient Vector Similarity Search](https://ai.googleblog.com/2020/07/announcing-scann-efficient-vector.html) (Google, 2020)
- [Faiss: A Library for Efficient Similarity Search](https://github.com/facebookresearch/faiss) (Facebook AI, 2017)
- [OpenAI Embeddings Documentation](https://platform.openai.com/docs/guides/embeddings)

---

**Next Steps:**

1. Review & approve this PRD
2. Set up GitHub repo: `formation/stratus`
3. Create initial TypeScript package structure
4. Begin Phase 1 implementation

---

**Questions? Feedback?**

Reach out to the Formation team or open a discussion in the repo.
