/**
 * Stratus API Client
 *
 * Type-safe TypeScript client for the Stratus API.
 *
 * @purpose Production-ready client for Stratus API interactions
 */

import {
  MJepaClientConfig,
  ChatCompletionRequest,
  ChatCompletionResponse,
  ChatCompletionChunk,
  RolloutRequest,
  RolloutResponse,
  HealthResponse,
  ModelsListResponse,
  EmbeddingRequest,
  EmbeddingResponse,
  AnthropicRequest,
  AnthropicResponse,
  SetLLMKeysRequest,
  GetLLMKeysResponse,
  LLMProvider,
  CreditPackagesResponse,
  CreditPackageName,
  CreditPurchaseResponse,
  StratusErrorResponse,
  StratusErrorType,
} from './types.js';

export class StratusAPIError extends Error {
  status: number;
  errorType: StratusErrorType;
  param?: string;
  code?: string;

  constructor(
    message: string,
    status: number,
    errorType: StratusErrorType,
    param?: string,
    code?: string
  ) {
    super(message);
    this.name = 'StratusAPIError';
    this.status = status;
    this.errorType = errorType;
    this.param = param;
    this.code = code;
  }
}

export class MJepaGClient {
  private apiUrl: string;
  private apiKey: string;
  private timeout: number;
  private retries: number;
  readonly compressionProfile: string;

  constructor(config: MJepaClientConfig) {
    this.apiUrl = (config.apiUrl ?? 'https://api.stratus.run').replace(/\/$/, '');
    this.apiKey = config.apiKey;
    this.timeout = config.timeout ?? 30000;
    this.retries = config.retries ?? 3;
    this.compressionProfile = config.compressionProfile ?? 'Medium';
  }

  get chat() {
    return {
      completions: {
        create: async (
          request: ChatCompletionRequest
        ): Promise<ChatCompletionResponse> => {
          return this.createChatCompletion(request);
        },

        stream: async function* (
          this: MJepaGClient,
          request: ChatCompletionRequest
        ): AsyncGenerator<ChatCompletionChunk> {
          yield* this.streamChatCompletion(request);
        }.bind(this),
      },
    };
  }

  private async createChatCompletion(
    request: ChatCompletionRequest
  ): Promise<ChatCompletionResponse> {
    return this.post<ChatCompletionResponse>('/v1/chat/completions', {
      ...request,
      stream: false,
    });
  }

  private async *streamChatCompletion(
    request: ChatCompletionRequest
  ): AsyncGenerator<ChatCompletionChunk> {
    const response = await fetch(`${this.apiUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: this.buildHeaders(),
      body: JSON.stringify({ ...request, stream: true }),
      signal: AbortSignal.timeout(this.timeout),
    });

    if (!response.ok) {
      await this.throwFromResponse(response);
    }

    if (!response.body) {
      throw new Error('No response body for streaming');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.trim() || line.trim() === 'data: [DONE]') continue;
          if (line.startsWith('data: ')) {
            try {
              const chunk = JSON.parse(line.slice(6)) as ChatCompletionChunk;
              yield chunk;
            } catch {
              // malformed chunk — skip
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  async messages(request: AnthropicRequest): Promise<AnthropicResponse> {
    return this.post<AnthropicResponse>('/v1/messages', request);
  }

  async rollout(request: RolloutRequest): Promise<RolloutResponse> {
    return this.post<RolloutResponse>('/v1/rollout', request);
  }

  async embeddings(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    return this.post<EmbeddingResponse>('/v1/embeddings', request);
  }

  async health(): Promise<HealthResponse> {
    const response = await fetch(`${this.apiUrl}/health`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) {
      await this.throwFromResponse(response);
    }
    return response.json() as Promise<HealthResponse>;
  }

  async listModels(): Promise<ModelsListResponse> {
    const response = await fetch(`${this.apiUrl}/v1/models`, {
      signal: AbortSignal.timeout(this.timeout),
    });
    if (!response.ok) {
      await this.throwFromResponse(response);
    }
    return response.json() as Promise<ModelsListResponse>;
  }

  get account() {
    return {
      llmKeys: {
        set: async (keys: SetLLMKeysRequest): Promise<{ success: boolean; message: string }> => {
          return this.post<{ success: boolean; message: string }>('/v1/account/llm-keys', keys);
        },
        get: async (): Promise<GetLLMKeysResponse> => {
          return this.get<GetLLMKeysResponse>('/v1/account/llm-keys');
        },
        delete: async (provider?: LLMProvider): Promise<{ success: boolean; message: string }> => {
          const url = provider
            ? `/v1/account/llm-keys?provider=${encodeURIComponent(provider)}`
            : '/v1/account/llm-keys';
          return this.delete<{ success: boolean; message: string }>(url);
        },
      },
    };
  }

  get credits() {
    return {
      packages: async (): Promise<CreditPackagesResponse> => {
        const response = await fetch(`${this.apiUrl}/v1/credits/packages`, {
          signal: AbortSignal.timeout(this.timeout),
        });
        if (!response.ok) {
          await this.throwFromResponse(response);
        }
        return response.json() as Promise<CreditPackagesResponse>;
      },

      purchase: async (
        pkg: CreditPackageName,
        paymentHeader: string
      ): Promise<CreditPurchaseResponse> => {
        const response = await fetch(`${this.apiUrl}/v1/credits/purchase/${encodeURIComponent(pkg)}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-PAYMENT': paymentHeader,
          },
          signal: AbortSignal.timeout(this.timeout),
        });
        if (!response.ok) {
          await this.throwFromResponse(response);
        }
        return response.json() as Promise<CreditPurchaseResponse>;
      },
    };
  }

  getCompressionRatio(): string {
    const ratios: Record<string, number> = {
      Low: 15.2,
      Medium: 16.8,
      High: 18.5,
      VeryHigh: 20.0,
    };
    return `${ratios[this.compressionProfile] ?? 15.2}x`;
  }

  getQualityScore(): number {
    const scores: Record<string, number> = {
      Low: 99.9,
      Medium: 99.7,
      High: 99.5,
      VeryHigh: 99.0,
    };
    return scores[this.compressionProfile] ?? 99.7;
  }

  private buildHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
      'x-api-key': this.apiKey,
    };
  }

  private async post<T>(endpoint: string, body: unknown): Promise<T> {
    return this.requestWithRetry<T>('POST', endpoint, body);
  }

  private async get<T>(endpoint: string): Promise<T> {
    return this.requestWithRetry<T>('GET', endpoint);
  }

  private async delete<T>(endpoint: string): Promise<T> {
    return this.requestWithRetry<T>('DELETE', endpoint);
  }

  private async requestWithRetry<T>(
    method: string,
    endpoint: string,
    body?: unknown
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.retries; attempt++) {
      try {
        const init: RequestInit = {
          method,
          headers: this.buildHeaders(),
          signal: AbortSignal.timeout(this.timeout),
        };

        if (body !== undefined) {
          init.body = JSON.stringify(body);
        }

        const response = await fetch(`${this.apiUrl}${endpoint}`, init);

        if (!response.ok) {
          await this.throwFromResponse(response);
        }

        return await response.json() as T;
      } catch (error) {
        if (error instanceof StratusAPIError) {
          if (error.status === 401 || error.status === 400 || error.status === 422) {
            throw error;
          }
        }

        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < this.retries - 1) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    throw lastError ?? new Error('Request failed after retries');
  }

  private async throwFromResponse(response: Response): Promise<never> {
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      throw new StratusAPIError(
        `HTTP ${response.status}`,
        response.status,
        'api_error'
      );
    }

    const errorBody = body as StratusErrorResponse;
    if (errorBody?.error) {
      throw new StratusAPIError(
        errorBody.error.message,
        response.status,
        errorBody.error.type as StratusErrorType,
        errorBody.error.param,
        errorBody.error.code
      );
    }

    throw new StratusAPIError(
      `HTTP ${response.status}`,
      response.status,
      'api_error'
    );
  }
}
