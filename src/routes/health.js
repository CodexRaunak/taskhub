import { Router } from 'express';
import { pool } from '../db/pool.js';
import { redis } from '../db/redis.js';
import { logger } from '../utils/logger.js';

const router = Router();
const startTime = Date.now();

router.get('/', async (req, res) => {
  if (globalThis.__healthFail) {
    return res.status(503).json({ status: 'error', message: 'Health endpoint manually failed for demo' });
  }
  const checks = {
    status: 'ok',
    uptime: Math.floor((Date.now() - startTime) / 1000),
    timestamp: new Date().toISOString(),
    database: { status: 'unknown' },
    redis: { status: 'unknown' },
  };

  try {
    await pool.query('SELECT 1');
    checks.database.status = 'ok';
  } catch (err) {
    checks.database.status = 'error';
    checks.database.message = err.message;
    checks.status = 'degraded';
  }

  if (redis) {
    try {
      await redis.ping();
      checks.redis.status = 'ok';
    } catch (err) {
      checks.redis.status = 'error';
      checks.redis.message = err.message;
      if (checks.status === 'ok') checks.status = 'degraded';
    }
  } else {
    checks.redis.status = 'disabled';
  }

  const httpStatus = checks.status === 'ok' ? 200 : 503;
  res.status(httpStatus).json(checks);
});

export default router;
