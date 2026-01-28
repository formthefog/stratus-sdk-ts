# Stratus SDK - Project Structure

This document outlines the complete file structure for the Stratus compression SDK.

---

## Directory Tree

```
@stratus-embeddings/compression/
├── README.md                    # Main documentation
├── PRD.md                       # Product requirements
├── SPEC.md                      # Technical specification
├── ROADMAP.md                   # Development roadmap
├── LICENSE                      # MIT license
├── package.json                 # npm package config
├── tsconfig.json                # TypeScript config
├── .gitignore                   # Git ignore rules
├── .npmignore                   # npm ignore rules
│
├── src/                         # Source code
│   ├── index.ts                 # Main entry point (exports)
│   ├── types.ts                 # TypeScript type definitions
│   ├── constants.ts             # Constants and enums
│   ├── errors.ts                # Custom error classes
│   │
│   ├── compress.ts              # Main compression function
│   ├── decompress.ts            # Main decompression function
│   ├── info.ts                  # Compression info/metadata
│   │
│   ├── quantize/                # Quantization algorithms
│   │   ├── index.ts
│   │   ├── adaptive.ts          # Adaptive precision quantization
│   │   ├── fixed.ts             # Fixed precision quantization
│   │   └── utils.ts
│   │
│   ├── entropy/                 # Entropy coding
│   │   ├── index.ts
│   │   ├── huffman.ts           # Huffman encoding/decoding
│   │   ├── canonical.ts         # Canonical Huffman
│   │   └── utils.ts
│   │
│   ├── packing/                 # Binary packing
│   │   ├── index.ts
│   │   ├── header.ts            # Header serialization
│   │   ├── bits.ts              # Bit-level packing/unpacking
│   │   └── checksum.ts          # CRC32 checksum
│   │
│   ├── profiles/                # Model-specific profiles
│   │   ├── index.ts
│   │   ├── openai.ts            # OpenAI embeddings
│   │   ├── voyage.ts            # Voyage AI
│   │   ├── cohere.ts            # Cohere
│   │   ├── generic.ts           # Generic fallback
│   │   └── loader.ts            # Profile loading logic
│   │
│   ├── similarity/              # Similarity functions
│   │   ├── index.ts
│   │   ├── cosine.ts            # Cosine similarity
│   │   ├── compressed.ts        # Similarity on compressed vectors
│   │   └── utils.ts
│   │
│   ├── batch/                   # Batch operations
│   │   ├── index.ts
│   │   ├── compress.ts          # Batch compression
│   │   ├── decompress.ts        # Batch decompression
│   │   └── parallel.ts          # Parallel processing
│   │
│   ├── migration/               # Migration helpers
│   │   ├── index.ts
│   │   ├── sqlite.ts            # SQLite migration
│   │   ├── postgres.ts          # Postgres migration
│   │   └── json.ts              # JSON file conversion
│   │
│   └── utils/                   # Utilities
│       ├── index.ts
│       ├── math.ts              # Math helpers
│       ├── buffer.ts            # Buffer operations
│       └── validation.ts        # Input validation
│
├── cli/                         # CLI tool
│   ├── index.ts                 # CLI entry point
│   ├── commands/
│   │   ├── compress.ts          # Compress command
│   │   ├── decompress.ts        # Decompress command
│   │   ├── bench.ts             # Benchmark command
│   │   └── info.ts              # Info command
│   └── utils/
│       ├── args.ts              # Argument parsing
│       ├── progress.ts          # Progress bar
│       └── format.ts            # Output formatting
│
├── tests/                       # Test files
│   ├── unit/                    # Unit tests
│   │   ├── compress.test.ts
│   │   ├── decompress.test.ts
│   │   ├── quantize.test.ts
│   │   ├── entropy.test.ts
│   │   ├── packing.test.ts
│   │   └── similarity.test.ts
│   │
│   ├── integration/             # Integration tests
│   │   ├── roundtrip.test.ts    # Compress → decompress
│   │   ├── batch.test.ts        # Batch operations
│   │   ├── profiles.test.ts     # Model profiles
│   │   └── migration.test.ts    # Migration helpers
│   │
│   ├── quality/                 # Quality tests
│   │   ├── similarity.test.ts   # Cosine similarity preservation
│   │   ├── ranking.test.ts      # Ranking preservation
│   │   └── distribution.test.ts # Distribution preservation
│   │
│   ├── performance/             # Performance tests
│   │   ├── speed.test.ts        # Speed benchmarks
│   │   ├── memory.test.ts       # Memory usage
│   │   └── throughput.test.ts   # Batch throughput
│   │
│   ├── fixtures/                # Test data
│   │   ├── openai-1536.json     # Sample embeddings
│   │   ├── voyage-1024.json
│   │   └── cohere-1024.json
│   │
│   └── helpers/                 # Test utilities
│       ├── embeddings.ts        # Generate test embeddings
│       ├── assertions.ts        # Custom assertions
│       └── benchmarks.ts        # Benchmark helpers
│
├── benchmarks/                  # Benchmark scripts
│   ├── run.js                   # Main benchmark runner
│   ├── compression-ratio.js     # Compression ratio tests
│   ├── speed.js                 # Speed tests
│   ├── quality.js               # Quality tests
│   ├── comparison.js            # vs gzip, quantization, etc.
│   └── results/                 # Benchmark results
│       └── .gitkeep
│
├── docs/                        # Documentation
│   ├── api.md                   # API reference
│   ├── migration.md             # Migration guide
│   ├── performance.md           # Performance tuning
│   ├── troubleshooting.md       # Common issues
│   └── examples/                # Example code
│       ├── basic.ts
│       ├── langchain.ts
│       ├── sqlite.ts
│       └── batch.ts
│
├── examples/                    # Runnable examples
│   ├── basic/                   # Basic usage
│   │   ├── compress.ts
│   │   └── decompress.ts
│   ├── integrations/            # Framework integrations
│   │   ├── langchain.ts
│   │   ├── llamaindex.ts
│   │   └── chromadb.ts
│   ├── migration/               # Migration examples
│   │   ├── sqlite.ts
│   │   ├── postgres.ts
│   │   └── json.ts
│   └── advanced/                # Advanced usage
│       ├── custom-profile.ts
│       ├── parallel.ts
│       └── streaming.ts
│
└── scripts/                     # Development scripts
    ├── generate-profiles.ts     # Generate model profiles
    ├── test-quality.ts          # Quality testing
    ├── benchmark.ts             # Run benchmarks
    └── publish.sh               # Publish to npm
```

---

## Key Files Explained

### Core Implementation

**`src/compress.ts`**
- Main compression entry point
- Orchestrates quantize → entropy → pack pipeline
- Handles compression levels and profiles

**`src/decompress.ts`**
- Main decompression entry point
- Orchestrates unpack → decode → dequantize pipeline
- Validates checksums and formats

**`src/types.ts`**
- TypeScript interfaces and types
- `CompressedVector`, `CompressionLevel`, `Profile`, etc.

### Algorithms

**`src/quantize/adaptive.ts`**
- Adaptive precision quantization
- Allocates bits based on dimension importance
- Core quality preservation logic

**`src/entropy/huffman.ts`**
- Huffman tree construction
- Encoding/decoding bitstreams
- Canonical code generation

**`src/packing/bits.ts`**
- Bit-level packing (no byte boundaries)
- Efficient buffer operations
- SIMD-friendly operations

### Profiles

**`src/profiles/openai.ts`**
```typescript
export const OPENAI_TEXT_EMBEDDING_3_SMALL: Profile = {
  name: 'openai/text-embedding-3-small',
  dimensions: 1536,
  centroid: Float32Array.from([...]), // Pre-computed
  precisionMaps: {
    low: Uint8Array.from([...]),
    medium: Uint8Array.from([...]),
    high: Uint8Array.from([...]),
    veryHigh: Uint8Array.from([...]),
  },
  metadata: {
    trainedOn: '2024-01-15',
    sampleSize: 100000,
    avgQuality: 0.973,
  },
};
```

### CLI

**`cli/index.ts`**
- CLI entry point
- Command routing
- Help text and usage

**`cli/commands/compress.ts`**
```typescript
export async function compressCommand(args: Args) {
  const input = readFile(args.input);
  const embeddings = JSON.parse(input);

  const compressed = embeddings.map(e => compress(e, {
    level: args.level,
    model: args.model,
  }));

  writeFile(args.output, JSON.stringify(compressed));
}
```

### Tests

**`tests/unit/compress.test.ts`**
```typescript
describe('compress', () => {
  it('should compress vector to ~600 bytes', () => {
    const vector = generateTestVector(1536);
    const compressed = compress(vector);
    expect(compressed.byteLength).toBeLessThan(700);
    expect(compressed.byteLength).toBeGreaterThan(500);
  });

  it('should preserve cosine similarity > 95%', () => {
    const vector = generateTestVector(1536);
    const compressed = compress(vector, { level: 'high' });
    const restored = decompress(compressed);
    const sim = cosineSimilarity(vector, restored);
    expect(sim).toBeGreaterThan(0.95);
  });
});
```

**`tests/quality/similarity.test.ts`**
```typescript
describe('quality preservation', () => {
  it('should maintain ranking order', () => {
    const query = generateTestVector(1536);
    const corpus = generateTestVectors(100, 1536);

    // Compute similarities on original
    const original = corpus
      .map(v => cosineSimilarity(query, v))
      .map((sim, i) => ({ i, sim }))
      .sort((a, b) => b.sim - a.sim);

    // Compress and recompute
    const compressed = corpus.map(compress);
    const restored = compressed.map(decompress);
    const restored = restored
      .map(v => cosineSimilarity(query, v))
      .map((sim, i) => ({ i, sim }))
      .sort((a, b) => b.sim - a.sim);

    // Top-10 should match
    const topOriginal = original.slice(0, 10).map(x => x.i);
    const topRestored = restored.slice(0, 10).map(x => x.i);
    const overlap = topOriginal.filter(i => topRestored.includes(i)).length;

    expect(overlap).toBeGreaterThanOrEqual(9); // 90%+ overlap
  });
});
```

### Benchmarks

**`benchmarks/compression-ratio.js`**
```javascript
const { compress } = require('../dist');

// Load test data
const embeddings = require('./fixtures/openai-1536.json');

// Benchmark each level
for (const level of ['low', 'medium', 'high', 'veryHigh']) {
  const compressed = embeddings.map(e => compress(e, { level }));

  const originalSize = embeddings.length * 1536 * 4; // float32
  const compressedSize = compressed.reduce((sum, c) => sum + c.byteLength, 0);

  console.log(`Level: ${level}`);
  console.log(`  Original: ${(originalSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  Compressed: ${(compressedSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  Ratio: ${(originalSize / compressedSize).toFixed(1)}x`);
  console.log();
}
```

---

## Build Output

After running `npm run build`, the `dist/` directory will contain:

```
dist/
├── index.js              # CommonJS entry
├── index.mjs             # ESM entry
├── index.d.ts            # TypeScript types
├── cli.js                # CLI executable
├── compress.js
├── decompress.js
├── quantize/
├── entropy/
├── packing/
├── profiles/
└── ...                   # All other modules
```

---

## Development Workflow

### Initial Setup

```bash
git clone <repo>
cd stratus/sdk
npm install
```

### Development

```bash
# Watch mode (rebuilds on changes)
npm run dev

# Run tests (watch mode)
npm test

# Type check
npm run typecheck

# Lint
npm run lint
```

### Testing

```bash
# Run all tests
npm test

# Run specific test suite
npm test -- tests/unit/compress.test.ts

# Coverage report
npm run test:coverage

# Run benchmarks
npm run bench
```

### Pre-Publish Checklist

```bash
# 1. Run full test suite
npm test

# 2. Check types
npm run typecheck

# 3. Lint
npm run lint

# 4. Build
npm run build

# 5. Test CLI
./dist/cli.js --version
./dist/cli.js compress --help

# 6. Run benchmarks
npm run bench

# 7. Update version
npm version patch  # or minor, major

# 8. Publish
npm publish
```

---

## Next Steps

1. ✅ Review project structure
2. ⬜ Set up GitHub repo
3. ⬜ Create initial package structure
4. ⬜ Implement core compression (Week 1-2)
5. ⬜ Run quality tests
6. ⬜ Publish to npm

See [ROADMAP.md](./ROADMAP.md) for detailed timeline.

---

**Questions?** Open an issue or discussion in the repo.
