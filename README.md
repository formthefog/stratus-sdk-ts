# @stratus/sdk

**Give your LLM agent a planning brain** · Add M-JEPA-G world model in 3 lines of code

[![npm version](https://img.shields.io/npm/v/@stratus/sdk)](https://www.npmjs.com/package/@stratus/sdk)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## The Problem

Your LLM agent (GPT-4, Claude, whatever) is smart. But it's **slow**, **expensive**, and **guesses** its way through multi-step tasks.

You're burning tokens on reasoning loops. Plans fail halfway through. You retry and hope.

## The Fix

Add a **world model** that predicts action sequences **before** your agent executes.

**M-JEPA-G plans. Your LLM executes.** Best of both worlds.

- **120ms planning** (vs 5-20s LLM reasoning)
- **$0.10 per 1M tokens** (30x cheaper than Claude for planning)
- **Validates before executing** (catch errors before expensive calls)
- **Works with your LLM** (GPT-4, Claude, Gemini - you choose)

---

## Quick Start

### Install

```bash
npm install @stratus/sdk
```

### Add to Your Agent (3 lines)

**Before:**
```typescript
// Your agent guesses the plan, crosses fingers
const response = await openai.chat.completions.create({
  messages: [{ role: 'user', content: 'Book a flight to NYC' }],
  model: 'gpt-4',
});
await agent.execute(response);  // Hope it works
```

**After:**
```typescript
import { MJepaGClient } from '@stratus/sdk';

// Add world model
const planner = new MJepaGClient({
  apiKey: process.env.STRATUS_API_KEY,
});

// Get validated plan
const plan = await planner.rollout({
  goal: 'Book a flight to NYC',
  initial_state: 'On airline homepage',
  max_steps: 5,
});

// Execute only if safe
if (plan.summary.outcome === 'success') {
  for (const step of plan.predictions) {
    await yourAgent.execute(step.action.action_text);
  }
}
```

**That's it.** Your agent now thinks before it acts.

---

## What You Get

### 1. **Faster Iteration**
Stop burning 20 seconds per planning loop. Get plans in 120ms.

### 2. **Way Cheaper**
Planning: $0.10 per 1M tokens (M-JEPA-G)
Execution: $3 per 1M tokens (Claude) **only when needed**

### 3. **Fewer Retries**
World model catches errors **before** you execute. No more "oops, start over."

### 4. **Keep Your LLM**
Works with GPT-4, Claude, Gemini, Llama - whatever you're already using. Just add the planning layer.

---

## Drop Into Your Stack

### LangChain

```typescript
import { MJepaGClient } from '@stratus/sdk';
import { ChatOpenAI } from 'langchain/chat_models/openai';

// Your existing setup
const llm = new ChatOpenAI({ ... });

// Add planning layer
const planner = new MJepaGClient({
  apiKey: process.env.STRATUS_API_KEY,
});

// Plan first, then execute
const result = await planner.rollout({
  goal: 'Complete the user task',
  initial_state: 'Current context: ...',
  max_steps: 5,
});

// Let your LLM execute the validated plan
for (const step of result.predictions) {
  await llm.call([{ role: 'user', content: step.action.action_text }]);
}
```

### Vercel AI SDK

```typescript
import { MJepaGClient } from '@stratus/sdk';
import { streamText } from 'ai';

const client = new MJepaGClient({
  apiKey: process.env.STRATUS_API_KEY,
});

// Use M-JEPA-G for planning, your LLM for execution
const plan = await client.chat.completions.create({
  messages: [{ role: 'user', content: 'Plan the workflow' }],
  model: 'stratus-x1-ac',
});

// Continue with your normal flow
const result = await streamText({
  model: yourLLM,
  prompt: `Execute this plan: ${plan.choices[0].message.content}`,
});
```

### AutoGPT / Custom Agents

```typescript
import { MJepaGClient, TrajectoryPredictor } from '@stratus/sdk';

class MyAgent {
  private planner: TrajectoryPredictor;
  private executor: YourLLM;

  constructor() {
    const client = new MJepaGClient({
      apiKey: process.env.STRATUS_API_KEY,
    });
    this.planner = new TrajectoryPredictor(client);
    this.executor = new YourLLM();  // GPT-4, Claude, etc.
  }

  async executeTask(goal: string) {
    // 1. World model plans the trajectory
    const plan = await this.planner.predict({
      initialState: this.getCurrentState(),
      goal,
      maxSteps: 10,
    });

    // 2. Validate quality
    if (plan.summary.qualityScore < 80) {
      return { error: 'Plan quality too low' };
    }

    // 3. Execute with your LLM
    for (const action of plan.summary.actions) {
      await this.executor.run(action);
    }

    return { success: plan.summary.goalAchieved };
  }
}
```

---

## The Pattern

**Plan → Validate → Execute**

```typescript
// 1. PLAN (120ms, $0.0001)
const plan = await planner.rollout({
  goal: 'Book flight and hotel for NYC',
  initial_state: 'On travel site',
  max_steps: 10,
});

// 2. VALIDATE (instant)
if (plan.summary.outcome !== 'success') {
  console.log('Plan failed:', plan.summary.outcome);
  return;
}

if (plan.summary.qualityScore < 85) {
  console.log('Quality too low, trying different approach');
  return;
}

// 3. EXECUTE (your LLM does the work)
for (const step of plan.predictions) {
  const result = await yourLLM.execute(step.action.action_text);
  // Update state, continue
}
```

---

## Advanced Features

### Parallel Planning (Try Multiple Approaches)

```typescript
import { TrajectoryPredictor } from '@stratus/sdk';

const predictor = new TrajectoryPredictor(client);

// Generate 3 different plans in parallel
const plans = await predictor.predictMany([
  { initialState: '...', goal: 'Fast approach', maxSteps: 3 },
  { initialState: '...', goal: 'Safe approach', maxSteps: 5 },
  { initialState: '...', goal: 'Optimal approach', maxSteps: 4 },
]);

// Pick the best one
const best = predictor.findOptimal(plans);
console.log(`Using: ${best.summary.outcome}`);
console.log(`Quality: ${best.summary.qualityScore}/100`);
```

### Streaming (Real-Time Plans)

```typescript
// Stream plans as they're generated (just like ChatGPT)
for await (const chunk of client.chat.completions.stream({
  messages: [{ role: 'user', content: 'Plan the deployment steps.' }],
  model: 'stratus-x1-ac',
})) {
  process.stdout.write(chunk.choices[0]?.delta?.content || '');
}
```

### Production Ready Out of the Box

**Automatic Retries:**
```typescript
const client = new MJepaGClient({
  apiKey: process.env.STRATUS_API_KEY,
  retries: 3,  // Exponential backoff
  timeout: 30000,
});
```

**Caching (Reduce Costs):**
```typescript
import { SimpleCache } from '@stratus/sdk';

const cache = new SimpleCache(300); // 5-min TTL

async function getPlan(goal: string) {
  const cached = cache.get(goal);
  if (cached) return cached;

  const result = await client.rollout({ goal, initial_state: '...' });
  cache.set(goal, result);
  return result;
}
```

**Rate Limiting:**
```typescript
import { RateLimiter } from '@stratus/sdk';

const limiter = new RateLimiter(10); // 10 req/sec
await limiter.wait();
const response = await client.chat.completions.create({ ... });
```

**Health Checks:**
```typescript
import { HealthChecker } from '@stratus/sdk';

const health = new HealthChecker(client, {
  onUnhealthy: () => {
    console.error('M-JEPA-G API is down!');
  },
});

// Check on startup
const status = await health.check();
if (!status.healthy) {
  throw new Error('API unavailable');
}

// Monitor continuously
health.startMonitoring(); // Checks every 60s
```

---

## Why M-JEPA-G + Your LLM?

**You don't replace your LLM. You unlock it.**

| Task | Best Tool | Why |
|------|-----------|-----|
| **Multi-step planning** | M-JEPA-G | 120ms, $0.0001, world model |
| **Natural language** | Your LLM | Best at generation & interaction |
| **Action validation** | M-JEPA-G | Catches errors before execution |
| **Execution** | Your LLM | Does what it's best at |

**The result:** Faster, cheaper, more reliable agents.

---

## OpenAI-Compatible API

Drop-in replacement for planning tasks:

**Before (OpenAI):**
```typescript
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const response = await client.chat.completions.create({
  messages: [{ role: 'user', content: 'Plan the next steps.' }],
  model: 'gpt-4',
});
```

**After (M-JEPA-G):**
```typescript
import { MJepaGClient } from '@stratus/sdk';

const client = new MJepaGClient({
  apiKey: process.env.STRATUS_API_KEY,
});

const response = await client.chat.completions.create({
  messages: [{ role: 'user', content: 'Plan the next steps.' }],
  model: 'stratus-x1-ac',
});
```

Same API. 10x faster. 10x cheaper.

---

## Complete API

### MJepaGClient

```typescript
// OpenAI-compatible
client.chat.completions.create({ messages, model })
client.chat.completions.stream({ messages, model })

// M-JEPA-G specific (trajectory prediction)
client.rollout({ goal, initial_state, max_steps })
client.health()
```

### TrajectoryPredictor

```typescript
predictor.predict({ initialState, goal, maxSteps })
predictor.predictMany([...]) // Parallel
predictor.findOptimal(plans) // Pick best
predictor.compare(trajectories) // Compare
```

### Production Utilities

```typescript
new SimpleCache(ttlSeconds)       // Cache results
new RateLimiter(reqPerSec)        // Throttle requests
new HealthChecker(client, ...)    // Monitor API
retryWithBackoff(fn, options)     // Auto-retry
```

---

## Bonus: Vector Compression

**Need to store embeddings?** Stratus SDK also includes high-performance vector compression.

Compress embeddings by 10-20x with minimal quality loss:

```typescript
import { compress, decompress, cosineSimilarity } from '@stratus/sdk';

// Get embedding from your provider (OpenAI, Cohere, etc.)
const embedding = new Float32Array(1536);
// ... fill with actual embedding values

// Compress (6144 bytes → ~600 bytes)
const compressed = compress(embedding);

// Decompress when needed
const restored = decompress(compressed);

// Quality check
const similarity = cosineSimilarity(embedding, restored);
console.log(`Similarity: ${(similarity * 100).toFixed(2)}%`); // ~99.5%
```

**Perfect for:**
- 🗄️ Vector databases (Pinecone, Chroma, Weaviate)
- 💬 RAG systems with large document collections
- 🔍 Semantic search at scale
- 📦 Edge deployment with limited memory

[See full compression documentation →](#vector-compression-reference)

---

## Try It Now

```bash
npm install @stratus/sdk
export STRATUS_API_KEY=your-key-here
node demo-mjepa.js
```

Output shows:
- ✅ Health check (API status)
- ✅ Chat completion (OpenAI-compatible)
- ✅ Trajectory prediction (multi-step planning)
- ✅ Parallel planning (multiple approaches)
- ✅ Streaming demo

---

## Testing

```bash
# Clone repository
git clone https://github.com/formthefog/stratus-sdk-ts
cd stratus-sdk-ts

# Install dependencies
npm install

# Build
npm run build

# Run demo
node demo-mjepa.js

# Run compression demo
node demo.js
```

---

## Development

```bash
# Install dependencies
npm install

# Build (compile TypeScript)
npm run build

# Watch mode (rebuild on changes)
npm run dev

# Link for local development
npm link
```

---

## Links

- **Homepage:** https://stratus.run
- **Documentation:** https://docs.stratus.run/sdk
- **npm:** https://www.npmjs.com/package/@stratus/sdk
- **GitHub:** https://github.com/formthefog/stratus-sdk-ts
- **Issues:** https://github.com/formthefog/stratus-sdk-ts/issues

---

## Support

- 📖 [Full Documentation](https://docs.stratus.run)
- 💬 [Discord Community](https://discord.gg/stratus)
- 📧 [Email Support](mailto:support@stratus.run)

---

## License

MIT License - see [LICENSE](./LICENSE) file for details.

---

**Built by [Formation](https://formation.ai)** · Making AI agents better, one world model at a time.

---

# Vector Compression Reference

<details>
<summary><strong>Click to expand full compression documentation</strong></summary>

## 🎯 Vector Compression

Stratus SDK includes specialized compression for embedding vectors that achieves 10-20x size reduction while preserving semantic similarity.

**Key Benefits:**
- **10-20x smaller storage** - Reduce database size from GBs to MBs
- **99%+ quality preserved** - Maintains cosine similarity and search ranking
- **Fast compression** - 1000s of vectors/second
- **Zero external dependencies** - Pure TypeScript implementation

---

## Performance

| Metric | Value | Notes |
|--------|-------|-------|
| **Compression Ratio** | 10-20x | vs Float32 (4 bytes/dim) |
| **Quality (Cosine Similarity)** | 99%+ | Medium compression level |
| **Compression Speed** | ~1000 vectors/sec | 1536-dim embeddings |
| **Decompression Speed** | ~1500 vectors/sec | Single-threaded |
| **Memory Overhead** | <1MB | No large tables needed |

**Example:** 1M OpenAI embeddings (1536 dims)
- **Original:** 1M × 1536 × 4 bytes = 5.9 GB
- **Compressed:** 1M × 600 bytes = 600 MB
- **Ratio:** **9.8x smaller**
- **Quality:** 99.2% average cosine similarity

---

## Basic Usage

```typescript
import { compress, decompress, cosineSimilarity } from '@stratus/sdk';

// Get an embedding from your provider (OpenAI, Cohere, etc.)
const embedding = new Float32Array(1536);
// ... fill with actual embedding values

// Compress (6144 bytes → ~600 bytes)
const compressed = compress(embedding);

// Decompress when needed
const restored = decompress(compressed);

// Quality check
const similarity = cosineSimilarity(embedding, restored);
console.log(`Similarity: ${(similarity * 100).toFixed(2)}%`); // ~99.5%
```

---

## Compression Levels

```typescript
import { compress, CompressionLevel } from '@stratus/sdk';

// Low: 5x compression, 99.5%+ quality
const compressed = compress(embedding, { level: CompressionLevel.Low });

// Medium: 10x compression, 97-99% quality (default)
const compressed = compress(embedding, { level: CompressionLevel.Medium });

// High: 15x compression, 95-97% quality
const compressed = compress(embedding, { level: CompressionLevel.High });

// VeryHigh: 20x compression, 90-95% quality
const compressed = compress(embedding, { level: CompressionLevel.VeryHigh });
```

---

## Batch Operations

```typescript
import { compressBatch, decompressBatch } from '@stratus/sdk';

// Compress many vectors efficiently
const embeddings = [
  new Float32Array(1536),
  new Float32Array(1536),
  // ... more vectors
];

const compressed = compressBatch(embeddings);
const restored = decompressBatch(compressed);
```

---

## Quality Analysis

```typescript
import { analyzeQuality } from '@stratus/sdk';

// Compress your embeddings
const compressed = compressBatch(embeddings);
const restored = decompressBatch(compressed);

// Analyze quality
const report = analyzeQuality(embeddings, restored);

console.log(report.summary);
// "Quality Analysis: GOOD (Overall Score: 97.2%)"

console.log(`Similarity: ${(report.metrics.cosineSimilarity.mean * 100).toFixed(2)}%`);
console.log(`Ranking preserved: ${(report.metrics.rankingPreservation.recallAt10 * 100).toFixed(1)}%`);
```

---

## Use Cases

### Compress Vector Database

```typescript
import { compressBatch, decompressBatch } from '@stratus/sdk';

// Before: Store embeddings as Float32Array
const embeddings = await generateEmbeddings(documents);
await db.insertEmbeddings(embeddings); // 6 GB for 1M vectors

// After: Compress before storing
const compressed = compressBatch(embeddings);
await db.insertCompressed(compressed); // 600 MB for 1M vectors

// Query time: decompress on the fly
const results = await db.searchCompressed(query, topK=10);
const restored = decompressBatch(results);
```

---

## API Reference

### Core Functions

#### `compress(vector, options?): Uint8Array`

Compress a vector embedding.

**Parameters:**
- `vector`: `Float32Array | number[]` - The embedding vector
- `options` (optional):
  - `level`: `CompressionLevel` - Compression level (default: `Medium`)
  - `model`: `string` - Model hint for optimization
  - `preservePrecision`: `number` - Min quality target 0-1

**Returns:** `Uint8Array` - Compressed vector

---

#### `decompress(compressed): Float32Array`

Decompress a compressed vector.

**Parameters:**
- `compressed`: `Uint8Array` - Compressed vector from `compress()`

**Returns:** `Float32Array` - Decompressed vector

---

#### `compressBatch(vectors, options?): Uint8Array[]`

Compress multiple vectors in batch.

**Parameters:**
- `vectors`: `(Float32Array | number[])[]` - Array of vectors
- `options`: Same as `compress()`

**Returns:** `Uint8Array[]` - Array of compressed vectors

---

#### `decompressBatch(compressed): Float32Array[]`

Decompress multiple compressed vectors.

**Parameters:**
- `compressed`: `Uint8Array[]` - Array of compressed vectors

**Returns:** `Float32Array[]` - Array of decompressed vectors

---

#### `cosineSimilarity(a, b): number`

Compute cosine similarity between two vectors.

**Parameters:**
- `a`: `Float32Array | number[]` - First vector
- `b`: `Float32Array | number[]` - Second vector

**Returns:** `number` - Similarity score (0-1, where 1 = identical)

---

#### `analyzeQuality(original, restored, options?): QualityReport`

Comprehensive quality analysis for compressed vectors.

**Parameters:**
- `original`: `Float32Array[]` - Original uncompressed vectors
- `restored`: `Float32Array[]` - Decompressed vectors
- `options` (optional):
  - `sampleSize`: `number` - Number of vectors to analyze
  - `rankingQueries`: `number` - Number of queries for ranking tests
  - `topK`: `number[]` - K values for recall
  - `includeDimensionAnalysis`: `boolean` - Per-dimension analysis

**Returns:** `QualityReport` - Comprehensive quality metrics

</details>
