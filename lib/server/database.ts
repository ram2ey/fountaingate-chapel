import 'server-only';
import { Pool, type PoolClient, type QueryResultRow } from 'pg';
import { databaseConfig } from './database-config.cjs';
import { logEvent } from './operational-log.cjs';

const databaseGlobal = globalThis as typeof globalThis & { fgcPool?: Pool };

function getPool(): Pool {
  if (!databaseGlobal.fgcPool) {
    const pool = new Pool(databaseConfig());
    // Avoid unhandled idle-connection errors; never log SQL, credentials or values.
    pool.on('error', () => logEvent('database_connection_failed',{role:'runtime'}));
    databaseGlobal.fgcPool = pool;
  }
  return databaseGlobal.fgcPool;
}

export async function query<Row extends QueryResultRow>(text: string, values: unknown[] = []) {
  return getPool().query<Row>(text, values);
}

// Later authorization context must be set transaction-locally on this same client.
export async function withTransaction<T>(operation: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  let failedRollback = false;
  try {
    await client.query('BEGIN');
    const result = await operation(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch { failedRollback = true; }
    throw error;
  } finally {
    client.release(failedRollback);
  }
}
