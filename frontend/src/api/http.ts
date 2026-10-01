const API_URL = import.meta.env.VITE_API_URL;
const TOKEN_KEY = 'token';

export class ApiError extends Error {
    status: number;
    constructor(status: number, message: string) {
        super(message);
        this.status = status;
    }
}

export const tokenStorage = {
    get: () => localStorage.getItem(TOKEN_KEY),
    set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
    clear: () => localStorage.removeItem(TOKEN_KEY),
};

let onUnauthorized: (() => void) | null = null;
export const setUnauthorizedHandler = (handler: () => void) => {
    onUnauthorized = handler;
};

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = tokenStorage.get();
    const headers = new Headers(options.headers);
    if (options.body) headers.set('Content-Type', 'application/json');
    if (token) headers.set('Authorization', `Bearer ${token}`);

    const response = await fetch(`${API_URL}${path}`, { ...options, headers });

    if (response.status === 401 && token) onUnauthorized?.();

    if (!response.ok) {
        const body = await response.json().catch(() => null);
        const message = Array.isArray(body?.message) ? body.message[0] : body?.message;
        throw new ApiError(response.status, message ?? 'Ocurrió un error inesperado');
    }

    if (response.status === 204) return undefined as T;
    return response.json();
}