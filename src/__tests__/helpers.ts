/**
 * Test Helpers
 *
 * @purpose Shared utility functions for the Stratus SDK test suite
 */

import { vi } from 'vitest';
import type { ChatCompletionResponse } from '../integrations/mjepa/types.js';

export function randomVector(dims: number): number[] {
  const vec = new Array(dims);
  for (let i = 0; i < dims; i++) {
    vec[i] = (Math.random() * 2 - 1) * 0.5;
  }
  return vec;
}

export function randomNormalizedVector(dims: number): number[] {
  const vec = randomVector(dims);
  let norm = 0;
  for (const v of vec) norm += v * v;
  norm = Math.sqrt(norm);
  return vec.map(v => v / norm);
}

export function mockChatResponse(overrides?: Partial<ChatCompletionResponse>): ChatCompletionResponse {
  return {
    id: 'chatcmpl-test-123',
    object: 'chat.completion',
    created: 1700000000,
    model: 'stratus-1',
    choices: [
      {
        index: 0,
        message: { role: 'assistant', content: 'Hello, world!' },
        finish_reason: 'stop',
      },
    ],
    usage: {
      prompt_tokens: 10,
      completion_tokens: 5,
      total_tokens: 15,
    },
    ...overrides,
  };
}

export function mockFetch(body: unknown, status = 200): void {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(body),
      body: null,
    } as Response),
  );
}

export function mockFetchSequence(responses: Array<{ body: unknown; status?: number }>): void {
  const mocks = responses.map(({ body, status = 200 }) =>
    Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(body),
      body: null,
    } as Response),
  );

  let callIndex = 0;
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation(() => {
      const response = mocks[callIndex] ?? mocks[mocks.length - 1];
      callIndex++;
      return response;
    }),
  );
}
