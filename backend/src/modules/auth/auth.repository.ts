import type { PoolClient } from 'pg';
import { pool } from '../../db/pool.js';
import type { AuthUser, AuthUserWithPassword } from './auth.types.js';

const userSelect = `
  select
    users.id,
    users.email,
    users.password_hash as "passwordHash",
    users.display_name as "displayName",
    users.status,
    users.email_verified as "emailVerified",
    users.last_login_at as "lastLoginAt",
    roles.code as role
  from users
  join roles on roles.id = users.role_id
`;

export const findAuthUserByEmail = async (email: string) => {
  const result = await pool.query<AuthUserWithPassword>(`${userSelect} where users.email = $1`, [
    email,
  ]);

  return result.rows[0] ?? null;
};

export const findAuthUserById = async (id: string) => {
  const result = await pool.query<AuthUserWithPassword>(`${userSelect} where users.id = $1`, [id]);

  return result.rows[0] ?? null;
};

export const createAuthUser = async (input: {
  email: string;
  displayName: string;
  passwordHash: string;
  role: 'customer' | 'performer';
}) => {
  const client = await pool.connect();

  try {
    await client.query('begin');

    const result = await client.query<AuthUser>(
      `insert into users (email, password_hash, display_name, role_id)
       select $1, $2, $3, roles.id
       from roles
       where roles.code = $4
       returning
         id,
         email,
         display_name as "displayName",
         status,
         email_verified as "emailVerified",
         last_login_at as "lastLoginAt",
         $4::text as role`,
      [input.email, input.passwordHash, input.displayName, input.role],
    );

    const user = result.rows[0];

    if (!user) {
      throw new Error('Role not found');
    }

    await writeAuthEvent(client, {
      userId: user.id,
      eventType: 'register',
    });

    await client.query('commit');

    return user;
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
};

export const markLoginSuccess = async (userId: string, meta: AuthEventMeta) => {
  const client = await pool.connect();

  try {
    await client.query('begin');
    await client.query('update users set last_login_at = now(), updated_at = now() where id = $1', [
      userId,
    ]);
    await writeAuthEvent(client, {
      userId,
      eventType: 'login_success',
      ...meta,
    });
    await client.query('commit');
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
};

export const writeAuthEvent = async (client: PoolClient, input: AuthEventInput) => {
  await client.query(
    `insert into auth_events (user_id, event_type, ip_address, user_agent)
     values ($1, $2, $3, $4)`,
    [input.userId, input.eventType, input.ipAddress ?? null, input.userAgent ?? null],
  );
};

type AuthEventMeta = {
  ipAddress?: string;
  userAgent?: string;
};

type AuthEventInput = AuthEventMeta & {
  userId: string | null;
  eventType: string;
};
