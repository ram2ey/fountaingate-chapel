const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const { databaseConfig } = require('../lib/server/database-config.cjs');
const root = path.resolve(__dirname, '..');
const base = { DATABASE_URL: 'postgresql://app:password@db:5432/church' };

test('database configuration rejects invalid or missing credentials without disclosing them', () => {
  for (const value of [undefined, 'not-a-url', 'https://user:secret@db/church', 'postgresql://db/church']) {
    assert.throws(() => databaseConfig({ DATABASE_URL: value }), error => !error.message.includes('secret'));
  }
  assert.throws(() => databaseConfig({ ...base, DATABASE_POOL_MAX: '0' }));
  assert.throws(() => databaseConfig({ ...base, DATABASE_POOL_MAX: '999' }));
  assert.throws(() => databaseConfig({ ...base, DATABASE_SSL_MODE: 'insecure' }));
});

test('TLS verifies certificates and connection strings cannot override it', () => {
  assert.equal(databaseConfig(base).ssl.rejectUnauthorized, true);
  assert.equal(databaseConfig({ ...base, DATABASE_SSL_MODE: 'disable' }).ssl, false);
  assert.throws(() => databaseConfig({ DATABASE_URL: base.DATABASE_URL + '?sslmode=no-verify' }));
  assert.throws(() => databaseConfig({ ...base, DATABASE_CA_BASE64: 'invalid' }));
});

test('migration credentials are separate and have no application fallback', () => {
  assert.throws(() => databaseConfig(base, 'migration'), /MIGRATION_DATABASE_URL/);
  assert.equal(databaseConfig({ MIGRATION_DATABASE_URL: base.DATABASE_URL }, 'migration').application_name, 'fgc-migrations');
});

test('unfinished feature components contain no fake success, upload or playback implementations', () => {
  for (const file of ['app/documents/page-content.tsx',
    'components/comms/BroadcastComposer.tsx', 'components/media/Mp3UploaderModal.tsx',
    'components/media/AudioLibraryPlayer.tsx']) {
    const source = fs.readFileSync(path.join(root, file), 'utf8');
    assert.match(source, /unavailable/i, file);
    assert.doesNotMatch(source, /setTimeout|Math\.random|new Blob|alert\(|setIsPlaying|File saved|Confirmed!/, file);
  }
  assert.doesNotMatch(fs.readFileSync(path.join(root, 'components/care/ConfidentialCareLog.tsx'), 'utf8'), /Encrypted/);
});

test('database is server-only and deployment cannot copy local secrets', () => {
  assert.match(fs.readFileSync(path.join(root, 'lib/server/database.ts'), 'utf8'), /import 'server-only'/);
  const ignore = fs.readFileSync(path.join(root, '.dockerignore'), 'utf8');
  for (const value of ['.env', '.env.*', 'node_modules', '.next']) assert.ok(ignore.split(/\r?\n/).includes(value));
  const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  for (const name of ['@supabase/supabase-js', 'jspdf', 'recharts', 'autoprefixer']) {
    assert.equal(name in packageJson.dependencies || name in packageJson.devDependencies, false);
  }
  assert.equal(fs.existsSync(path.join(root, 'vercel.json')), false);
});

test('transactions commit, roll back and discard a connection after failed rollback', async () => {
  const vm = require('node:vm');
  const ts = require('typescript');
  const source = ts.transpileModule(fs.readFileSync(path.join(root, 'lib/server/database.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  for (const scenario of ['success', 'failure', 'rollback-failure']) {
    const calls = [];
    const client = { query: async sql => { calls.push(sql); if (sql === 'ROLLBACK' && scenario === 'rollback-failure') throw Error('rollback'); }, release: discard => calls.push(discard) };
    const exports = {};
    vm.runInNewContext(source, { exports, console, require: name => {
      if (name === 'server-only') return {};
      if (name === 'pg') return { Pool: class { on() {} async connect() { return client; } } };
      if (name === './database-config.cjs') return { databaseConfig: () => ({}) };
      throw Error(name);
    } });
    const operation = async connection => { assert.equal(connection, client); if (scenario !== 'success') throw Error('operation'); return 42; };
    if (scenario === 'success') assert.equal(await exports.withTransaction(operation), 42);
    else await assert.rejects(exports.withTransaction(operation), /operation/);
    assert.deepEqual(calls, ['BEGIN', scenario === 'success' ? 'COMMIT' : 'ROLLBACK', scenario === 'rollback-failure']);
  }
});
