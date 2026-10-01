export type TokenPayload = {
    id: string;
    name: string;
    email: string;
    balance: number;
    exp: number;
    iat: number;
};

export function decodeToken(token: string): TokenPayload | null {
    try {
        const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
        return JSON.parse(new TextDecoder().decode(bytes));
    } catch {
        return null;
    }
}