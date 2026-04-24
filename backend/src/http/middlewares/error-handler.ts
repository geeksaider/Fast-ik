import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { env } from '../../config/env.js';

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof ZodError) {
    response.status(400).json({
      error: {
        message: 'Некорректные данные запроса',
        issues: error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      },
    });
    return;
  }

  const statusCode = typeof error.statusCode === 'number' ? error.statusCode : 500;

  response.status(statusCode).json({
    error: {
      message: statusCode === 500 ? 'Internal server error' : error.message,
      details: env.nodeEnv === 'development' ? error.message : undefined,
    },
  });
};
