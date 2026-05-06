import { Router } from 'express';
import { z } from 'zod';
import { getPerformerProfileById, getPerformersCatalog } from './performers.service.js';

export const performersRouter = Router();

const idParamSchema = z.object({ id: z.string().uuid() });
const listQuerySchema = z.object({ search: z.string().trim().optional() });

performersRouter.get('/', async (request, response, next) => {
  try {
    const query = listQuerySchema.parse(request.query);

    response.json(await getPerformersCatalog(query));
  } catch (error) {
    next(error);
  }
});

performersRouter.get('/:id', async (request, response, next) => {
  try {
    const params = idParamSchema.parse(request.params);

    response.json(await getPerformerProfileById(params.id));
  } catch (error) {
    next(error);
  }
});
