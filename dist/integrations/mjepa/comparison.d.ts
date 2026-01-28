/**
 * Model Comparison Utilities
 *
 * Compare M-JEPA-G against GPT-3.5/GPT-4/Claude on key metrics.
 *
 * @purpose Benchmark M-JEPA-G quality, performance, and cost
 * @spec Plan: M-JEPA-G Ecosystem Integration
 */
import { MJepaGClient } from './client.js';
/**
 * Model identifier
 */
export type ModelName = 'mjepa-g' | 'gpt-3.5-turbo' | 'gpt-4' | 'claude-sonnet';
/**
 * Comparison task type
 */
export type TaskType = 'embeddings' | 'chat' | 'reasoning' | 'trajectory';
/**
 * Compression level
 */
export type CompressionLevel = 'Low' | 'Medium' | 'High' | 'VeryHigh';
/**
 * Model metrics
 */
export interface ModelMetrics {
    model: ModelName;
    embeddingQuality?: number;
    responseQuality?: number;
    attributionAccuracy?: 'High' | 'Medium' | 'Low';
    latencyP50?: number;
    latencyP95?: number;
    throughput?: number;
    costPer1MTokens?: number;
    compressionRatio?: number;
    error?: string;
}
/**
 * Comparison options
 */
export interface ComparisonOptions {
    /**
     * Models to compare
     */
    models: ModelName[];
    /**
     * Tasks to run
     */
    tasks: TaskType[];
    /**
     * Compression levels to test
     */
    compressionLevels?: CompressionLevel[];
    /**
     * Number of samples per test
     * @default 10
     */
    samples?: number;
    /**
     * Test prompts (for chat/reasoning tasks)
     */
    prompts?: string[];
}
/**
 * Comparison result
 */
export interface ComparisonResult {
    results: ModelMetrics[];
    winner: {
        quality: ModelName;
        performance: ModelName;
        cost: ModelName;
    };
    timestamp: string;
}
/**
 * Model comparison framework
 */
export declare class ModelComparison {
    private mjepaClient?;
    constructor(mjepaClient?: MJepaGClient);
    /**
     * Run comparison across models
     */
    compare(options: ComparisonOptions): Promise<ComparisonResult>;
    /**
     * Benchmark a single model
     */
    private benchmarkModel;
    /**
     * Determine winners across categories
     */
    private determineWinners;
    /**
     * Generate comparison report (Markdown table)
     */
    generateReport(result: ComparisonResult): string;
    /**
     * Quick comparison: M-JEPA-G vs GPT-3.5
     */
    quickCompare(): Promise<string>;
}
/**
 * Helper: Compare M-JEPA-G against other models
 */
export declare function compareModels(options: ComparisonOptions, mjepaClient?: MJepaGClient): Promise<ComparisonResult>;
