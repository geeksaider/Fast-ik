import { env } from './config/env.js';
import { closePool } from './db/pool.js';
import { createApp } from './http/create-app.js';

const app = createApp();
const server = app.listen(env.apiPort, () => {
  console.log(`Fastik API is running on http://localhost:${env.apiPort}`);
});

const shutdown = async (signal: string) => {
  console.log(`${signal} received, shutting down Fastik API`);

  server.close(async () => {
    await closePool();
    process.exit(0);
  });
};

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
