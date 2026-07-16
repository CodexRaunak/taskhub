import { createApp } from './app.js';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import { pool } from './db/pool.js';
import { redis } from './db/redis.js';
import { migrate } from './db/migrate.js';

async function main() {
  logger.info({ app: config.appName, env: config.nodeEnv }, 'Starting');

  const startupDelay = parseInt(process.env.STARTUP_DELAY, 10) || 0;
  if (startupDelay > 0) {
    logger.info({ delay: startupDelay }, 'Delaying startup for readiness probe demo');
    await new Promise(resolve => setTimeout(resolve, startupDelay * 1000));
  }

  await migrate();

  if (redis) {
    try {
      await redis.connect();
    } catch {
      logger.warn('Redis connection failed — continuing without cache');
    }
  }

  const app = createApp();

  const server = app.listen(config.port, () => {
    logger.info({ port: config.port }, 'Server listening');
  });

  function shutdown(signal) {
    logger.info({ signal }, 'Shutting down gracefully');
    server.close(() => {
      pool.end();
      if (redis) redis.disconnect();
      process.exit(0);
    });
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000).unref();
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  logger.fatal(err, 'Failed to start');
  process.exit(1);
});
