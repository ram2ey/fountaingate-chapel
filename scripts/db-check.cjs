const { Client } = require('pg');
const { databaseConfig } = require('../lib/server/database-config.cjs');

async function check() {
  const client = new Client(databaseConfig());
  await client.connect();
  try {
    await client.query('SELECT 1');
    const { rows } = await client.query('SELECT rolsuper, rolbypassrls FROM pg_roles WHERE rolname = current_user');
    if (!rows.length || rows[0].rolsuper || rows[0].rolbypassrls) {
      throw new Error('Unsafe application role');
    }
    const owners = await client.query("SELECT 1 FROM pg_tables WHERE schemaname NOT IN ('pg_catalog', 'information_schema') AND tableowner = current_user LIMIT 1");
    if (owners.rows.length) throw new Error('Application role owns tables');
    console.log('Database reachable; application role is not a superuser, table owner or BYPASSRLS role.');
  } finally { await client.end(); }
}

check().catch(() => {
  console.error('Database check failed. Check runtime configuration, connectivity and application role privileges.');
  process.exitCode = 1;
});
