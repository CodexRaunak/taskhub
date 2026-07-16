import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.js';
import taskRoutes from './routes/tasks.js';
import uploadRoutes from './routes/uploads.js';
import healthRoutes from './routes/health.js';
import debugRoutes from './routes/debug.js';
import { config } from './config/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();

  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
      directives: {
        'default-src': ["'self'"],
        'base-uri': ["'self'"],
        'font-src': ["'self'", 'https:', 'data:'],
        'form-action': ["'self'"],
        'frame-ancestors': ["'self'"],
        'img-src': ["'self'", 'data:'],
        'object-src': ["'none'"],
        'script-src': ["'self'"],
        'script-src-attr': ["'none'"],
        'style-src': ["'self'", 'https:', "'unsafe-inline'"],
        'upgrade-insecure-requests': null,
      },
    },
  }));
  app.use(cors());
  app.use(express.json());

  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 200,
      standardHeaders: true,
      legacyHeaders: false,
      skip: (req) => req.path === '/health',
    })
  );

  app.use(express.static(path.join(__dirname, '..', 'public')));

  app.use('/health', healthRoutes);
  app.use('/auth', authRoutes);
  app.use('/tasks', taskRoutes);
  app.use('/uploads', uploadRoutes);
  app.use('/debug', debugRoutes);

  app.use(errorHandler);

  return app;
}
