import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../src/app.js';
import { buildUser, decode, registerUser } from './helpers.js';

describe('POST /auth/register', () => {
    it('registers a user and returns a token with zero balance', async () => {
        const user = buildUser();

        const response = await request(app).post('/auth/register').send(user);

        expect(response.status).toBe(201);
        expect(response.body).toEqual({ token: expect.any(String) });
        expect(decode(response.body.token)).toMatchObject({
            id: expect.any(String),
            email: user.email,
            name: user.name,
            balance: 0,
        });
    });

    it('does not expose the password hash', async () => {
        const response = await request(app).post('/auth/register').send(buildUser());

        expect(response.body).not.toHaveProperty('password');
        expect(decode(response.body.token)).not.toHaveProperty('password');
    });

    it('normalizes the email to lowercase without spaces', async () => {
        const user = buildUser();

        const response = await request(app)
            .post('/auth/register')
            .send({ ...user, email: `  ${user.email.toUpperCase()}  ` });

        expect(response.status).toBe(201);
        expect(decode(response.body.token).email).toBe(user.email);
    });

    it.each([
        ['name', { name: undefined }],
        ['email', { email: undefined }],
        ['password', { password: undefined }],
        ['name (empty)', { name: '' }],
    ])('rejects a missing %s', async (_field, overrides) => {
        const response = await request(app)
            .post('/auth/register')
            .send({ ...buildUser(), ...overrides });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ message: 'Name, email and password are required' });
    });

    it('rejects an empty body', async () => {
        const response = await request(app).post('/auth/register').send({});

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ message: 'Name, email and password are required' });
    });

    it.each(['not-an-email', 'user@', '@mail.com', 'user@mail', 'user mail@mail.com'])(
        'rejects the invalid email "%s"',
        async (email) => {
            const response = await request(app)
                .post('/auth/register')
                .send(buildUser({ email }));

            expect(response.status).toBe(400);
            expect(response.body).toEqual({ message: 'Invalid email format' });
        },
    );

    it('rejects a password shorter than 6 characters', async () => {
        const response = await request(app)
            .post('/auth/register')
            .send(buildUser({ password: '12345' }));

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ message: 'Password must be at least 6 characters long' });
    });

    it('rejects an email that is already registered', async () => {
        const { user } = await registerUser();

        const response = await request(app)
            .post('/auth/register')
            .send({ ...user, email: user.email.toUpperCase() });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ message: 'User already exists' });
    });
});

describe('POST /auth/login', () => {
    it('logs in and returns a token with the user data', async () => {
        const { user } = await registerUser();

        const response = await request(app)
            .post('/auth/login')
            .send({ email: user.email, password: user.password });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ token: expect.any(String) });

        const payload = decode(response.body.token);
        expect(payload).toMatchObject({ email: user.email, name: user.name, balance: 0 });
        expect(payload.exp - payload.iat).toBe(24 * 60 * 60);
    });

    it('accepts the email with uppercase letters and spaces', async () => {
        const { user } = await registerUser();

        const response = await request(app)
            .post('/auth/login')
            .send({ email: ` ${user.email.toUpperCase()} `, password: user.password });

        expect(response.status).toBe(200);
    });

    it.each([
        ['email', { email: undefined }],
        ['password', { password: undefined }],
        ['email and password', { email: undefined, password: undefined }],
    ])('rejects a missing %s', async (_field, overrides) => {
        const response = await request(app)
            .post('/auth/login')
            .send({ email: 'user@mail.com', password: 'secret123', ...overrides });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ message: 'Email and password are required' });
    });

    it('rejects an email that is not registered', async () => {
        const response = await request(app)
            .post('/auth/login')
            .send({ email: buildUser().email, password: 'secret123' });

        expect(response.status).toBe(401);
        expect(response.body).toEqual({ message: 'Invalid email or password' });
    });

    it('rejects a wrong password', async () => {
        const { user } = await registerUser();

        const response = await request(app)
            .post('/auth/login')
            .send({ email: user.email, password: 'wrong-password' });

        expect(response.status).toBe(401);
        expect(response.body).toEqual({ message: 'Invalid email or password' });
    });
});
