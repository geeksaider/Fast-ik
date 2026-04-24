import { Router } from 'express';
import type { Request } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../http/middlewares/auth.js';
import { HttpError } from '../../http/errors/http-error.js';
import {
  addPortfolioItem,
  editPortfolioItem,
  getProfileSummary,
  getSkillOptions,
  removePortfolioItem,
  updateProfile,
  updateUserSkills,
} from './profile.service.js';
import {
  portfolioCreateSchema,
  portfolioUpdateSchema,
  profileUpdateSchema,
  replaceSkillsSchema,
} from './profile.schemas.js';

export const profileRouter = Router();

const idParamSchema = z.object({ id: z.string().uuid() });

const getUser = (request: Request) => {
  if (!request.user) {
    throw new HttpError(401, 'Требуется авторизация');
  }

  return request.user;
};

profileRouter.use(requireAuth);

profileRouter.get('/me', async (request, response, next) => {
  try {
    response.json(await getProfileSummary(getUser(request)));
  } catch (error) {
    next(error);
  }
});

profileRouter.put('/me', async (request, response, next) => {
  try {
    const input = profileUpdateSchema.parse(request.body);

    response.json(await updateProfile(getUser(request), input));
  } catch (error) {
    next(error);
  }
});

profileRouter.get('/options/skills', async (_request, response, next) => {
  try {
    response.json(await getSkillOptions());
  } catch (error) {
    next(error);
  }
});

profileRouter.put('/me/skills', async (request, response, next) => {
  try {
    const input = replaceSkillsSchema.parse(request.body);

    response.json(await updateUserSkills(getUser(request), input));
  } catch (error) {
    next(error);
  }
});

profileRouter.post('/me/portfolio', async (request, response, next) => {
  try {
    const input = portfolioCreateSchema.parse(request.body);

    response.status(201).json(await addPortfolioItem(getUser(request), input));
  } catch (error) {
    next(error);
  }
});

profileRouter.put('/me/portfolio/:id', async (request, response, next) => {
  try {
    const params = idParamSchema.parse(request.params);
    const input = portfolioUpdateSchema.parse(request.body);

    response.json(await editPortfolioItem(getUser(request), params.id, input));
  } catch (error) {
    next(error);
  }
});

profileRouter.delete('/me/portfolio/:id', async (request, response, next) => {
  try {
    const params = idParamSchema.parse(request.params);

    response.json(await removePortfolioItem(getUser(request), params.id));
  } catch (error) {
    next(error);
  }
});
