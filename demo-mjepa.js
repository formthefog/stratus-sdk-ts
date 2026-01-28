#!/usr/bin/env node
/**
 * M-JEPA-G Integration Demo
 *
 * Comprehensive demonstration of M-JEPA-G SDK integration:
 * 1. Chat completions with compression
 * 2. Trajectory prediction (state rollout)
 * 3. Batch operations
 * 4. Model comparison
 * 5. Production helpers (caching, rate limiting, health checks)
 *
 * @purpose Demo script showcasing M-JEPA-G integration features
 */

import {
  MJepaGClient,
  TrajectoryPredictor,
  compareModels,
  SimpleCache,
  RateLimiter,
  HealthChecker,
  getMJepaProfile,
  compress,
  decompress,
  analyzeQuality,
} from './dist/index.js';

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  M-JEPA-G SDK DEMO');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log();

// Configuration
const API_KEY = process.env.STRATUS_API_KEY || 'demo-key';
const API_URL = process.env.MJEPA_API_URL || 'http://212.115.124.137:8000';

// Initialize client
const client = new MJepaGClient({
  apiUrl: API_URL,
  apiKey: API_KEY,
  compressionProfile: 'Medium',
  timeout: 30000,
});

console.log(`Connected to: ${API_URL}`);
console.log(`Compression profile: Medium`);
console.log(`Estimated compression: ${client.getCompressionRatio()}`);
console.log(`Estimated quality: ${client.getQualityScore()}%`);
console.log();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 1. HEALTH CHECK
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

console.log('1. HEALTH CHECK');
console.log('─'.repeat(60));

const healthChecker = new HealthChecker(client);

try {
  const health = await healthChecker.check();
  console.log(`✓ API Status: ${health.healthy ? 'Healthy' : 'Unhealthy'}`);
  console.log(`✓ Model Loaded: ${health.modelLoaded ? 'Yes' : 'No'}`);
  if (health.error) {
    console.log(`✗ Error: ${health.error}`);
  }
} catch (error) {
  console.log(`✗ Health check failed: ${error.message}`);
  console.log('Continuing with demo using mock data...');
}
console.log();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 2. CHAT COMPLETION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

console.log('2. CHAT COMPLETION');
console.log('─'.repeat(60));

try {
  console.log('Sending chat completion request...');

  const response = await client.chat.completions.create({
    messages: [
      { role: 'user', content: 'Explain M-JEPA-G in one sentence.' }
    ],
    model: 'stratus-x1-ac',
    temperature: 0.7,
    max_tokens: 100,
  });

  console.log(`✓ Response: ${response.choices[0].message.content}`);
  console.log(`✓ Tokens used: ${response.usage.total_tokens}`);
  console.log(`✓ Model: ${response.model}`);
} catch (error) {
  console.log(`✗ Chat completion failed: ${error.message}`);
  console.log('Mock response: M-JEPA-G is a world model that predicts future states and actions using joint embedding predictive architecture.');
}
console.log();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 3. TRAJECTORY PREDICTION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

console.log('3. TRAJECTORY PREDICTION');
console.log('─'.repeat(60));

const predictor = new TrajectoryPredictor(client, { qualityThreshold: 85 });

try {
  console.log('Predicting trajectory...');

  const result = await predictor.predict({
    initialState: 'Current system stability: 45%, performance: moderate',
    goal: 'Increase stability to >80% while maintaining performance',
    maxSteps: 5,
  });

  console.log(`✓ Goal achieved: ${result.summary.goalAchieved ? 'Yes' : 'No'}`);
  console.log(`✓ Steps taken: ${result.summary.totalSteps}`);
  console.log(`✓ Quality score: ${result.summary.qualityScore.toFixed(1)}/100`);
  console.log(`✓ Actions: ${result.summary.actions.join(' → ')}`);
  console.log(`✓ Final state: ${result.summary.finalState}`);
  console.log(`✓ Tokens used: ${result.usage.total_tokens}`);
} catch (error) {
  console.log(`✗ Trajectory prediction failed: ${error.message}`);
  console.log('Mock trajectory:');
  console.log('  Step 1: Increase gain → stability: 55%');
  console.log('  Step 2: Apply filter → stability: 68%');
  console.log('  Step 3: Optimize params → stability: 82%');
  console.log('  Goal achieved: Yes');
}
console.log();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 4. COMPRESSION DEMONSTRATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

console.log('4. COMPRESSION DEMONSTRATION');
console.log('─'.repeat(60));

// Generate a mock 768-dim embedding
const mockEmbedding = new Float32Array(768);
for (let i = 0; i < 768; i++) {
  mockEmbedding[i] = (Math.random() - 0.5) * 2;
}

// Normalize to unit length (L2 norm = 1)
let sumSquares = 0;
for (let i = 0; i < 768; i++) {
  sumSquares += mockEmbedding[i] * mockEmbedding[i];
}
const norm = Math.sqrt(sumSquares);
for (let i = 0; i < 768; i++) {
  mockEmbedding[i] /= norm;
}

console.log(`Original embedding: 768 dimensions`);
console.log(`Original size: ${mockEmbedding.length * 4} bytes`);
console.log();

// Test different compression levels
const levels = ['Low', 'Medium', 'High', 'VeryHigh'];

for (const level of levels) {
  const profile = getMJepaProfile(level, 768);

  const compressed = compress(mockEmbedding, {
    profile: profile.precisionMap,
  });

  const decompressed = decompress(compressed, 768);

  const quality = analyzeQuality([mockEmbedding], [decompressed]);

  const ratio = (mockEmbedding.length * 4) / compressed.length;

  console.log(`${level} compression:`);
  console.log(`  Compressed size: ${compressed.length} bytes`);
  console.log(`  Compression ratio: ${ratio.toFixed(1)}x`);
  console.log(`  Quality: ${quality.summary}`);
  console.log();
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 5. BATCH OPERATIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

console.log('5. BATCH TRAJECTORY PREDICTION');
console.log('─'.repeat(60));

try {
  console.log('Predicting 3 trajectories in parallel...');

  const trajectories = await predictor.predictMany(
    [
      {
        initialState: 'stability: 40%',
        goal: 'Reach 80% stability',
        maxSteps: 5,
      },
      {
        initialState: 'stability: 50%',
        goal: 'Reach 80% stability',
        maxSteps: 4,
      },
      {
        initialState: 'stability: 60%',
        goal: 'Reach 80% stability',
        maxSteps: 3,
      },
    ],
    {
      maxConcurrent: 3,
      onProgress: (completed, total) => {
        process.stdout.write(`\r  Progress: ${completed}/${total}`);
      },
    }
  );

  console.log('\n');

  const optimal = predictor.findOptimal(trajectories, {
    minQuality: 80,
    maxSteps: 5,
  });

  if (optimal) {
    console.log('✓ Optimal trajectory found:');
    console.log(`  Quality: ${optimal.summary.qualityScore.toFixed(1)}/100`);
    console.log(`  Steps: ${optimal.summary.totalSteps}`);
    console.log(`  Actions: ${optimal.summary.actions.join(' → ')}`);
  }

  const comparison = predictor.compare(trajectories);
  console.log();
  console.log('✓ Comparison:');
  console.log(`  Best quality: ${comparison.best?.summary.qualityScore.toFixed(1)}/100`);
  console.log(`  Worst quality: ${comparison.worst?.summary.qualityScore.toFixed(1)}/100`);
  console.log(`  Average quality: ${comparison.average.qualityScore.toFixed(1)}/100`);
} catch (error) {
  console.log(`✗ Batch prediction failed: ${error.message}`);
}
console.log();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 6. MODEL COMPARISON
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

console.log('6. MODEL COMPARISON');
console.log('─'.repeat(60));

try {
  console.log('Comparing M-JEPA-G vs GPT-3.5...');

  const comparison = await compareModels(
    {
      models: ['mjepa-g', 'gpt-3.5-turbo'],
      tasks: ['embeddings'],
      compressionLevels: ['Medium'],
    },
    client
  );

  console.log();
  console.log('Results:');
  console.log();

  for (const result of comparison.results) {
    console.log(`${result.model}:`);
    if (result.embeddingQuality) {
      console.log(`  Embedding Quality: ${result.embeddingQuality.toFixed(1)}%`);
    }
    if (result.compressionRatio) {
      console.log(`  Compression Ratio: ${result.compressionRatio.toFixed(1)}x`);
    }
    if (result.latencyP50) {
      console.log(`  Latency (p50): ${result.latencyP50}ms`);
    }
    if (result.costPer1MTokens) {
      console.log(`  Cost per 1M tokens: $${result.costPer1MTokens.toFixed(2)}`);
    }
    console.log();
  }

  console.log('Winners:');
  console.log(`  Quality: ${comparison.winner.quality}`);
  console.log(`  Performance: ${comparison.winner.performance}`);
  console.log(`  Cost: ${comparison.winner.cost}`);
} catch (error) {
  console.log(`✗ Comparison failed: ${error.message}`);
}
console.log();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 7. PRODUCTION HELPERS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

console.log('7. PRODUCTION HELPERS');
console.log('─'.repeat(60));

// Caching
const cache = new SimpleCache(300); // 5 minute TTL
cache.set('test-key', { data: 'cached value' });
console.log(`✓ Cache set: ${cache.size()} items`);

const cached = cache.get('test-key');
console.log(`✓ Cache get: ${cached ? 'Hit' : 'Miss'}`);

// Rate limiting
const rateLimiter = new RateLimiter(10); // 10 requests/second
const canProceed = await rateLimiter.acquire();
console.log(`✓ Rate limiter: ${canProceed ? 'Acquired' : 'Limited'}`);

console.log();
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  DEMO COMPLETE');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
