import { Router } from 'express';
import type { Request } from 'express';
import { HttpError } from '../../http/errors/http-error.js';
import { optionalAuth, requireAuth } from '../../http/middlewares/auth.js';
import {
  contestCreateSchema,
  contestListQuerySchema,
  contestSubmissionCreateSchema,
  idParamSchema,
  selectContestSubmissionParamsSchema,
} from './contests.schemas.js';
import {
  chooseContestWinner,
  getContest,
  getContests,
  publishContest,
  submitContestEntry,
} from './contests.service.js';

export const contestsRouter = Router();

const getUser = (request: Request) => {
  if (!request.user) {
    throw new HttpError(401, 'Требуется авторизация');
  }

  return request.user;
};

contestsRouter.get('/', optionalAuth, async (request, response, next) => {
  try {
    const query = contestListQuerySchema.parse(request.query);

    response.json(await getContests(query, request.user));
  } catch (error) {
    next(error);
  }
});

contestsRouter.post('/', requireAuth, async (request, response, next) => {
  try {
    const input = contestCreateSchema.parse(request.body);

    response.status(201).json(await publishContest(getUser(request), input));
  } catch (error) {
    next(error);
  }
});

contestsRouter.get('/:id', optionalAuth, async (request, response, next) => {
  try {
    const params = idParamSchema.parse(request.params);

    response.json(await getContest(params.id, request.user));
  } catch (error) {
    next(error);
  }
});

contestsRouter.post('/:id/submissions', requireAuth, async (request, response, next) => {
  try {
    const params = idParamSchema.parse(request.params);
    const input = contestSubmissionCreateSchema.parse(request.body);

    response.status(201).json(await submitContestEntry(getUser(request), params.id, input));
  } catch (error) {
    next(error);
  }
});

contestsRouter.post(
  '/:contestId/submissions/:submissionId/select',
  requireAuth,
  async (request, response, next) => {
    try {
      const params = selectContestSubmissionParamsSchema.parse(request.params);

      response.json(
        await chooseContestWinner(getUser(request), params.contestId, params.submissionId),
      );
    } catch (error) {
      next(error);
    }
  },
);
