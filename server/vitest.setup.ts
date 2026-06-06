// Vitest setup — runs before each test file.
//
// Group 3 (test database isolation) will add here:
//   - process.env.DATABASE_URL = "file:./test.db"  (before src/prisma.ts is imported)
//   - a beforeEach() that deletes all Run rows so tests are independent
//
// Intentionally empty for now (group 1 scaffolds the test tooling only).
export {}
