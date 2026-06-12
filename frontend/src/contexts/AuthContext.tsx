import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type { User } from '../services/api';

// ─── Helpers ─────────────────────────────────────────────────────

function decodeJwtPayload(token: string): User | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join('')
    );
    const payload = JSON.parse(json);
    return {
      id:        payload.sub ?? payload.id ?? '',
      email:     payload.email ?? '',
      name:      payload.name ?? payload.email?.split('@')[0] ?? 'User',
      createdAt: payload.createdAt ?? new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

// ─── Context types ────────────────────────────────────────────────

interface AuthContextValue {
  user:      User | null;
  token:     string | null;
  isLoading: boolean;
  login:     (token: string) => void;
  logout:    () => void;
}

// ─── Context ─────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token,     setToken]     = useState<string | null>(null);
  const [user,      setUser]      = useState<User   | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialise from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('bf_token');
    if (storedToken) {
      const decoded = decodeJwtPayload(storedToken);
      if (decoded) {
        setToken(storedToken);
        setUser(decoded);
      } else {
        localStorage.removeItem('bf_token');
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback((newToken: string) => {
    const decoded = decodeJwtPayload(newToken);
    localStorage.setItem('bf_token', newToken);
    setToken(newToken);
    setUser(decoded);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('bf_token');
    localStorage.removeItem('bf_user');
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ──────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
