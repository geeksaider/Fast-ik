import { Router } from 'express';
import type { Request } from 'express';
import { HttpError } from '../../http/errors/http-error.js';
import { requireAuth } from '../../http/middlewares/auth.js';
import { getMyLevelRoadmap } from './levels.service.js';

export const levelsRouter = Router();

const getUser = (request: Request) => {
  if (!request.user) {
    throw new HttpError(401, 'Требуется авторизация');
  }

  return request.user;
};

levelsRouter.use(requireAuth);

levelsRouter.get('/me', async (request, response, next) => {
  try {
    response.json(await getMyLevelRoadmap(getUser(request)));
  } catch (error) {
    next(error);
  }
});
