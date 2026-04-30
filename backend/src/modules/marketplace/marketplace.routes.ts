import { Router } from 'express';
import type { Request } from 'express';
import { optionalAuth, requireAuth } from '../../http/middlewares/auth.js';
import { HttpError } from '../../http/errors/http-error.js';
import {
  applicationCreateSchema,
  idParamSchema,
  jobInviteCreateSchema,
  jobCreateSchema,
  jobListQuerySchema,
  selectApplicationParamsSchema,
} from './marketplace.schemas.js';
import {
  applyToJob,
  getMarketplaceCategories,
  getMarketplaceJob,
  getMarketplaceJobs,
  invitePerformerToJob,
  publishJob,
  selectApplication,
} from './marketplace.service.js';

export const marketplaceRouter = Router();

const getUser = (request: Request) => {
  if (!request.user) {
    throw new HttpError(401, 'Требуется авторизация');
  }

  return request.user;
};

marketplaceRouter.get('/categories', async (_request, response, next) => {
  try {
    response.json(await getMarketplaceCategories());
  } catch (error) {
    next(error);
  }
});

marketplaceRouter.get('/jobs', optionalAuth, async (request, response, next) => {
  try {
    const query = jobListQuerySchema.parse(request.query);

    response.json(await getMarketplaceJobs(query, request.user));
  } catch (error) {
    next(error);
  }
});

marketplaceRouter.post('/jobs', requireAuth, async (request, response, next) => {
  try {
    const input = jobCreateSchema.parse(request.body);

    response.status(201).json(await publishJob(getUser(request), input));
  } catch (error) {
    next(error);
  }
});

marketplaceRouter.get('/jobs/:id', optionalAuth, async (request, response, next) => {
  try {
    const params = idParamSchema.parse(request.params);

    response.json(await getMarketplaceJob(params.id, request.user));
  } catch (error) {
    next(error);
  }
});

marketplaceRouter.post('/jobs/:id/applications', requireAuth, async (request, response, next) => {
  try {
    const params = idParamSchema.parse(request.params);
    const input = applicationCreateSchema.parse(request.body);

    response.status(201).json(await applyToJob(getUser(request), params.id, input));
  } catch (error) {
    next(error);
  }
});

marketplaceRouter.post('/jobs/:id/invites', requireAuth, async (request, response, next) => {
  try {
    const params = idParamSchema.parse(request.params);
    const input = jobInviteCreateSchema.parse(request.body);

    response.status(201).json(await invitePerformerToJob(getUser(request), params.id, input));
  } catch (error) {
    next(error);
  }
});

marketplaceRouter.post(
  '/jobs/:jobId/applications/:applicationId/select',
  requireAuth,
  async (request, response, next) => {
    try {
      const params = selectApplicationParamsSchema.parse(request.params);

      response.json(await selectApplication(getUser(request), params.jobId, params.applicationId));
    } catch (error) {
      next(error);
    }
  },
);
