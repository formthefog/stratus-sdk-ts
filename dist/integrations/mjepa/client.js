"use strict";
/**
 * M-JEPA-G API Client
 *
 * Type-safe TypeScript client for the deployed M-JEPA-G API server.
 *
 * @purpose Production-ready client for M-JEPA-G world model interactions
 * @spec Plan: M-JEPA-G Ecosystem Integration
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MJepaGClient = void 0;
/**
 * M-JEPA-G API Client
 *
 * Provides type-safe access to M-JEPA-G endpoints:
 * - Chat completions (OpenAI-compatible)
 * - State rollout (trajectory prediction)
 * - Streaming support
 * - Built-in error handling and retries
 */
class MJepaGClient {
    constructor(config) {
        this.apiUrl = config.apiUrl || 'http://212.115.124.137:8000';
        this.apiKey = config.apiKey;
        this.timeout = config.timeout || 30000;
        this.retries = config.retries || 3;
        this.compressionProfile = config.compressionProfile || 'Medium';
    }
    /**
     * Chat completions API (OpenAI-compatible)
     */
    get chat() {
        return {
            completions: {
                /**
                 * Create a chat completion
                 */
                create: async (request) => {
                    return this.createChatCompletion(request);
                },
                /**
                 * Stream a chat completion
                 */
                stream: async function* (request) {
                    yield* this.streamChatCompletion(request);
                }.bind(this),
            },
        };
    }
    /**
     * Create a chat completion (non-streaming)
     */
    async createChatCompletion(request) {
        const response = await this.request('/v1/chat/completions', {
            ...request,
            stream: false,
        });
        return response;
    }
    /**
     * Stream a chat completion
     */
    async *streamChatCompletion(request) {
        const response = await fetch(`${this.apiUrl}/v1/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
                ...request,
                stream: true,
            }),
            signal: AbortSignal.timeout(this.timeout),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error.message || 'Chat completion failed');
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
                if (done)
                    break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';
                for (const line of lines) {
                    if (!line.trim() || line.trim() === 'data: [DONE]')
                        continue;
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        try {
                            const chunk = JSON.parse(data);
                            yield chunk;
                        }
                        catch (e) {
                            console.error('Failed to parse SSE chunk:', data);
                        }
                    }
                }
            }
        }
        finally {
            reader.releaseLock();
        }
    }
    /**
     * Predict state trajectory (rollout)
     */
    async rollout(request) {
        return this.request('/v1/rollout', request);
    }
    /**
     * Make an HTTP request with retries
     */
    async request(endpoint, body) {
        let lastError = null;
        for (let attempt = 0; attempt < this.retries; attempt++) {
            try {
                const response = await fetch(`${this.apiUrl}${endpoint}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.apiKey}`,
                    },
                    body: JSON.stringify(body),
                    signal: AbortSignal.timeout(this.timeout),
                });
                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error.message || `Request failed: ${response.status}`);
                }
                return await response.json();
            }
            catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                // Don't retry on auth errors or client errors
                if (lastError.message.includes('401') || lastError.message.includes('400')) {
                    throw lastError;
                }
                // Exponential backoff
                if (attempt < this.retries - 1) {
                    await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
                }
            }
        }
        throw lastError || new Error('Request failed after retries');
    }
    /**
     * Check API health
     */
    async health() {
        const response = await fetch(`${this.apiUrl}/health`, {
            signal: AbortSignal.timeout(5000),
        });
        if (!response.ok) {
            throw new Error(`Health check failed: ${response.status}`);
        }
        return await response.json();
    }
    /**
     * Get compression ratio estimate
     */
    getCompressionRatio() {
        const ratios = {
            'Low': 15.2,
            'Medium': 16.8,
            'High': 18.5,
            'VeryHigh': 20.0,
        };
        return `${ratios[this.compressionProfile] || 15.2}x`;
    }
    /**
     * Get quality score estimate
     */
    getQualityScore() {
        const scores = {
            'Low': 99.9,
            'Medium': 99.7,
            'High': 99.5,
            'VeryHigh': 99.0,
        };
        return scores[this.compressionProfile] || 99.7;
    }
}
exports.MJepaGClient = MJepaGClient;
