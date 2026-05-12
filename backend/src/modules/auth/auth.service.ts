import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';
import type { StringValue } from 'ms';
import type { UserRole } from '@fastik/shared';
import { env } from '../../config/env.js';
import { HttpError } from '../../http/errors/http-error.js';
import {
  createAuthUser,
  deleteUserById,
  findAuthUserByEmail,
  findAuthUserById,
  getNotificationSettings,
  markLoginSuccess,
  setNotificationSettings,
  updateUserEmail,
  updateUserPassword,
} from './auth.repository.js';
import type {
  ChangeEmailInput,
  ChangePasswordInput,
  DeleteAccountInput,
  LoginInput,
  NotificationSettingsInput,
  RegisterInput,
} from './auth.schemas.js';
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

const requireUserWithPassword = async (userId: string) => {
  const user = await findAuthUserById(userId);

  if (!user?.passwordHash) {
    throw new HttpError(401, 'Пользователь не найден');
  }

  return { ...user, passwordHash: user.passwordHash };
};

export const changePassword = async (userId: string, input: ChangePasswordInput) => {
  const user = await requireUserWithPassword(userId);
  const passwordMatches = await bcrypt.compare(input.currentPassword, user.passwordHash);

  if (!passwordMatches) {
    throw new HttpError(401, 'Текущий пароль введён неверно');
  }

  if (input.currentPassword === input.newPassword) {
    throw new HttpError(400, 'Новый пароль должен отличаться от текущего');
  }

  const newHash = await bcrypt.hash(input.newPassword, 12);
  await updateUserPassword(userId, newHash);

  return { ok: true };
};

export const changeEmail = async (userId: string, input: ChangeEmailInput) => {
  const user = await requireUserWithPassword(userId);
  const passwordMatches = await bcrypt.compare(input.currentPassword, user.passwordHash);

  if (!passwordMatches) {
    throw new HttpError(401, 'Текущий пароль введён неверно');
  }

  if (user.email === input.newEmail) {
    throw new HttpError(400, 'Новый email совпадает с текущим');
  }

  const existing = await findAuthUserByEmail(input.newEmail);

  if (existing && existing.id !== userId) {
    throw new HttpError(409, 'Этот email уже используется другим аккаунтом');
  }

  await updateUserEmail(userId, input.newEmail);

  return { ok: true, email: input.newEmail };
};

export const deleteAccount = async (userId: string, input: DeleteAccountInput) => {
  const user = await requireUserWithPassword(userId);
  const passwordMatches = await bcrypt.compare(input.currentPassword, user.passwordHash);

  if (!passwordMatches) {
    throw new HttpError(401, 'Пароль введён неверно');
  }

  await deleteUserById(userId);

  return { ok: true };
};

export const getMyNotificationSettings = async (userId: string) => {
  const settings = await getNotificationSettings(userId);

  return (
    settings ?? {
      email: { messages: true, applications: true, orders: true, marketing: false },
      inApp: { messages: true, applications: true, orders: true },
    }
  );
};

export const saveNotificationSettings = async (
  userId: string,
  input: NotificationSettingsInput,
) => {
  await setNotificationSettings(userId, input);

  return input;
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
