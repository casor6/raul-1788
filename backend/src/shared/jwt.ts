import jwt, { type JwtPayload } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'replace_with_a_secret';
type PayloadUser = {
    id: string;
    email: string;
    name: string;
    balance: number;
};

export type TokenPayload = PayloadUser & JwtPayload;

export function signToken(user: PayloadUser): string {
    return jwt.sign(user, JWT_SECRET, { expiresIn: '24h' });
}

export function verifyToken(token: string): TokenPayload | null {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (typeof decoded === 'string') return null;
        return decoded as TokenPayload;
    } catch (error) {
        console.error(error);
        return null;
    }
}

export function decodeToken(token: string) {
    return jwt.decode(token);
}