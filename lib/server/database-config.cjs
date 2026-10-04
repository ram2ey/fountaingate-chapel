// Shared by trusted server code and maintenance commands, never browser imports.
function positiveInteger(value, fallback, name, maximum) {
  if (value === undefined) return fallback;
  if (!/^\d+$/.test(value)) throw new Error(`${name} must be a positive integer.`);
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 1 || number > maximum) {
    throw new Error(`${name} is outside its supported range.`);
  }
  return number;
}

function databaseConfig(environment = process.env, purpose = 'application') {
  const key = purpose === 'migration' ? 'MIGRATION_DATABASE_URL' : purpose === 'authentication' ? 'AUTH_DATABASE_URL' : purpose === 'messaging' ? 'MESSAGING_DATABASE_URL' : 'DATABASE_URL';
  const connectionString = environment[key];
  if (!connectionString) throw new Error(`${key} is required for database operations.`);
  let url;
  try { url = new URL(connectionString); } catch { throw new Error(`${key} must be a PostgreSQL connection URL.`); }
  if (!['postgres:', 'postgresql:'].includes(url.protocol) || !url.hostname ||
      !url.username || !url.password || url.pathname.length < 2 || url.hash) {
    throw new Error(`${key} must specify a PostgreSQL host, database and credentials.`);
  }
  // pg's connection-string SSL options can override an explicit secure ssl object.
  if ([...url.searchParams.keys()].some(name => name.toLowerCase().startsWith('ssl'))) {
    throw new Error('Configure TLS with DATABASE_SSL_MODE and DATABASE_CA_BASE64, not URL SSL parameters.');
  }
  const mode = environment.DATABASE_SSL_MODE || 'require';
  if (!['require', 'disable'].includes(mode)) throw new Error('DATABASE_SSL_MODE must be require or disable.');
  let ssl = false;
  if (mode === 'require') {
    ssl = { rejectUnauthorized: true };
    if (environment.DATABASE_CA_BASE64) {
      const ca = Buffer.from(environment.DATABASE_CA_BASE64, 'base64').toString('utf8');
      if (!ca.includes('-----BEGIN CERTIFICATE-----')) throw new Error('DATABASE_CA_BASE64 must contain a PEM certificate.');
      ssl.ca = ca;
    }
  } else if (environment.DATABASE_CA_BASE64) {
    throw new Error('DATABASE_CA_BASE64 requires DATABASE_SSL_MODE=require.');
  }
  return {
    connectionString,
    ssl,
    max: positiveInteger(environment.DATABASE_POOL_MAX, 5, 'DATABASE_POOL_MAX', 50),
    connectionTimeoutMillis: positiveInteger(environment.DATABASE_CONNECT_TIMEOUT_MS, 5000, 'DATABASE_CONNECT_TIMEOUT_MS', 60000),
    idleTimeoutMillis: 30000,
    statement_timeout: 15000,
    application_name: purpose === 'migration' ? 'fgc-migrations' : purpose === 'messaging' ? 'fgc-messaging-worker' : 'fgc-web',
  };
}

module.exports = { databaseConfig };

