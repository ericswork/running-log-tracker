import { execSync } from 'node:child_process'

// Runs once before the whole suite: create/sync the schema on the isolated test
// database. `db push` (no migration history) is enough for a throwaway DB.
export default function setup() {
  // --url overrides the datasource directly (Prisma 7 db push has no --skip-generate).
  execSync('npx prisma db push --url "file:./test.db" --accept-data-loss', {
    stdio: 'inherit',
  })
}
