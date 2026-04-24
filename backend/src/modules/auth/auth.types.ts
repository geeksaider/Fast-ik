import type { UserRole } from '@fastik/shared';

export type AuthUser = {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  status: 'active' | 'blocked';
  emailVerified: boolean;
  lastLoginAt: string | null;
};

export type AuthUserWithPassword = AuthUser & {
  passwordHash: string | null;
};

export type AuthTokenPayload = {
  sub: string;
  email: string;
  role: UserRole;
};

export type AuthResponse = {
  accessToken: string;
  user: AuthUser;
};
