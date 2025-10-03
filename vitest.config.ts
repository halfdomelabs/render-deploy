import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    watch: false,
    mockReset: true,
    globals: true,
    environment: 'node',
  },
});
