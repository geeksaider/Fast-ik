import { Router } from 'express';
import type { Request } from 'express';
import { HttpError } from '../../http/errors/http-error.js';
import { requireAuth } from '../../http/middlewares/auth.js';
import { idParamSchema, sendMessageSchema } from './communication.schemas.js';
import {
  getConversation,
  getConversations,
  getNotifications,
  readAllNotifications,
  readNotification,
  sendMessage,
} from './communication.service.js';

export const communicationRouter = Router();

const getUser = (request: Request) => {
  if (!request.user) {
    throw new HttpError(401, 'Требуется авторизация');
  }

  return request.user;
};

communicationRouter.use(['/conversations', '/notifications'], requireAuth);

communicationRouter.get('/conversations', async (request, response, next) => {
  try {
    response.json(await getConversations(getUser(request)));
  } catch (error) {
    next(error);
  }
});

communicationRouter.get('/conversations/:id', async (request, response, next) => {
  try {
    const params = idParamSchema.parse(request.params);

    response.json(await getConversation(getUser(request), params.id));
  } catch (error) {
    next(error);
  }
});

communicationRouter.post('/conversations/:id/messages', async (request, response, next) => {
  try {
    const params = idParamSchema.parse(request.params);
    const input = sendMessageSchema.parse(request.body);

    response.status(201).json(await sendMessage(getUser(request), params.id, input));
  } catch (error) {
    next(error);
  }
});

communicationRouter.get('/notifications', async (request, response, next) => {
  try {
    response.json(await getNotifications(getUser(request)));
  } catch (error) {
    next(error);
  }
});

communicationRouter.post('/notifications/read-all', async (request, response, next) => {
  try {
    response.json(await readAllNotifications(getUser(request)));
  } catch (error) {
    next(error);
  }
});

communicationRouter.post('/notifications/:id/read', async (request, response, next) => {
  try {
    const params = idParamSchema.parse(request.params);

    response.json(await readNotification(getUser(request), params.id));
  } catch (error) {
    next(error);
  }
});
