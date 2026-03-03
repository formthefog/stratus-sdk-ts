"use strict";
/**
 * Stratus API Client
 *
 * Type-safe TypeScript client for the Stratus API.
 *
 * @purpose Production-ready client for Stratus API interactions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MJepaGClient = exports.StratusAPIError = void 0;
class StratusAPIError extends Error {
    constructor(message, status, errorType, param, code) {
        super(message);
        this.name = 'StratusAPIError';
        this.status = status;
        this.errorType = errorType;
        this.param = param;
        this.code = code;
    }
}
exports.StratusAPIError = StratusAPIError;
class MJepaGClient {
    constructor(config) {
        this.apiUrl = (config.apiUrl ?? 'https://api.stratus.run').replace(/\/$/, '');
        this.apiKey = config.apiKey;
        this.timeout = config.timeout ?? 30000;
        this.retries = config.retries ?? 3;
        this.compressionProfile = config.compressionProfile ?? 'Medium';
    }
    get chat() {
        return {
            completions: {
                create: async (request) => {
                    return this.createChatCompletion(request);
                },
                stream: async function* (request) {
                    yield* this.streamChatCompletion(request);
                }.bind(this),
            },
        };
    }
    async createChatCompletion(request) {
        return this.post('/v1/chat/completions', {
            ...request,
            stream: false,
        });
    }
    async *streamChatCompletion(request) {
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
                if (done)
                    break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() ?? '';
                for (const line of lines) {
                    if (!line.trim() || line.trim() === 'data: [DONE]')
                        continue;
                    if (line.startsWith('data: ')) {
                        try {
                            const chunk = JSON.parse(line.slice(6));
                            yield chunk;
                        }
                        catch {
                            // malformed chunk — skip
                        }
                    }
                }
            }
        }
        finally {
            reader.releaseLock();
        }
    }
    async messages(request) {
        return this.post('/v1/messages', request);
    }
    async rollout(request) {
        return this.post('/v1/rollout', request);
    }
    async embeddings(request) {
        return this.post('/v1/embeddings', request);
    }
    async health() {
        const response = await fetch(`${this.apiUrl}/health`, {
            signal: AbortSignal.timeout(5000),
        });
        if (!response.ok) {
            await this.throwFromResponse(response);
        }
        return response.json();
    }
    async listModels() {
        const response = await fetch(`${this.apiUrl}/v1/models`, {
            signal: AbortSignal.timeout(this.timeout),
        });
        if (!response.ok) {
            await this.throwFromResponse(response);
        }
        return response.json();
    }
    get account() {
        return {
            llmKeys: {
                set: async (keys) => {
                    return this.post('/v1/account/llm-keys', keys);
                },
                get: async () => {
                    return this.get('/v1/account/llm-keys');
                },
                delete: async (provider) => {
                    const url = provider
                        ? `/v1/account/llm-keys?provider=${encodeURIComponent(provider)}`
                        : '/v1/account/llm-keys';
                    return this.delete(url);
                },
            },
        };
    }
    get credits() {
        return {
            packages: async () => {
                const response = await fetch(`${this.apiUrl}/v1/credits/packages`, {
                    signal: AbortSignal.timeout(this.timeout),
                });
                if (!response.ok) {
                    await this.throwFromResponse(response);
                }
                return response.json();
            },
            purchase: async (pkg, paymentHeader) => {
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
                return response.json();
            },
        };
    }
    getCompressionRatio() {
        const ratios = {
            Low: 15.2,
            Medium: 16.8,
            High: 18.5,
            VeryHigh: 20.0,
        };
        return `${ratios[this.compressionProfile] ?? 15.2}x`;
    }
    getQualityScore() {
        const scores = {
            Low: 99.9,
            Medium: 99.7,
            High: 99.5,
            VeryHigh: 99.0,
        };
        return scores[this.compressionProfile] ?? 99.7;
    }
    buildHeaders() {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
            'x-api-key': this.apiKey,
        };
    }
    async post(endpoint, body) {
        return this.requestWithRetry('POST', endpoint, body);
    }
    async get(endpoint) {
        return this.requestWithRetry('GET', endpoint);
    }
    async delete(endpoint) {
        return this.requestWithRetry('DELETE', endpoint);
    }
    async requestWithRetry(method, endpoint, body) {
        let lastError = null;
        for (let attempt = 0; attempt < this.retries; attempt++) {
            try {
                const init = {
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
                return await response.json();
            }
            catch (error) {
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
    async throwFromResponse(response) {
        let body;
        try {
            body = await response.json();
        }
        catch {
            throw new StratusAPIError(`HTTP ${response.status}`, response.status, 'api_error');
        }
        const errorBody = body;
        if (errorBody?.error) {
            throw new StratusAPIError(errorBody.error.message, response.status, errorBody.error.type, errorBody.error.param, errorBody.error.code);
        }
        throw new StratusAPIError(`HTTP ${response.status}`, response.status, 'api_error');
    }
}
exports.MJepaGClient = MJepaGClient;
