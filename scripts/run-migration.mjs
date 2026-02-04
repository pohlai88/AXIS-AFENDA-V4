import { readFileSync } from 'fs';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL_MIGRATIONS || process.env.DATABASE_URL);

const migration = readFileSync('./drizzle/0013_confused_dakota_north.sql', 'utf-8');

try {
  console.log('Running migration...');
  await sql.unsafe(migration);
  console.log('✅ Migration complete!');
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  process.exit(1);
} finally {
  await sql.end();
}
