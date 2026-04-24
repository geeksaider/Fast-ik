import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';
import type { StringValue } from 'ms';
import type { UserRole } from '@fastik/shared';
import { env } from '../../config/env.js';
import { HttpError } from '../../http/errors/http-error.js';
import {
  createAuthUser,
  findAuthUserByEmail,
  findAuthUserById,
  markLoginSuccess,
} from './auth.repository.js';
import type { LoginInput, RegisterInput } from './auth.schemas.js';
import type { AuthResponse, AuthTokenPayload, AuthUser } from './auth.types.js';

const sanitizeUser = (user: AuthUser): AuthUser => ({
  id: user.id,
  email: user.email,
  displayName: user.displayName,
  role: user.role,
  status: user.status,
  emailVerified: user.emailVerified,
  lastLoginAt: user.lastLoginAt,
});

const signAccessToken = (user: Pick<AuthUser, 'id' | 'email' | 'role'>) => {
  const options: SignOptions = {
    expiresIn: env.jwtAccessTtl as StringValue,
    issuer: 'fastik-api',
  };

  return jwt.sign({ email: user.email, role: user.role }, env.jwtAccessSecret, {
    ...options,
    subject: user.id,
  });
};

export const register = async (input: RegisterInput): Promise<AuthResponse> => {
  const existingUser = await findAuthUserByEmail(input.email);

  if (existingUser) {
    throw new HttpError(409, 'Пользователь с таким email уже существует');
  }

  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await createAuthUser({
    email: input.email,
    displayName: input.displayName,
    passwordHash,
    role: input.role,
  });

  return {
    accessToken: signAccessToken(user),
    user: sanitizeUser(user),
  };
};

export const login = async (
  input: LoginInput,
  meta: { ipAddress?: string; userAgent?: string },
): Promise<AuthResponse> => {
  const user = await findAuthUserByEmail(input.email);

  if (!user?.passwordHash) {
    throw new HttpError(401, 'Неверный email или пароль');
  }

  if (user.status !== 'active') {
    throw new HttpError(403, 'Пользователь заблокирован');
  }

  const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);

  if (!passwordMatches) {
    throw new HttpError(401, 'Неверный email или пароль');
  }

  await markLoginSuccess(user.id, meta);

  return {
    accessToken: signAccessToken(user),
    user: sanitizeUser({ ...user, lastLoginAt: new Date().toISOString() }),
  };
};

export const getCurrentUser = async (id: string) => {
  const user = await findAuthUserById(id);

  if (!user) {
    throw new HttpError(401, 'Пользователь не найден');
  }

  if (user.status !== 'active') {
    throw new HttpError(403, 'Пользователь заблокирован');
  }

  return sanitizeUser(user);
};

export const verifyAccessToken = (token: string): AuthTokenPayload => {
  try {
    const payload = jwt.verify(token, env.jwtAccessSecret, {
      issuer: 'fastik-api',
    });

    if (!payload || typeof payload !== 'object' || !payload.sub) {
      throw new HttpError(401, 'Некорректный токен');
    }

    return {
      sub: payload.sub,
      email: String(payload.email),
      role: payload.role as UserRole,
    };
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }

    throw new HttpError(401, 'Сессия истекла или токен некорректен');
  }
};
