import { apiFetch } from './http';

export type User = { id: string; name: string; email: string; balance: number };
export type AuthResponse = { token: string; };
export type RegisterData = { name: string; email: string; password: string };

export const loginRequest = (email: string, password: string) =>
    apiFetch<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });

export const registerRequest = (data: RegisterData) =>
    apiFetch<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
    });