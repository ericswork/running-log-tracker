import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    // Per-worker: sets the test-DB env override and resets rows between tests.
    setupFiles: ['./vitest.setup.ts'],
    // Once per run: applies the schema to the isolated test DB (prisma db push).
    globalSetup: ['./vitest.globalSetup.ts'],
    // All DB-backed test files share one SQLite test.db, and each file resets
    // rows in beforeEach — so files must run sequentially, not in parallel
    // workers, or they clobber each other's data.
    fileParallelism: false,
  },
})
