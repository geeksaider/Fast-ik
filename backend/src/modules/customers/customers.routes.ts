import { Router } from 'express';
import { z } from 'zod';
import { getCustomerProfileById, getPublicCustomers } from './customers.service.js';

export const customersRouter = Router();

const idParamSchema = z.object({ id: z.string().uuid() });
const listQuerySchema = z.object({ search: z.string().trim().min(1).max(120).optional() });

customersRouter.get('/', async (request, response, next) => {
  try {
    const query = listQuerySchema.parse(request.query);

    response.json(await getPublicCustomers(query));
  } catch (error) {
    next(error);
  }
});

customersRouter.get('/:id', async (request, response, next) => {
  try {
    const params = idParamSchema.parse(request.params);

    response.json(await getCustomerProfileById(params.id));
  } catch (error) {
    next(error);
  }
});
