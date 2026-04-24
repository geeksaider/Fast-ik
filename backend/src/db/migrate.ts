import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { closePool, pool } from './pool.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(dirname, 'migrations');

const ensureMigrationsTable = async () => {
  await pool.query(`
    create table if not exists schema_migrations (
      id serial primary key,
      name text not null unique,
      applied_at timestamptz not null default now()
    );
  `);
};

const getAppliedMigrations = async () => {
  const result = await pool.query<{ name: string }>(
    'select name from schema_migrations order by name',
  );

  return new Set(result.rows.map((row) => row.name));
};

const run = async () => {
  await ensureMigrationsTable();

  const applied = await getAppliedMigrations();
  const files = (await readdir(migrationsDir)).filter((file) => file.endsWith('.sql')).sort();

  for (const file of files) {
    if (applied.has(file)) {
      continue;
    }

    const migration = await readFile(path.join(migrationsDir, file), 'utf8');
    const client = await pool.connect();

    try {
      await client.query('begin');
      await client.query(migration);
      await client.query('insert into schema_migrations (name) values ($1)', [file]);
      await client.query('commit');
      console.log(`Applied migration: ${file}`);
    } catch (error) {
      await client.query('rollback');
      throw error;
    } finally {
      client.release();
    }
  }

  if (files.every((file) => applied.has(file))) {
    console.log('No pending migrations');
  }
};

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePool();
  });
