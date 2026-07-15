import { TOKEN_KEY, USER_KEY } from '../api/axios';

/** JWT and user profile — session-scoped (cleared when browser tab closes). */
export const authStorage = {
  getItem(key: string): string | null {
    return sessionStorage.getItem(key);
  },
  setItem(key: string, value: string): void {
    sessionStorage.setItem(key, value);
  },
  removeItem(key: string): void {
    sessionStorage.removeItem(key);
  },
  clearAuth(): void {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
  /** One-time migration for users who had tokens in localStorage. */
  migrateFromLocalStorage(): void {
    for (const key of [TOKEN_KEY, USER_KEY]) {
      const legacy = localStorage.getItem(key);
      if (legacy && !sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, legacy);
      }
      localStorage.removeItem(key);
    }
  },
};
