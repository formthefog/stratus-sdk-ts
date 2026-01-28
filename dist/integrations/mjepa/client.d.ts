/**
 * M-JEPA-G API Client
 *
 * Type-safe TypeScript client for the deployed M-JEPA-G API server.
 *
 * @purpose Production-ready client for M-JEPA-G world model interactions
 * @spec Plan: M-JEPA-G Ecosystem Integration
 */
import { MJepaClientConfig, ChatCompletionRequest, ChatCompletionResponse, ChatCompletionChunk, RolloutRequest, RolloutResponse } from './types.js';
/**
 * M-JEPA-G API Client
 *
 * Provides type-safe access to M-JEPA-G endpoints:
 * - Chat completions (OpenAI-compatible)
 * - State rollout (trajectory prediction)
 * - Streaming support
 * - Built-in error handling and retries
 */
export declare class MJepaGClient {
    private apiUrl;
    private apiKey;
    private timeout;
    private retries;
    private compressionProfile;
    constructor(config: MJepaClientConfig);
    /**
     * Chat completions API (OpenAI-compatible)
     */
    get chat(): {
        completions: {
            /**
             * Create a chat completion
             */
            create: (request: ChatCompletionRequest) => Promise<ChatCompletionResponse>;
            /**
             * Stream a chat completion
             */
            stream: (request: ChatCompletionRequest) => AsyncGenerator<ChatCompletionChunk, any, any>;
        };
    };
    /**
     * Create a chat completion (non-streaming)
     */
    private createChatCompletion;
    /**
     * Stream a chat completion
     */
    private streamChatCompletion;
    /**
     * Predict state trajectory (rollout)
     */
    rollout(request: RolloutRequest): Promise<RolloutResponse>;
    /**
     * Make an HTTP request with retries
     */
    private request;
    /**
     * Check API health
     */
    health(): Promise<{
        status: string;
        model_loaded: boolean;
    }>;
    /**
     * Get compression ratio estimate
     */
    getCompressionRatio(): string;
    /**
     * Get quality score estimate
     */
    getQualityScore(): number;
}
