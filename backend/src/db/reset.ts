import { closePool, pool } from './pool.js';

const run = async () => {
  await pool.query('drop schema public cascade');
  await pool.query('create schema public');
  await pool.query('grant all on schema public to public');

  console.log('Database schema was reset');
};

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePool();
  });
