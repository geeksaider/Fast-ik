import { Router } from 'express';
import type { Request } from 'express';
import { requireAuth } from '../../http/middlewares/auth.js';
import { requireRoles } from '../../http/middlewares/require-roles.js';
import { HttpError } from '../../http/errors/http-error.js';
import {
  changeAdminUserStatus,
  closeAdminDispute,
  decideAdminInterview,
  getAdminAuditLog,
  getAdminDashboard,
  getAdminDisputes,
  getAdminInterviews,
  getAdminModerationJobs,
  getAdminUsers,
  reviewAdminJob,
} from './admin.service.js';
import {
  decideInterviewSchema,
  idParamSchema,
  moderateJobSchema,
  resolveDisputeSchema,
  updateUserStatusSchema,
} from './admin.schemas.js';

export const adminRouter = Router();

const getUser = (request: Request) => {
  if (!request.user) {
    throw new HttpError(401, 'Требуется авторизация');
  }

  return request.user;
};

adminRouter.use(requireAuth, requireRoles(['admin']));

adminRouter.get('/overview', async (request, response, next) => {
  try {
    response.json(await getAdminDashboard(getUser(request)));
  } catch (error) {
    next(error);
  }
});

adminRouter.get('/users', async (request, response, next) => {
  try {
    response.json(await getAdminUsers(getUser(request)));
  } catch (error) {
    next(error);
  }
});

adminRouter.patch('/users/:id/status', async (request, response, next) => {
  try {
    const params = idParamSchema.parse(request.params);
    const input = updateUserStatusSchema.parse(request.body);

    response.json(await changeAdminUserStatus(getUser(request), params.id, input));
  } catch (error) {
    next(error);
  }
});

adminRouter.get('/disputes', async (request, response, next) => {
  try {
    response.json(await getAdminDisputes(getUser(request)));
  } catch (error) {
    next(error);
  }
});

adminRouter.post('/disputes/:id/resolve', async (request, response, next) => {
  try {
    const params = idParamSchema.parse(request.params);
    const input = resolveDisputeSchema.parse(request.body);

    response.json(await closeAdminDispute(getUser(request), params.id, input));
  } catch (error) {
    next(error);
  }
});

adminRouter.get('/moderation/jobs', async (request, response, next) => {
  try {
    response.json(await getAdminModerationJobs(getUser(request)));
  } catch (error) {
    next(error);
  }
});

adminRouter.post('/moderation/jobs/:id', async (request, response, next) => {
  try {
    const params = idParamSchema.parse(request.params);
    const input = moderateJobSchema.parse(request.body);

    response.json(await reviewAdminJob(getUser(request), params.id, input));
  } catch (error) {
    next(error);
  }
});

adminRouter.get('/interviews', async (request, response, next) => {
  try {
    response.json(await getAdminInterviews(getUser(request)));
  } catch (error) {
    next(error);
  }
});

adminRouter.post('/interviews/:id/decision', async (request, response, next) => {
  try {
    const params = idParamSchema.parse(request.params);
    const input = decideInterviewSchema.parse(request.body);

    response.json(await decideAdminInterview(getUser(request), params.id, input));
  } catch (error) {
    next(error);
  }
});

adminRouter.get('/audit-log', async (request, response, next) => {
  try {
    response.json(await getAdminAuditLog(getUser(request)));
  } catch (error) {
    next(error);
  }
});
