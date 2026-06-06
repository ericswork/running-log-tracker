import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    // Runs before each test file — group 3 adds the test-DB env override + reset here.
    setupFiles: ['./vitest.setup.ts'],
    // Group 3 adds a globalSetup that applies the schema to the test DB (prisma db push).
  },
})
