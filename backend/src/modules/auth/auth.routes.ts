import { Router } from 'express';
import { requireAuth } from '../../http/middlewares/auth.js';
import { login, register } from './auth.service.js';
import { loginSchema, registerSchema, selfRegisterRoles } from './auth.schemas.js';

export const authRouter = Router();

authRouter.get('/roles', (_request, response) => {
  response.json({
    roles: selfRegisterRoles.map((role) => ({
      code: role,
      title: role === 'customer' ? 'Заказчик' : 'Исполнитель',
    })),
  });
});

authRouter.post('/register', async (request, response, next) => {
  try {
    const input = registerSchema.parse(request.body);
    const result = await register(input);

    response.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

authRouter.post('/login', async (request, response, next) => {
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
