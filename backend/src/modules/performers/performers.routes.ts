import { Router } from 'express';
import { z } from 'zod';
import { getPerformerProfileById } from './performers.service.js';

export const performersRouter = Router();

const idParamSchema = z.object({ id: z.string().uuid() });

performersRouter.get('/:id', async (request, response, next) => {
  try {
    const params = idParamSchema.parse(request.params);

    response.json(await getPerformerProfileById(params.id));
  } catch (error) {
    next(error);
  }
});
