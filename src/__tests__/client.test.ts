/**
 * API Client Tests
 *
 * @purpose Tests for StratusClient with mocked fetch — no real network calls
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { StratusClient, StratusAPIError } from '../integrations/mjepa/client.js';
import { mockFetch, mockFetchSequence, mockChatResponse } from './helpers.js';

const TEST_API_KEY = 'test-key-abc123';

function makeClient(overrides: Partial<ConstructorParameters<typeof StratusClient>[0]> = {}) {
  return new StratusClient({
    apiKey: TEST_API_KEY,
    retries: 1,
    timeout: 5000,
    ...overrides,
  });
}

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('StratusClient constructor', () => {
  it('sets default apiUrl to https://api.stratus.run', () => {
    const client = makeClient();
    // We verify the default by observing the URL in fetch calls
    mockFetch({ status: 'healthy', stratus_models_loaded: [], llm_providers: [], vault: 'disabled', brain: { loaded: false, num_actions: 0 }, version: '1.0', git_sha: 'abc' });
    client.health();
    const calls = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls[0][0]).toBe('https://api.stratus.run/health');
  });

  it('respects custom apiUrl', () => {
    mockFetch({ status: 'healthy', stratus_models_loaded: [], llm_providers: [], vault: 'disabled', brain: { loaded: false, num_actions: 0 }, version: '1.0', git_sha: 'abc' });
    const client = makeClient({ apiUrl: 'https://custom.api.example.com' });
    client.health();
    const calls = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls[0][0]).toBe('https://custom.api.example.com/health');
  });

  it('strips trailing slash from apiUrl', () => {
    mockFetch({ status: 'healthy', stratus_models_loaded: [], llm_providers: [], vault: 'disabled', brain: { loaded: false, num_actions: 0 }, version: '1.0', git_sha: 'abc' });
    const client = makeClient({ apiUrl: 'https://api.stratus.run/' });
    client.health();
    const calls = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls[0][0]).toBe('https://api.stratus.run/health');
  });
});

describe('chat.completions.create', () => {
  it('sends POST to /v1/chat/completions', async () => {
    mockFetch(mockChatResponse());
    const client = makeClient();
    await client.chat.completions.create({
      model: 'stratus-1',
      messages: [{ role: 'user', content: 'Hello' }],
    });
    const calls = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls[0][0]).toBe('https://api.stratus.run/v1/chat/completions');
    expect(calls[0][1].method).toBe('POST');
  });

  it('sends Authorization: Bearer header', async () => {
    mockFetch(mockChatResponse());
    const client = makeClient();
    await client.chat.completions.create({
      model: 'stratus-1',
      messages: [{ role: 'user', content: 'Hello' }],
    });
    const headers = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].headers;
    expect(headers['Authorization']).toBe(`Bearer ${TEST_API_KEY}`);
  });

  it('sends x-api-key header', async () => {
    mockFetch(mockChatResponse());
    const client = makeClient();
    await client.chat.completions.create({
      model: 'stratus-1',
      messages: [{ role: 'user', content: 'Hello' }],
    });
    const headers = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].headers;
    expect(headers['x-api-key']).toBe(TEST_API_KEY);
  });

  it('forces stream: false in request body', async () => {
    mockFetch(mockChatResponse());
    const client = makeClient();
    await client.chat.completions.create({
      model: 'stratus-1',
      messages: [{ role: 'user', content: 'Hello' }],
      stream: true,
    });
    const body = JSON.parse((globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body);
    expect(body.stream).toBe(false);
  });

  it('returns the chat completion response', async () => {
    const response = mockChatResponse({ id: 'chatcmpl-xyz' });
    mockFetch(response);
    const client = makeClient();
    const result = await client.chat.completions.create({
      model: 'stratus-1',
      messages: [{ role: 'user', content: 'Hello' }],
    });
    expect(result.id).toBe('chatcmpl-xyz');
  });
});

describe('chat.completions.stream', () => {
  it('forces stream: true in request body', async () => {
    // Provide a mock with a readable body for SSE
    const encoder = new TextEncoder();
    const sseData = 'data: {"id":"chunk-1","object":"chat.completion.chunk","created":1700000000,"model":"stratus-1","choices":[{"index":0,"delta":{"content":"Hi"},"finish_reason":null}]}\n\ndata: [DONE]\n\n';
    const readable = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(sseData));
        controller.close();
      },
    });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      body: readable,
    }));
    const client = makeClient();
    const chunks = [];
    for await (const chunk of client.chat.completions.stream({
      model: 'stratus-1',
      messages: [{ role: 'user', content: 'Hello' }],
      stream: false,
    })) {
      chunks.push(chunk);
    }
    const body = JSON.parse((globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body);
    expect(body.stream).toBe(true);
    expect(chunks.length).toBeGreaterThan(0);
  });
});

describe('listModels', () => {
  it('sends GET to /v1/models', async () => {
    mockFetch({ object: 'list', data: [] });
    const client = makeClient();
    await client.listModels();
    const calls = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls[0][0]).toBe('https://api.stratus.run/v1/models');
  });
});

describe('health', () => {
  it('sends GET to /health', async () => {
    mockFetch({ status: 'healthy', stratus_models_loaded: [], llm_providers: [], vault: 'disabled', brain: { loaded: false, num_actions: 0 }, version: '1.0', git_sha: 'abc' });
    const client = makeClient();
    await client.health();
    const calls = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls[0][0]).toBe('https://api.stratus.run/health');
  });

  it('returns health response body', async () => {
    const healthBody = { status: 'healthy', stratus_models_loaded: ['stratus-1'], llm_providers: ['openai'], vault: 'connected', brain: { loaded: true, num_actions: 42 }, version: '1.2.3', git_sha: 'deadbeef' };
    mockFetch(healthBody);
    const client = makeClient();
    const result = await client.health();
    expect(result.status).toBe('healthy');
  });
});

describe('embeddings', () => {
  it('sends POST to /v1/embeddings', async () => {
    mockFetch({ object: 'list', data: [], model: 'stratus-embed', usage: { prompt_tokens: 5, completion_tokens: 0, total_tokens: 5 } });
    const client = makeClient();
    await client.embeddings({ model: 'stratus-embed', input: 'hello world' });
    const calls = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls[0][0]).toBe('https://api.stratus.run/v1/embeddings');
    expect(calls[0][1].method).toBe('POST');
  });
});

describe('account.llmKeys', () => {
  it('get sends GET to /v1/account/llm-keys', async () => {
    mockFetch({ has_openai_key: true, has_anthropic_key: false, has_google_key: false, has_openrouter_key: false, openai_last_validated: null, anthropic_last_validated: null, google_last_validated: null, openrouter_last_validated: null, formation_keys_available: true });
    const client = makeClient();
    await client.account.llmKeys.get();
    const calls = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls[0][0]).toBe('https://api.stratus.run/v1/account/llm-keys');
    expect(calls[0][1].method).toBe('GET');
  });

  it('set sends POST to /v1/account/llm-keys with keys in body', async () => {
    mockFetch({ success: true, message: 'Keys saved' });
    const client = makeClient();
    await client.account.llmKeys.set({ openai_key: 'sk-test-openai' });
    const calls = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls[0][0]).toBe('https://api.stratus.run/v1/account/llm-keys');
    expect(calls[0][1].method).toBe('POST');
    const body = JSON.parse(calls[0][1].body);
    expect(body.openai_key).toBe('sk-test-openai');
  });

  it('delete with provider sends DELETE to /v1/account/llm-keys?provider=openai', async () => {
    mockFetch({ success: true, message: 'Key deleted' });
    const client = makeClient();
    await client.account.llmKeys.delete('openai');
    const calls = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls[0][0]).toBe('https://api.stratus.run/v1/account/llm-keys?provider=openai');
    expect(calls[0][1].method).toBe('DELETE');
  });

  it('delete without provider sends DELETE to /v1/account/llm-keys with no provider param', async () => {
    mockFetch({ success: true, message: 'All keys deleted' });
    const client = makeClient();
    await client.account.llmKeys.delete();
    const calls = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls[0][0]).toBe('https://api.stratus.run/v1/account/llm-keys');
    expect(calls[0][1].method).toBe('DELETE');
  });
});

describe('credits', () => {
  it('packages sends GET to /v1/credits/packages', async () => {
    mockFetch({ packages: [], network: 'mainnet', asset: 'USDC', testnet: false });
    const client = makeClient();
    await client.credits.packages();
    const calls = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls[0][0]).toBe('https://api.stratus.run/v1/credits/packages');
  });
});

describe('error handling', () => {
  it('throws StratusAPIError on non-2xx response with error body', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({
        error: { message: 'Invalid API key', type: 'authentication_error' },
      }),
    }));
    const client = makeClient();
    await expect(
      client.chat.completions.create({ model: 'stratus-1', messages: [{ role: 'user', content: 'Hi' }] })
    ).rejects.toThrow(StratusAPIError);
  });

  it('StratusAPIError has correct status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({
        error: { message: 'Invalid API key', type: 'authentication_error' },
      }),
    }));
    const client = makeClient();
    try {
      await client.chat.completions.create({ model: 'stratus-1', messages: [{ role: 'user', content: 'Hi' }] });
      expect.fail('Should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(StratusAPIError);
      expect((e as StratusAPIError).status).toBe(401);
    }
  });

  it('StratusAPIError has correct errorType', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({
        error: { message: 'Invalid API key', type: 'authentication_error' },
      }),
    }));
    const client = makeClient();
    try {
      await client.chat.completions.create({ model: 'stratus-1', messages: [{ role: 'user', content: 'Hi' }] });
      expect.fail('Should have thrown');
    } catch (e) {
      expect((e as StratusAPIError).errorType).toBe('authentication_error');
    }
  });

  it('StratusAPIError message matches server message', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({
        error: { message: 'Invalid API key', type: 'authentication_error' },
      }),
    }));
    const client = makeClient();
    try {
      await client.chat.completions.create({ model: 'stratus-1', messages: [{ role: 'user', content: 'Hi' }] });
      expect.fail('Should have thrown');
    } catch (e) {
      expect((e as StratusAPIError).message).toBe('Invalid API key');
    }
  });

  it('throws StratusAPIError with api_error type on non-JSON error body', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.reject(new SyntaxError('not json')),
    }));
    const client = makeClient({ retries: 1 });
    try {
      await client.chat.completions.create({ model: 'stratus-1', messages: [{ role: 'user', content: 'Hi' }] });
      expect.fail('Should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(StratusAPIError);
      expect((e as StratusAPIError).errorType).toBe('api_error');
    }
  });
});

describe('retry behavior', () => {
  it('retries on 500 errors up to retries count, succeeds on final attempt', async () => {
    const failResponse = {
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: { message: 'Internal error', type: 'internal_error' } }),
    };
    const successResponse = {
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockChatResponse()),
    };
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(failResponse)
      .mockResolvedValueOnce(successResponse)
    );
    const client = makeClient({ retries: 2 });
    const result = await client.chat.completions.create({
      model: 'stratus-1',
      messages: [{ role: 'user', content: 'Hi' }],
    });
    expect(result).toBeDefined();
    expect((globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls.length).toBe(2);
  }, 15000);

  it('does not retry on 401', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ error: { message: 'Unauthorized', type: 'authentication_error' } }),
    }));
    const client = makeClient({ retries: 3 });
    await expect(
      client.chat.completions.create({ model: 'stratus-1', messages: [{ role: 'user', content: 'Hi' }] })
    ).rejects.toThrow(StratusAPIError);
    expect((globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls.length).toBe(1);
  });

  it('does not retry on 400', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error: { message: 'Bad request', type: 'validation_error' } }),
    }));
    const client = makeClient({ retries: 3 });
    await expect(
      client.chat.completions.create({ model: 'stratus-1', messages: [{ role: 'user', content: 'Hi' }] })
    ).rejects.toThrow(StratusAPIError);
    expect((globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls.length).toBe(1);
  });
});

describe('getCompressionRatio', () => {
  it('returns a string ending in "x"', () => {
    const client = makeClient();
    const ratio = client.getCompressionRatio();
    expect(typeof ratio).toBe('string');
    expect(ratio.endsWith('x')).toBe(true);
  });

  it('returns expected ratio for Low profile', () => {
    const client = makeClient({ compressionProfile: 'Low' });
    expect(client.getCompressionRatio()).toBe('15.2x');
  });

  it('returns expected ratio for Medium profile', () => {
    const client = makeClient({ compressionProfile: 'Medium' });
    expect(client.getCompressionRatio()).toBe('16.8x');
  });

  it('returns expected ratio for High profile', () => {
    const client = makeClient({ compressionProfile: 'High' });
    expect(client.getCompressionRatio()).toBe('18.5x');
  });

  it('returns expected ratio for VeryHigh profile', () => {
    const client = makeClient({ compressionProfile: 'VeryHigh' });
    expect(client.getCompressionRatio()).toBe('20x');
  });
});

describe('getQualityScore', () => {
  it('returns a number', () => {
    const client = makeClient();
    expect(typeof client.getQualityScore()).toBe('number');
  });

  it('returns 99.9 for Low profile', () => {
    const client = makeClient({ compressionProfile: 'Low' });
    expect(client.getQualityScore()).toBe(99.9);
  });

  it('returns 99.7 for Medium profile', () => {
    const client = makeClient({ compressionProfile: 'Medium' });
    expect(client.getQualityScore()).toBe(99.7);
  });

  it('returns 99.5 for High profile', () => {
    const client = makeClient({ compressionProfile: 'High' });
    expect(client.getQualityScore()).toBe(99.5);
  });

  it('returns 99.0 for VeryHigh profile', () => {
    const client = makeClient({ compressionProfile: 'VeryHigh' });
    expect(client.getQualityScore()).toBe(99.0);
  });
});

describe('StratusAPIError', () => {
  it('is an instance of Error', () => {
    const err = new StratusAPIError('test error', 500, 'internal_error');
    expect(err).toBeInstanceOf(Error);
  });

  it('has correct name', () => {
    const err = new StratusAPIError('test error', 500, 'internal_error');
    expect(err.name).toBe('StratusAPIError');
  });

  it('has correct status', () => {
    const err = new StratusAPIError('test error', 429, 'rate_limit');
    expect(err.status).toBe(429);
  });

  it('has correct errorType', () => {
    const err = new StratusAPIError('test error', 429, 'rate_limit');
    expect(err.errorType).toBe('rate_limit');
  });

  it('has correct message', () => {
    const err = new StratusAPIError('Something went wrong', 500, 'internal_error');
    expect(err.message).toBe('Something went wrong');
  });

  it('stores optional param and code', () => {
    const err = new StratusAPIError('bad param', 400, 'validation_error', 'model', 'invalid_model');
    expect(err.param).toBe('model');
    expect(err.code).toBe('invalid_model');
  });
});
