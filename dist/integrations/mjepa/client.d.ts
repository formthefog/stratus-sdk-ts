/**
 * Stratus API Client
 *
 * Type-safe TypeScript client for the Stratus API.
 *
 * @purpose Production-ready client for Stratus API interactions
 */
import { StratusClientConfig, ChatCompletionRequest, ChatCompletionResponse, ChatCompletionChunk, RolloutRequest, RolloutResponse, HealthResponse, ModelsListResponse, EmbeddingRequest, EmbeddingResponse, AnthropicRequest, AnthropicResponse, SetLLMKeysRequest, GetLLMKeysResponse, LLMProvider, CreditPackagesResponse, CreditPackageName, CreditPurchaseResponse, StratusErrorType } from './types.js';
export declare class StratusAPIError extends Error {
    status: number;
    errorType: StratusErrorType;
    param?: string;
    code?: string;
    constructor(message: string, status: number, errorType: StratusErrorType, param?: string, code?: string);
}
export declare class StratusClient {
    private apiUrl;
    private apiKey;
    private timeout;
    private retries;
    readonly compressionProfile: string;
    constructor(config: StratusClientConfig);
    get chat(): {
        completions: {
            create: (request: ChatCompletionRequest) => Promise<ChatCompletionResponse>;
            stream: (request: ChatCompletionRequest) => AsyncGenerator<ChatCompletionChunk, any, any>;
        };
    };
    private createChatCompletion;
    private streamChatCompletion;
    messages(request: AnthropicRequest): Promise<AnthropicResponse>;
    rollout(request: RolloutRequest): Promise<RolloutResponse>;
    embeddings(request: EmbeddingRequest): Promise<EmbeddingResponse>;
    health(): Promise<HealthResponse>;
    listModels(): Promise<ModelsListResponse>;
    get account(): {
        llmKeys: {
            set: (keys: SetLLMKeysRequest) => Promise<{
                success: boolean;
                message: string;
            }>;
            get: () => Promise<GetLLMKeysResponse>;
            delete: (provider?: LLMProvider) => Promise<{
                success: boolean;
                message: string;
            }>;
        };
    };
    get credits(): {
        packages: () => Promise<CreditPackagesResponse>;
        purchase: (pkg: CreditPackageName, paymentHeader: string) => Promise<CreditPurchaseResponse>;
    };
    getCompressionRatio(): string;
    getQualityScore(): number;
    private buildHeaders;
    private post;
    private get;
    private delete;
    private requestWithRetry;
    private throwFromResponse;
}
