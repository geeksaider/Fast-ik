import { Router } from 'express';
import { pool } from '../../db/pool.js';

export const healthRouter = Router();

healthRouter.get('/', (_request, response) => {
  response.json({
    status: 'ok',
    service: 'fastik-api',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

healthRouter.get('/database', async (_request, response) => {
  try {
    const result = await pool.query<{ now: string }>('select now()');

    response.json({
      status: 'ok',
      database: 'postgresql',
      timestamp: result.rows[0]?.now ?? new Date().toISOString(),
    });
  } catch {
    response.status(503).json({
      status: 'error',
      database: 'postgresql',
      message: 'Database is unavailable',
    });
  }
});
