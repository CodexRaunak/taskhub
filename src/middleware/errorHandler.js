import { logger } from '../utils/logger.js';
import { AppError } from '../utils/errors.js';
import { config } from '../config/index.js';

export function errorHandler(err, req, res, _next) {
  if (err instanceof AppError) {
    res.status(err.status).json({
      error: { message: err.message, code: err.code },
    });
    return;
  }

  if (err.isJoi) {
    res.status(400).json({
      error: {
        message: 'Validation error',
        details: err.details.map((d) => d.message),
      },
    });
    return;
  }

  if (err.name === 'MulterError') {
    res.status(400).json({
      error: { message: err.message },
    });
    return;
  }

  logger.error(err, 'Unhandled error');

  res.status(500).json({
    error: {
      message: config.isDev ? err.message : 'Internal server error',
    },
  });
}
