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
import { StratusClient } from './client.js';
/**
 * Simple in-memory cache with TTL
 */
export declare class SimpleCache<T> {
    private cache;
    private ttl;
    constructor(ttlSeconds?: number);
    /**
     * Get cached value
     */
    get(key: string): T | null;
    /**
     * Set cached value
     */
    set(key: string, value: T): void;
    /**
     * Clear cache
     */
    clear(): void;
    /**
     * Get cache size
     */
    size(): number;
}
/**
 * Rate limiter using token bucket algorithm
 */
export declare class RateLimiter {
    private tokens;
    private maxTokens;
    private refillRate;
    private lastRefill;
    /**
     * @param maxRequestsPerSecond Maximum requests per second
     */
    constructor(maxRequestsPerSecond?: number);
    /**
     * Attempt to acquire a token
     * @returns true if request can proceed, false if rate limited
     */
    acquire(): Promise<boolean>;
    /**
     * Wait until a token is available
     */
    wait(): Promise<void>;
    /**
     * Refill tokens based on elapsed time
     */
    private refill;
    /**
     * Reset rate limiter
     */
    reset(): void;
}
/**
 * Credit monitor for Stratus API
 */
export declare class CreditMonitor {
    private client;
    private warningThreshold;
    private criticalThreshold;
    private onWarning?;
    private onCritical?;
    constructor(client: StratusClient, options?: {
        warningThreshold?: number;
        criticalThreshold?: number;
        onWarning?: (balance: number) => void;
        onCritical?: (balance: number) => void;
    });
    /**
     * Check credit balance.
     *
     * NOTE: Not yet implemented. A dedicated credits balance endpoint is not
     * available on the Stratus API at this time. When an API call fails with
     * insufficient_credits, the error response includes available_credits.
     *
     * TODO: Implement when a balance endpoint is available.
     */
    checkBalance(): Promise<{
        balance: number;
        status: 'ok' | 'warning' | 'critical';
    }>;
    /**
     * Start monitoring (check every interval)
     */
    startMonitoring(intervalSeconds?: number): NodeJS.Timeout;
    /**
     * Stop monitoring
     */
    stopMonitoring(timer: NodeJS.Timeout): void;
}
/**
 * Health checker for M-JEPA-G API
 */
export declare class HealthChecker {
    private client;
    private checkInterval;
    private unhealthyCallback?;
    constructor(client: StratusClient, options?: {
        checkIntervalSeconds?: number;
        onUnhealthy?: () => void;
    });
    /**
     * Check API health
     */
    check(): Promise<{
        healthy: boolean;
        modelsLoaded: string[];
        error?: string;
    }>;
    /**
     * Start periodic health checks
     */
    startMonitoring(): NodeJS.Timeout;
    /**
     * Stop health checks
     */
    stopMonitoring(timer: NodeJS.Timeout): void;
}
/**
 * Retry helper with exponential backoff
 */
export declare function retryWithBackoff<T>(fn: () => Promise<T>, options?: {
    maxRetries?: number;
    initialDelayMs?: number;
    maxDelayMs?: number;
    backoffMultiplier?: number;
}): Promise<T>;
/**
 * Batch processor with concurrency control
 */
export declare class BatchProcessor<TInput, TOutput> {
    private maxConcurrent;
    private onProgress?;
    constructor(options?: {
        maxConcurrent?: number;
        onProgress?: (completed: number, total: number) => void;
    });
    /**
     * Process items in batches
     */
    process(items: TInput[], fn: (item: TInput) => Promise<TOutput>): Promise<TOutput[]>;
}
/**
 * Generate cache key from request parameters
 */
export declare function generateCacheKey(params: Record<string, unknown>): string;
