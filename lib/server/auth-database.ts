import 'server-only';
import { Pool, type PoolClient } from 'pg';
import { databaseConfig } from './database-config.cjs';
import { logEvent } from './operational-log.cjs';

const authGlobal = globalThis as typeof globalThis & { fgcAuthPool?: Pool };
export async function authTransaction<T>(operation: (client: PoolClient) => Promise<T>): Promise<T> {
  if (!authGlobal.fgcAuthPool) {
    authGlobal.fgcAuthPool = new Pool(databaseConfig(process.env, 'authentication'));
    authGlobal.fgcAuthPool.on('error', () => logEvent('database_connection_failed',{role:'identity'}));
  }
  const client = await authGlobal.fgcAuthPool.connect();
  let discard = false;
  try { await client.query('BEGIN'); const result = await operation(client); await client.query('COMMIT'); return result; }
  catch (error) { try { await client.query('ROLLBACK'); } catch { discard = true; } throw error; }
  finally { client.release(discard); }
}
