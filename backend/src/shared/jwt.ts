import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'replace_with_a_secret';
type PayloadUser = {
    id: string;
    email: string;
    name: string;
};

export function signToken(user: PayloadUser): string {
    return jwt.sign(user, JWT_SECRET, { expiresIn: '24h' });
}

export function verifyToken(token: string) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        console.error(error);
        return null;
    }
}

export function decodeToken(token: string) {
    return jwt.decode(token);
}