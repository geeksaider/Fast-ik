import { defineStore } from 'pinia';
import {
  getCurrentUser,
  loginUser,
  registerUser,
  type AuthResponse,
  type AuthUser,
  type LoginPayload,
  type RegisterPayload,
} from '../lib/api';

const tokenKey = 'fastik.accessToken';
const userKey = 'fastik.user';

const readStoredUser = () => {
  const raw = localStorage.getItem(userKey);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    localStorage.removeItem(userKey);
    return null;
  }
};

export const useAuthStore = defineStore('auth', {
  state: () => ({
    accessToken: localStorage.getItem(tokenKey),
    user: readStoredUser(),
    isLoading: false,
    error: null as string | null,
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.accessToken && state.user),
  },
  actions: {
    persistSession(response: AuthResponse) {
      this.accessToken = response.accessToken;
      this.user = response.user;
      localStorage.setItem(tokenKey, response.accessToken);
      localStorage.setItem(userKey, JSON.stringify(response.user));
    },
    async register(payload: RegisterPayload) {
      this.isLoading = true;
      this.error = null;

      try {
        const response = await registerUser(payload);
        this.persistSession(response);
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Не удалось зарегистрироваться';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
    async login(payload: LoginPayload) {
      this.isLoading = true;
      this.error = null;

      try {
        const response = await loginUser(payload);
        this.persistSession(response);
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Не удалось войти';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
    async refreshCurrentUser() {
      if (!this.accessToken) {
        return;
      }

      try {
        const response = await getCurrentUser(this.accessToken);
        this.user = response.user;
        localStorage.setItem(userKey, JSON.stringify(response.user));
      } catch {
        this.logout();
      }
    },
    logout() {
      this.accessToken = null;
      this.user = null;
      localStorage.removeItem(tokenKey);
      localStorage.removeItem(userKey);
    },
  },
});
