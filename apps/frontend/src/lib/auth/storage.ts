import type { User } from '@/types';

const TOKEN_KEY = 'library_jwt_token';
const USER_KEY = 'library_user_profile';

const clearLegacyLocalStorage = (): void => {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {
    // Storage may be unavailable in restricted browser contexts.
  }
};

export const authStorage = {
  getToken(): string | null {
    try {
      clearLegacyLocalStorage();
      return sessionStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },

  setToken(token: string): void {
    try {
      sessionStorage.setItem(TOKEN_KEY, token);
    } catch (e) {
      console.error('Error saving token', e);
    }
  },

  clearToken(): void {
    try {
      sessionStorage.removeItem(TOKEN_KEY);
    } catch (e) {
      console.error('Error clearing token', e);
    }
  },

  getUser(): User | null {
    try {
      clearLegacyLocalStorage();
      const raw = sessionStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  setUser(user: User): void {
    try {
      sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (e) {
      console.error('Error saving user', e);
    }
  },

  clearUser(): void {
    try {
      sessionStorage.removeItem(USER_KEY);
    } catch (e) {
      console.error('Error clearing user', e);
    }
  },

  clearAll(): void {
    try {
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(USER_KEY);
      clearLegacyLocalStorage();
    } catch (e) {
      console.error('Error clearing auth storage', e);
    }
  }
};
