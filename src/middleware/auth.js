import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { AppError } from '../utils/errors.js';

export function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(new AppError(401, 'Missing or invalid authorization header'));
  }

  const token = header.split(' ')[1];

  try {
    const payload = jwt.verify(token, config.jwtSecret);
    req.user = { id: payload.id, email: payload.email };
    next();
  } catch (err) {
    return next(new AppError(401, 'Invalid or expired token'));
  }
}
