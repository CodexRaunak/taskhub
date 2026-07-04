import { Redis } from 'ioredis';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

let redis = null;

try {
  redis = new Redis(config.redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      if (times > 3) return null;
      return Math.min(times * 200, 2000);
    },
    lazyConnect: true,
  });

  redis.on('error', (err) => {
    logger.warn(err, 'Redis connection error');
  });

  redis.on('connect', () => {
    logger.info('Connected to Redis');
  });
} catch (err) {
  logger.warn(err, 'Redis not available — caching disabled');
}

export { redis };
