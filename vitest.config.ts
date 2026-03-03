/**
 * Vitest configuration
 *
 * @purpose Test runner configuration for the Stratus SDK
 */
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/__tests__/**/*.test.ts'],
  },
  resolve: {
    alias: {
      // Strip .js extensions so TypeScript source imports resolve correctly
    },
  },
});
