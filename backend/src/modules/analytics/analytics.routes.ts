import { Router } from 'express';
import type { Request } from 'express';
import { HttpError } from '../../http/errors/http-error.js';
import { requireAuth } from '../../http/middlewares/auth.js';
import { getMyAnalytics } from './analytics.service.js';

export const analyticsRouter = Router();

const getUser = (request: Request) => {
  if (!request.user) {
    throw new HttpError(401, 'Требуется авторизация');
  }

  return request.user;
};

analyticsRouter.use(requireAuth);

analyticsRouter.get('/me', async (request, response, next) => {
  try {
    response.json(await getMyAnalytics(getUser(request)));
  } catch (error) {
    next(error);
  }
});
