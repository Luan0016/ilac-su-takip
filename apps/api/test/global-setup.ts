import { execSync } from 'node:child_process';
import pg from 'pg';

// Bring the test database to the latest schema, then empty it.
export default async function setup() {
  const url = process.env.TEST_DATABASE_URL ?? 'postgresql://ilac:ilac@localhost:5432/ilac_test';
  if (!url.includes('test')) throw new Error(`Refusing to wipe a non-test database: ${url}`);
  execSync('pnpm exec prisma migrate deploy', { stdio: 'inherit', env: { ...process.env, DATABASE_URL: url } });
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  await client.query('TRUNCATE users, refresh_tokens, medications, schedules, dose_logs, water_logs, water_settings CASCADE');
  await client.end();
}
