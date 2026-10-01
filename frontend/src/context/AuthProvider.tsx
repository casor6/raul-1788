import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { AuthContext } from './AuthContext';
import { loginRequest, registerRequest, type AuthResponse, type RegisterData, type User } from '../api/authService';
import { setUnauthorizedHandler, tokenStorage } from '../api/http';

export type TokenPayload = {
  id: string;
  name: string;
  email: string;
  balance: number;
  exp: number;
  iat: number;
};

function isTokenExpired(payload: TokenPayload): boolean {
  return Date.now() >= payload.exp * 1000;
}

function loadUser(): User | null {
  const token = tokenStorage.get();
  if (!token) return null;

  const payload = decodeToken(token);
  if (!payload || isTokenExpired(payload)) {
    tokenStorage.clear();
    return null;
  }

  return { id: payload.id, name: payload.name, email: payload.email, balance: payload.balance };
}

function loadBalance(): number {
  return Number(localStorage.getItem('balance') ?? 0);
}

export function decodeToken(token: string): TokenPayload | null {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(loadUser);
  const [balance, setBalance] = useState<number>(loadBalance);

  const saveSession = ({ token }: AuthResponse) => {
    tokenStorage.set(token);
    const payload = decodeToken(token);
    setUser(payload ? { id: payload.id, name: payload.name, email: payload.email, balance: payload.balance } : null);
    localStorage.setItem('balance', payload?.balance.toString() ?? '0');
  };

  const logout = useCallback(() => {
    tokenStorage.clear();
    localStorage.removeItem('balance');
    setUser(null);
  }, []);

  const addBalance = (amount: number) => {
    const next = Math.round((balance + amount) * 100) / 100;
    localStorage.setItem('balance', String(next));
    setBalance(next);
  };

  useEffect(() => {
    setUnauthorizedHandler(logout);
  }, [logout]);

  const login = async (email: string, password: string) => {
    saveSession(await loginRequest(email, password));
  };

  const register = async (data: RegisterData) => {
    saveSession(await registerRequest(data));
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, register, logout, balance, addBalance }}>
      {children}
    </AuthContext.Provider>
  );
}