import { config as dotenvConfig } from 'dotenv';
dotenvConfig();

function required(key) {
  const value = process.env[key];
  if (!value && process.env.NODE_ENV === 'production') {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const config = Object.freeze({
  port: parseInt(process.env.PORT, 10) || 3000,
  appName: process.env.APP_NAME || 'TaskHub',
  logLevel: process.env.LOG_LEVEL || 'info',
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: (process.env.NODE_ENV || 'development') === 'development',

  databaseUrl: process.env.DATABASE_URL || 'postgres://taskhub:taskhub123@localhost:5432/taskhub',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

  jwtSecret: required('JWT_SECRET') || 'dev-secret-do-not-use-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  uploadDir: process.env.UPLOAD_DIR || './uploads',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 5 * 1024 * 1024,
});
