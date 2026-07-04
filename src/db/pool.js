import pg from 'pg';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

export const pool = new pg.Pool({
  connectionString: config.databaseUrl,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  logger.error(err, 'Unexpected PostgreSQL pool error');
});

export async function query(text, params) {
  const start = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;
  logger.debug({ duration, rows: result.rowCount }, 'query');
  return result;
}
