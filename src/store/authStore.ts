import { create } from 'zustand';
import { TOKEN_KEY, USER_KEY } from '../api/axios';
import type { Role, User } from '../types';
import { authStorage } from '../utils/authStorage';

interface AuthState {
  user: User | null;
  token: string | null;
  role: Role | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  setUser: (user: User) => void;
}

function readUser(): User | null {
  try {
    const raw = authStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

authStorage.migrateFromLocalStorage();

const initialToken = authStorage.getItem(TOKEN_KEY);
const initialUser = readUser();

export const useAuthStore = create<AuthState>((set) => ({
  user: initialUser,
  token: initialToken,
  role: initialUser?.role ?? null,
  isAuthenticated: Boolean(initialToken && initialUser),
  login: (token, user) => {
    authStorage.setItem(TOKEN_KEY, token);
    authStorage.setItem(USER_KEY, JSON.stringify(user));
    set({ token, user, role: user.role, isAuthenticated: true });
  },
  logout: () => {
    authStorage.clearAuth();
    set({ token: null, user: null, role: null, isAuthenticated: false });
  },
  setUser: (user) => {
    authStorage.setItem(USER_KEY, JSON.stringify(user));
    set({ user, role: user.role });
  },
}));
