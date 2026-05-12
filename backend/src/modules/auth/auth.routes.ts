import { Router } from 'express';
import type { Request } from 'express';
import { requireAuth } from '../../http/middlewares/auth.js';
import { HttpError } from '../../http/errors/http-error.js';
import { createRateLimit } from '../../http/middlewares/rate-limit.js';
import {
  changeEmail,
  changePassword,
  deleteAccount,
  getMyNotificationSettings,
  login,
  register,
  saveNotificationSettings,
} from './auth.service.js';
import {
  changeEmailSchema,
  changePasswordSchema,
  deleteAccountSchema,
  loginSchema,
  notificationSettingsSchema,
  registerSchema,
  selfRegisterRoles,
} from './auth.schemas.js';

export const authRouter = Router();

const authWriteRateLimit = createRateLimit({
  windowMs: 60_000,
  maxRequests: 8,
  message: 'Слишком много попыток. Попробуйте позже.',
});

const getUserId = (request: Request) => {
  if (!request.user) {
    throw new HttpError(401, 'Требуется авторизация');
  }

  return request.user.id;
};

authRouter.get('/roles', (_request, response) => {
  response.json({
    roles: selfRegisterRoles.map((role) => ({
      code: role,
      title: role === 'customer' ? 'Заказчик' : 'Исполнитель',
    })),
  });
});

authRouter.post('/register', authWriteRateLimit, async (request, response, next) => {
  try {
    const input = registerSchema.parse(request.body);
    const result = await register(input);

    response.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

authRouter.post('/login', authWriteRateLimit, async (request, response, next) => {
  try {
    const input = loginSchema.parse(request.body);
    const result = await login(input, {
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });

    response.json(result);
  } catch (error) {
    next(error);
  }
});

authRouter.get('/me', requireAuth, (request, response) => {
  response.json({ user: request.user });
});

authRouter.post('/password', requireAuth, async (request, response, next) => {
  try {
    const input = changePasswordSchema.parse(request.body);

    response.json(await changePassword(getUserId(request), input));
  } catch (error) {
    next(error);
  }
});

authRouter.post('/email', requireAuth, async (request, response, next) => {
  try {
    const input = changeEmailSchema.parse(request.body);

    response.json(await changeEmail(getUserId(request), input));
  } catch (error) {
    next(error);
  }
});

authRouter.post('/account/delete', requireAuth, async (request, response, next) => {
  try {
    const input = deleteAccountSchema.parse(request.body);

    response.json(await deleteAccount(getUserId(request), input));
  } catch (error) {
    next(error);
  }
});

authRouter.get('/notification-settings', requireAuth, async (request, response, next) => {
  try {
    response.json(await getMyNotificationSettings(getUserId(request)));
  } catch (error) {
    next(error);
  }
});

authRouter.put('/notification-settings', requireAuth, async (request, response, next) => {
  try {
    const input = notificationSettingsSchema.parse(request.body);

    response.json(await saveNotificationSettings(getUserId(request), input));
  } catch (error) {
    next(error);
  }
});
