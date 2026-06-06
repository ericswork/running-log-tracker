import { beforeEach } from 'vitest'

// Point the Prisma client at an isolated test database BEFORE src/prisma.ts is
// imported anywhere. dotenv (loaded inside prisma.ts) won't override an
// already-set value, so this wins. Keep this above any prisma import.
process.env.DATABASE_URL = 'file:./test.db'

// Reset data between tests so each test is independent. Imported dynamically so
// the env override above is guaranteed to run first (static imports hoist).
beforeEach(async () => {
  const { prisma } = await import('./src/prisma')
  await prisma.run.deleteMany()
})
