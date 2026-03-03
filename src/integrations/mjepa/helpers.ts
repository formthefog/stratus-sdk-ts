/**
 * Production Helper Utilities
 *
 * Utilities for production deployment:
 * - Credit monitoring
 * - Rate limiting
 * - Caching
 * - Retry logic
 * - Health checks
 *
 * @purpose Production-ready utilities for M-JEPA-G integration
 * @spec Plan: M-JEPA-G Ecosystem Integration
 */

import { MJepaGClient } from './client.js';

/**
 * Cache entry
 */
interface CacheEntry<T> {
  value: T;
  timestamp: number;
}

/**
 * Simple in-memory cache with TTL
 */
export class SimpleCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private ttl: number;

  constructor(ttlSeconds: number = 300) {
    this.ttl = ttlSeconds * 1000;
  }

  /**
   * Get cached value
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) return null;

    // Check TTL
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  /**
   * Set cached value
   */
  set(key: string, value: T): void {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
    });
  }

  /**
   * Clear cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }
}

/**
 * Rate limiter using token bucket algorithm
 */
export class RateLimiter {
  private tokens: number;
  private maxTokens: number;
  private refillRate: number;
  private lastRefill: number;

  /**
   * @param maxRequestsPerSecond Maximum requests per second
   */
  constructor(maxRequestsPerSecond: number = 10) {
    this.maxTokens = maxRequestsPerSecond;
    this.tokens = maxRequestsPerSecond;
    this.refillRate = maxRequestsPerSecond;
    this.lastRefill = Date.now();
  }

  /**
   * Attempt to acquire a token
   * @returns true if request can proceed, false if rate limited
   */
  async acquire(): Promise<boolean> {
    this.refill();

    if (this.tokens >= 1) {
      this.tokens -= 1;
      return true;
    }

    return false;
  }

  /**
   * Wait until a token is available
   */
  async wait(): Promise<void> {
    while (!(await this.acquire())) {
      // Wait 100ms before checking again
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  /**
   * Refill tokens based on elapsed time
   */
  private refill(): void {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    const tokensToAdd = elapsed * this.refillRate;

    this.tokens = Math.min(this.tokens + tokensToAdd, this.maxTokens);
    this.lastRefill = now;
  }

  /**
   * Reset rate limiter
   */
  reset(): void {
    this.tokens = this.maxTokens;
    this.lastRefill = Date.now();
  }
}

/**
 * Credit monitor for Stratus API
 */
export class CreditMonitor {
  private client: MJepaGClient;
  private warningThreshold: number;
  private criticalThreshold: number;
  private onWarning?: (balance: number) => void;
  private onCritical?: (balance: number) => void;

  constructor(
    client: MJepaGClient,
    options?: {
      warningThreshold?: number;
      criticalThreshold?: number;
      onWarning?: (balance: number) => void;
      onCritical?: (balance: number) => void;
    }
  ) {
    this.client = client;
    this.warningThreshold = options?.warningThreshold || 100;
    this.criticalThreshold = options?.criticalThreshold || 10;
    this.onWarning = options?.onWarning;
    this.onCritical = options?.onCritical;
  }

  /**
   * Check credit balance.
   *
   * NOTE: Not yet implemented. A dedicated credits balance endpoint is not
   * available on the Stratus API at this time. When an API call fails with
   * insufficient_credits, the error response includes available_credits.
   *
   * TODO: Implement when a balance endpoint is available.
   */
  async checkBalance(): Promise<{
    balance: number;
    status: 'ok' | 'warning' | 'critical';
  }> {
    throw new Error(
      'CreditMonitor.checkBalance() is not yet implemented. ' +
        'Check available_credits in InsufficientCreditsError responses instead.'
    );
  }

  /**
   * Start monitoring (check every interval)
   */
  startMonitoring(intervalSeconds: number = 300): NodeJS.Timeout {
    return setInterval(async () => {
      await this.checkBalance();
    }, intervalSeconds * 1000);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(timer: NodeJS.Timeout): void {
    clearInterval(timer);
  }
}

/**
 * Health checker for M-JEPA-G API
 */
export class HealthChecker {
  private client: MJepaGClient;
  private checkInterval: number;
  private unhealthyCallback?: () => void;

  constructor(
    client: MJepaGClient,
    options?: {
      checkIntervalSeconds?: number;
      onUnhealthy?: () => void;
    }
  ) {
    this.client = client;
    this.checkInterval = (options?.checkIntervalSeconds || 60) * 1000;
    this.unhealthyCallback = options?.onUnhealthy;
  }

  /**
   * Check API health
   */
  async check(): Promise<{
    healthy: boolean;
    modelsLoaded: string[];
    error?: string;
  }> {
    try {
      const health = await this.client.health();

      return {
        healthy: health.status === 'healthy',
        modelsLoaded: health.stratus_models_loaded,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      if (this.unhealthyCallback) {
        this.unhealthyCallback();
      }

      return {
        healthy: false,
        modelsLoaded: [],
        error: errorMessage,
      };
    }
  }

  /**
   * Start periodic health checks
   */
  startMonitoring(): NodeJS.Timeout {
    return setInterval(async () => {
      await this.check();
    }, this.checkInterval);
  }

  /**
   * Stop health checks
   */
  stopMonitoring(timer: NodeJS.Timeout): void {
    clearInterval(timer);
  }
}

/**
 * Retry helper with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options?: {
    maxRetries?: number;
    initialDelayMs?: number;
    maxDelayMs?: number;
    backoffMultiplier?: number;
  }
): Promise<T> {
  const maxRetries = options?.maxRetries || 3;
  const initialDelay = options?.initialDelayMs || 1000;
  const maxDelay = options?.maxDelayMs || 10000;
  const multiplier = options?.backoffMultiplier || 2;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on certain errors
      if (
        lastError.message.includes('401') ||
        lastError.message.includes('400') ||
        lastError.message.includes('not found')
      ) {
        throw lastError;
      }

      if (attempt < maxRetries - 1) {
        const delay = Math.min(
          initialDelay * Math.pow(multiplier, attempt),
          maxDelay
        );

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Retry failed');
}

/**
 * Batch processor with concurrency control
 */
export class BatchProcessor<TInput, TOutput> {
  private maxConcurrent: number;
  private onProgress?: (completed: number, total: number) => void;

  constructor(options?: {
    maxConcurrent?: number;
    onProgress?: (completed: number, total: number) => void;
  }) {
    this.maxConcurrent = options?.maxConcurrent || 5;
    this.onProgress = options?.onProgress;
  }

  /**
   * Process items in batches
   */
  async process(
    items: TInput[],
    fn: (item: TInput) => Promise<TOutput>
  ): Promise<TOutput[]> {
    const results: TOutput[] = [];
    const total = items.length;
    let completed = 0;

    for (let i = 0; i < items.length; i += this.maxConcurrent) {
      const batch = items.slice(i, i + this.maxConcurrent);

      const batchResults = await Promise.all(batch.map(fn));

      results.push(...batchResults);
      completed += batchResults.length;

      if (this.onProgress) {
        this.onProgress(completed, total);
      }
    }

    return results;
  }
}

/**
 * Generate cache key from request parameters
 */
export function generateCacheKey(params: Record<string, unknown>): string {
  return JSON.stringify(params, Object.keys(params).sort());
}
