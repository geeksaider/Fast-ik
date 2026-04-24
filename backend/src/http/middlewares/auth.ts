import type { RequestHandler } from 'express';
import { HttpError } from '../errors/http-error.js';
import { getCurrentUser, verifyAccessToken } from '../../modules/auth/auth.service.js';

export const requireAuth: RequestHandler = async (request, _response, next) => {
  try {
    const header = request.headers.authorization;

    if (!header?.startsWith('Bearer ')) {
      throw new HttpError(401, 'Требуется авторизация');
    }

    const token = header.slice('Bearer '.length);
    const payload = verifyAccessToken(token);
    const user = await getCurrentUser(payload.sub);

    request.user = user;

    next();
  } catch (error) {
    next(error);
  }
};

export const optionalAuth: RequestHandler = async (request, _response, next) => {
  try {
    const header = request.headers.authorization;

    if (!header?.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = header.slice('Bearer '.length);
    const payload = verifyAccessToken(token);
    request.user = await getCurrentUser(payload.sub);

    next();
  } catch {
    next();
  }
};
