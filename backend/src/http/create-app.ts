import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { env } from '../config/env.js';
import { openApiSpec } from '../docs/openapi.js';
import { errorHandler } from './middlewares/error-handler.js';
import { authRouter } from '../modules/auth/auth.routes.js';
import { healthRouter } from '../modules/health/health.routes.js';
import { profileRouter } from '../modules/profile/profile.routes.js';

export const createApp = () => {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.corsOrigin, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(morgan('dev'));

  app.get('/', (_request, response) => {
    response.json({
      name: 'Fastik API',
      docs: '/docs',
      health: '/api/health',
    });
  });

  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));
  app.get('/openapi.json', (_request, response) => response.json(openApiSpec));
  app.use('/api/auth', authRouter);
  app.use('/api/health', healthRouter);
  app.use('/api/profile', profileRouter);
  app.use(errorHandler);

  return app;
};
