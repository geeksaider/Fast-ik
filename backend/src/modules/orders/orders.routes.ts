import { Router } from 'express';
import type { Request } from 'express';
import { requireAuth } from '../../http/middlewares/auth.js';
import { HttpError } from '../../http/errors/http-error.js';
import {
  acceptOrder,
  cancelOrder,
  disputeOrder,
  getOrder,
  getOrders,
  submitOrder,
} from './orders.service.js';
import {
  cancelOrderSchema,
  disputeOrderSchema,
  orderIdParamSchema,
  submitOrderSchema,
} from './orders.schemas.js';

export const ordersRouter = Router();

const getUser = (request: Request) => {
  if (!request.user) {
    throw new HttpError(401, 'Требуется авторизация');
  }

  return request.user;
};

ordersRouter.use(requireAuth);

ordersRouter.get('/', async (request, response, next) => {
  try {
    response.json(await getOrders(getUser(request)));
  } catch (error) {
    next(error);
  }
});

ordersRouter.get('/:id', async (request, response, next) => {
  try {
    const params = orderIdParamSchema.parse(request.params);

    response.json(await getOrder(getUser(request), params.id));
  } catch (error) {
    next(error);
  }
});

ordersRouter.post('/:id/submit', async (request, response, next) => {
  try {
    const params = orderIdParamSchema.parse(request.params);
    const input = submitOrderSchema.parse(request.body);

    response.json(await submitOrder(getUser(request), params.id, input));
  } catch (error) {
    next(error);
  }
});

ordersRouter.post('/:id/accept', async (request, response, next) => {
  try {
    const params = orderIdParamSchema.parse(request.params);

    response.json(await acceptOrder(getUser(request), params.id));
  } catch (error) {
    next(error);
  }
});

ordersRouter.post('/:id/dispute', async (request, response, next) => {
  try {
    const params = orderIdParamSchema.parse(request.params);
    const input = disputeOrderSchema.parse(request.body);

    response.json(await disputeOrder(getUser(request), params.id, input));
  } catch (error) {
    next(error);
  }
});

ordersRouter.post('/:id/cancel', async (request, response, next) => {
  try {
    const params = orderIdParamSchema.parse(request.params);
    const input = cancelOrderSchema.parse(request.body);

    response.json(await cancelOrder(getUser(request), params.id, input));
  } catch (error) {
    next(error);
  }
});
