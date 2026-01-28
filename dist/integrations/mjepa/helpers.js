"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.BatchProcessor = exports.HealthChecker = exports.CreditMonitor = exports.RateLimiter = exports.SimpleCache = void 0;
exports.retryWithBackoff = retryWithBackoff;
exports.generateCacheKey = generateCacheKey;
/**
 * Simple in-memory cache with TTL
 */
class SimpleCache {
    constructor(ttlSeconds = 300) {
        this.cache = new Map();
        this.ttl = ttlSeconds * 1000;
    }
    /**
     * Get cached value
     */
    get(key) {
        const entry = this.cache.get(key);
        if (!entry)
            return null;
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
    set(key, value) {
        this.cache.set(key, {
            value,
            timestamp: Date.now(),
        });
    }
    /**
     * Clear cache
     */
    clear() {
        this.cache.clear();
    }
    /**
     * Get cache size
     */
    size() {
        return this.cache.size;
    }
}
exports.SimpleCache = SimpleCache;
/**
 * Rate limiter using token bucket algorithm
 */
class RateLimiter {
    /**
     * @param maxRequestsPerSecond Maximum requests per second
     */
    constructor(maxRequestsPerSecond = 10) {
        this.maxTokens = maxRequestsPerSecond;
        this.tokens = maxRequestsPerSecond;
        this.refillRate = maxRequestsPerSecond;
        this.lastRefill = Date.now();
    }
    /**
     * Attempt to acquire a token
     * @returns true if request can proceed, false if rate limited
     */
    async acquire() {
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
    async wait() {
        while (!(await this.acquire())) {
            // Wait 100ms before checking again
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
    /**
     * Refill tokens based on elapsed time
     */
    refill() {
        const now = Date.now();
        const elapsed = (now - this.lastRefill) / 1000;
        const tokensToAdd = elapsed * this.refillRate;
        this.tokens = Math.min(this.tokens + tokensToAdd, this.maxTokens);
        this.lastRefill = now;
    }
    /**
     * Reset rate limiter
     */
    reset() {
        this.tokens = this.maxTokens;
        this.lastRefill = Date.now();
    }
}
exports.RateLimiter = RateLimiter;
/**
 * Credit monitor for Stratus API
 */
class CreditMonitor {
    constructor(client, options) {
        this.client = client;
        this.warningThreshold = options?.warningThreshold || 100;
        this.criticalThreshold = options?.criticalThreshold || 10;
        this.onWarning = options?.onWarning;
        this.onCritical = options?.onCritical;
    }
    /**
     * Check credit balance
     * (Note: This would require a /credits endpoint on the API)
     */
    async checkBalance() {
        // Placeholder - actual implementation would call this.client for balance
        // For now, return mock data
        const balance = 500; // Mock balance
        let status = 'ok';
        if (balance <= this.criticalThreshold) {
            status = 'critical';
            if (this.onCritical) {
                this.onCritical(balance);
            }
        }
        else if (balance <= this.warningThreshold) {
            status = 'warning';
            if (this.onWarning) {
                this.onWarning(balance);
            }
        }
        return { balance, status };
    }
    /**
     * Start monitoring (check every interval)
     */
    startMonitoring(intervalSeconds = 300) {
        return setInterval(async () => {
            await this.checkBalance();
        }, intervalSeconds * 1000);
    }
    /**
     * Stop monitoring
     */
    stopMonitoring(timer) {
        clearInterval(timer);
    }
}
exports.CreditMonitor = CreditMonitor;
/**
 * Health checker for M-JEPA-G API
 */
class HealthChecker {
    constructor(client, options) {
        this.client = client;
        this.checkInterval = (options?.checkIntervalSeconds || 60) * 1000;
        this.unhealthyCallback = options?.onUnhealthy;
    }
    /**
     * Check API health
     */
    async check() {
        try {
            const health = await this.client.health();
            return {
                healthy: health.status === 'healthy',
                modelLoaded: health.model_loaded,
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            if (this.unhealthyCallback) {
                this.unhealthyCallback();
            }
            return {
                healthy: false,
                modelLoaded: false,
                error: errorMessage,
            };
        }
    }
    /**
     * Start periodic health checks
     */
    startMonitoring() {
        return setInterval(async () => {
            await this.check();
        }, this.checkInterval);
    }
    /**
     * Stop health checks
     */
    stopMonitoring(timer) {
        clearInterval(timer);
    }
}
exports.HealthChecker = HealthChecker;
/**
 * Retry helper with exponential backoff
 */
async function retryWithBackoff(fn, options) {
    const maxRetries = options?.maxRetries || 3;
    const initialDelay = options?.initialDelayMs || 1000;
    const maxDelay = options?.maxDelayMs || 10000;
    const multiplier = options?.backoffMultiplier || 2;
    let lastError = null;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await fn();
        }
        catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            // Don't retry on certain errors
            if (lastError.message.includes('401') ||
                lastError.message.includes('400') ||
                lastError.message.includes('not found')) {
                throw lastError;
            }
            if (attempt < maxRetries - 1) {
                const delay = Math.min(initialDelay * Math.pow(multiplier, attempt), maxDelay);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    throw lastError || new Error('Retry failed');
}
/**
 * Batch processor with concurrency control
 */
class BatchProcessor {
    constructor(options) {
        this.maxConcurrent = options?.maxConcurrent || 5;
        this.onProgress = options?.onProgress;
    }
    /**
     * Process items in batches
     */
    async process(items, fn) {
        const results = [];
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
exports.BatchProcessor = BatchProcessor;
/**
 * Generate cache key from request parameters
 */
function generateCacheKey(params) {
    return JSON.stringify(params, Object.keys(params).sort());
}
