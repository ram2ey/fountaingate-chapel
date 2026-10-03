const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { Client } = require('pg');
const { databaseConfig } = require('../lib/server/database-config.cjs');

async function migrate() {
  const directory = path.resolve(__dirname, '../db/migrations');
  const files = fs.readdirSync(directory);
  if (files.some(name => name.endsWith('.sql') && !/^\d{4}_[a-z0-9_-]+\.sql$/.test(name))) throw new Error('Invalid migration filename.');
  const names = files.filter(name => /^\d{4}_[a-z0-9_-]+\.sql$/.test(name)).sort();
  if (new Set(names.map(name => name.slice(0, 4))).size !== names.length) throw new Error('Duplicate migration sequence.');
  if (!names.length) {
    console.log('No application migrations exist yet. Domain schema is scheduled for Phase 2.');
    return;
  }
  const client = new Client(databaseConfig(process.env, 'migration'));
  await client.connect();
  try {
    await client.query('SELECT pg_advisory_lock(74120301)');
    await client.query('CREATE TABLE IF NOT EXISTS public.schema_migrations (name text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())');
    for (const name of names) {
      const sql = fs.readFileSync(path.join(directory, name), 'utf8');
      const checksum = crypto.createHash('sha256').update(sql).digest('hex');
      const existing = await client.query('SELECT checksum FROM public.schema_migrations WHERE name = $1', [name]);
      if (existing.rows.length) {
        if (existing.rows[0].checksum !== checksum) throw new Error('Applied migration checksum changed.');
        continue;
      }
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO public.schema_migrations (name, checksum) VALUES ($1, $2)', [name, checksum]);
        await client.query('COMMIT');
        console.log(`Applied ${name}`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }
  } finally {
    // Closing the dedicated connection also releases its advisory lock.
    await client.end();
  }
}

migrate().catch(() => {
  console.error('Migration failed. Check connectivity, privileges and migration SQL; credentials are not logged.');
  process.exitCode = 1;
});
