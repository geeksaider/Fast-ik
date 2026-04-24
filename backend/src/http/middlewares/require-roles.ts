import type { RequestHandler } from 'express';
import type { UserRole } from '@fastik/shared';
import { HttpError } from '../errors/http-error.js';

export const requireRoles = (roles: UserRole[]): RequestHandler => {
  return (request, _response, next) => {
    if (!request.user) {
      next(new HttpError(401, 'Требуется авторизация'));
      return;
    }

    if (!roles.includes(request.user.role)) {
      next(new HttpError(403, 'Недостаточно прав'));
      return;
    }

    next();
  };
};
