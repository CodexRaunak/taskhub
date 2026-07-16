import { Router } from 'express';
import { logger } from '../utils/logger.js';

const router = Router();

router.post('/health/fail', (req, res) => {
  globalThis.__healthFail = true;
  logger.warn('Health endpoint forced to fail');
  res.json({ message: 'Health endpoint will now return 503. Liveness probe will fail → pod restart.' });
});

router.post('/health/pass', (req, res) => {
  globalThis.__healthFail = false;
  logger.info('Health endpoint restored');
  res.json({ message: 'Health endpoint restored to normal.' });
});

router.post('/oom', (req, res) => {
  const size = parseInt(req.query.bytes, 10) || 150 * 1024 * 1024;
  logger.warn({ size }, 'OOM test triggered — allocating buffer');
  const buf = Buffer.alloc(size, 'A');
  globalThis.__oomBuffer = buf;
  res.json({ message: `Allocated ${size} bytes in memory. Pod should be OOMKilled soon.` });
});

export default router;
