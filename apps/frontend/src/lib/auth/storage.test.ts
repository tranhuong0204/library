// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from 'vitest';
import type { User } from '@/types';
import { authStorage } from './storage';

const user: User = {
  id: 1,
  username: 'student',
  email: 'student@example.com',
  fullName: 'Student',
  major: 'IT',
  role: 'USER',
  active: true,
};

describe('authStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('stores authentication only in the current browser session', () => {
    authStorage.setToken('jwt-token');
    authStorage.setUser(user);

    expect(authStorage.getToken()).toBe('jwt-token');
    expect(authStorage.getUser()).toEqual(user);
    expect(localStorage.length).toBe(0);
  });

  it('removes both token and profile on logout', () => {
    authStorage.setToken('jwt-token');
    authStorage.setUser(user);

    authStorage.clearAll();

    expect(authStorage.getToken()).toBeNull();
    expect(authStorage.getUser()).toBeNull();
  });

  it('removes legacy persistent credentials while reading session data', () => {
    localStorage.setItem('library_jwt_token', 'legacy-token');

    expect(authStorage.getToken()).toBeNull();
    expect(localStorage.getItem('library_jwt_token')).toBeNull();
  });
});
