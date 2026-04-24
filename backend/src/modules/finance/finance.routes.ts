import { Router } from 'express';
import type { Request } from 'express';
import { requireAuth } from '../../http/middlewares/auth.js';
import { HttpError } from '../../http/errors/http-error.js';
import { getFinanceSummary, topUpBalance } from './finance.service.js';
import { topUpSchema } from './finance.schemas.js';

export const financeRouter = Router();

const getUser = (request: Request) => {
  if (!request.user) {
    throw new HttpError(401, 'Требуется авторизация');
  }

  return request.user;
};

financeRouter.use(requireAuth);

financeRouter.get('/me', async (request, response, next) => {
  try {
    response.json(await getFinanceSummary(getUser(request)));
  } catch (error) {
    next(error);
  }
});

financeRouter.post('/top-up', async (request, response, next) => {
  try {
    const input = topUpSchema.parse(request.body);

    response.json(await topUpBalance(getUser(request), input));
  } catch (error) {
    next(error);
  }
});
