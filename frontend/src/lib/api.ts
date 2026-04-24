const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:4200/api';

export type HealthStatus = {
  status: 'ok';
  service: string;
  timestamp: string;
  uptime: number;
};

export type AuthRole = 'customer' | 'performer' | 'support' | 'moderator' | 'admin' | 'super_admin';

export type AuthUser = {
  id: string;
  email: string;
  displayName: string;
  role: AuthRole;
  status?: 'active' | 'blocked';
  emailVerified?: boolean;
  lastLoginAt?: string | null;
};

export type AuthResponse = {
  accessToken: string;
  user: AuthUser;
};

export type RegisterPayload = {
  email: string;
  password: string;
  displayName: string;
  role: 'customer' | 'performer';
};

export type LoginPayload = {
  email: string;
  password: string;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

const apiFetch = async <T>(path: string, options: RequestInit = {}) => {
  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(data?.error?.message ?? 'Fastik API error', response.status);
  }

  return data as T;
};

export const getHealth = async () => apiFetch<HealthStatus>('/health');

export const registerUser = async (payload: RegisterPayload) =>
  apiFetch<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const loginUser = async (payload: LoginPayload) =>
  apiFetch<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const getCurrentUser = async (token: string) =>
  apiFetch<{ user: AuthUser }>('/auth/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
