import { randomUUID } from 'crypto';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import app from '../src/app.js';

export type TestUser = {
    name: string;
    email: string;
    password: string;
};

export type DecodedToken = {
    id: string;
    email: string;
    name: string;
    balance: number;
    iat: number;
    exp: number;
};

export function buildUser(overrides: Partial<TestUser> = {}): TestUser {
    return {
        name: 'Test User',
        email: `user-${randomUUID()}@mail.com`,
        password: 'secret123',
        ...overrides,
    };
}

export function decode(token: string): DecodedToken {
    return jwt.decode(token) as DecodedToken;
}

export async function registerUser(overrides: Partial<TestUser> = {}) {
    const user = buildUser(overrides);
    const response = await request(app).post('/auth/register').send(user);
    return { user, token: response.body.token as string };
}

export async function currentBalance(user: TestUser): Promise<number> {
    const response = await request(app).post('/auth/login').send({ email: user.email, password: user.password });
    return decode(response.body.token).balance;
}
