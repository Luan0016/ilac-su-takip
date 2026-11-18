import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    globalSetup: ['./test/global-setup.ts'],
    fileParallelism: false,
    env: {
      DATABASE_URL:
        process.env.TEST_DATABASE_URL ??
        'postgresql://ilac:ilac@localhost:5432/ilac_test',
      JWT_SECRET: 'test-secret',
      AUTH_THROTTLE_LIMIT: '1000',
    },
  },
});
