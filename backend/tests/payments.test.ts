import jwt from 'jsonwebtoken';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import app from '../src/app.js';
import { currentBalance, registerUser, type TestUser } from './helpers.js';

const APPROVED_CARD = {
    amount: 100,
    cardNumber: '1234123412341234',
    cardName: 'Test User',
    cardExpiration: '12/26',
    cardCVV: '543',
};

const OTHER_CARD_DATA = { cardExpiration: '12/27', cardCVV: '123' };

let user: TestUser;
let token: string;

function recharge(body: Record<string, unknown>, authToken: string | null = token) {
    const call = request(app).post('/snailpay/recharge').send(body);
    return authToken ? call.set('Authorization', `Bearer ${authToken}`) : call;
}

beforeAll(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-06-15T12:00:00Z'));
});

afterAll(() => {
    vi.useRealTimers();
});

beforeEach(async () => {
    ({ user, token } = await registerUser());
});

describe('POST /snailpay/recharge - authentication', () => {
    it('rejects a request without a token', async () => {
        const response = await recharge(APPROVED_CARD, null);

        expect(response.status).toBe(401);
        expect(response.body).toEqual({ message: 'Unauthorized' });
    });

    it('rejects a malformed token', async () => {
        const response = await recharge(APPROVED_CARD, 'not-a-jwt');

        expect(response.status).toBe(401);
        expect(response.body).toEqual({ message: 'Unauthorized' });
    });

    it('rejects a token signed with another secret', async () => {
        const forged = jwt.sign({ id: 'fake', email: 'fake@mail.com', name: 'Fake', balance: 0 }, 'other_secret');

        const response = await recharge(APPROVED_CARD, forged);

        expect(response.status).toBe(401);
    });

    it('rejects an expired token', async () => {
        const expired = jwt.sign(
            { id: 'fake', email: 'fake@mail.com', name: 'Fake', balance: 0 },
            'test_secret',
            { expiresIn: -10 },
        );

        const response = await recharge(APPROVED_CARD, expired);

        expect(response.status).toBe(401);
    });

    it('returns 404 when the token user no longer exists', async () => {
        const orphan = jwt.sign({ id: 'missing-user', email: 'ghost@mail.com', name: 'Ghost', balance: 0 }, 'test_secret');

        const response = await recharge(APPROVED_CARD, orphan);

        expect(response.status).toBe(404);
        expect(response.body).toEqual({ message: 'User not found' });
    });
});

describe('POST /snailpay/recharge - invalid data', () => {
    it.each([
        ['missing', undefined],
        ['zero', 0],
        ['negative', -50],
        ['a string', '100'],
    ])('rejects an amount that is %s', async (_case, amount) => {
        const response = await recharge({ ...APPROVED_CARD, amount });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ message: 'Invalid amount' });
    });

    it.each([
        ['cardNumber', 'too short', { cardNumber: '123456789012' }, 'Número de tarjeta inválido'],
        ['cardNumber', 'with letters', { cardNumber: '1234abcd12341234' }, 'Número de tarjeta inválido'],
        ['cardName', 'missing', { cardName: undefined }, 'Nombre del titular requerido'],
        ['cardName', 'one character', { cardName: 'A' }, 'Nombre del titular requerido'],
        ['cardExpiration', 'without slash', { cardExpiration: '1226' }, 'Formato esperado MM/AA'],
        ['cardExpiration', 'with four-digit year', { cardExpiration: '12/2026' }, 'Formato esperado MM/AA'],
        ['cardExpiration', 'with month 13', { cardExpiration: '13/26' }, 'Mes inválido'],
        ['cardExpiration', 'with month 00', { cardExpiration: '00/26' }, 'Mes inválido'],
        ['cardExpiration', 'already expired', { cardExpiration: '05/26' }, 'La tarjeta está vencida'],
        ['cardCVV', 'too short', { cardCVV: '12' }, 'CVV inválido'],
        ['cardCVV', 'with letters', { cardCVV: '12a' }, 'CVV inválido'],
    ])('rejects %s %s', async (field, _case, overrides, message) => {
        const response = await recharge({ ...APPROVED_CARD, ...overrides });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Datos de tarjeta inválidos');
        expect(response.body.errors).toEqual({ [field]: message });
    });

    it('reports every invalid card field at once', async () => {
        const response = await recharge({ amount: 100 });

        expect(response.status).toBe(400);
        expect(Object.keys(response.body.errors).sort()).toEqual(['cardCVV', 'cardExpiration', 'cardName', 'cardNumber']);
    });

    it('accepts a card that expires in the current month', async () => {
        const response = await recharge({ ...APPROVED_CARD, cardNumber: '4000000000000002', cardExpiration: '06/26' });

        expect(response.status).not.toBe(400);
    });

    it('does not change the balance when the data is invalid', async () => {
        await recharge({ ...APPROVED_CARD, cardCVV: 'x' });

        expect(await currentBalance(user)).toBe(0);
    });
});

describe('POST /snailpay/recharge - test cards', () => {
    it('approves the valid card and adds the amount to the balance', async () => {
        const response = await recharge(APPROVED_CARD);

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            payer_id: expect.any(String),
            payer_email: user.email,
            id: expect.stringMatching(/^sim_/),
            status: 'success',
            status_detail: 'approved',
            date_created: expect.any(String),
            transaction_amount: 100,
            authorization_code: expect.any(String),
            reference: expect.any(String),
        });
        expect(await currentBalance(user)).toBe(100);
    });

    it('accumulates consecutive approved recharges', async () => {
        await recharge({ ...APPROVED_CARD, amount: 50 });
        await recharge({ ...APPROVED_CARD, amount: 25.5 });

        expect(await currentBalance(user)).toBe(75.5);
    });

    it.each([
        ['approved card with a wrong CVV', { ...APPROVED_CARD, cardCVV: '111' }, 'incorrect_cvv'],
        ['approved card with a wrong expiration', { ...APPROVED_CARD, cardExpiration: '11/26' }, 'incorrect_expiry'],
        ['4000000000000002', { ...APPROVED_CARD, ...OTHER_CARD_DATA, cardNumber: '4000000000000002' }, 'card_declined'],
        ['4000000000009995', { ...APPROVED_CARD, ...OTHER_CARD_DATA, cardNumber: '4000000000009995' }, 'insufficient_funds'],
        ['1234123412341231', { ...APPROVED_CARD, cardNumber: '1234123412341231' }, 'incorrect_cvv'],
        ['an unknown card', { ...APPROVED_CARD, ...OTHER_CARD_DATA, cardNumber: '5555555555554444' }, 'unknown_card'],
        ['the approved card with spaces', { ...APPROVED_CARD, cardNumber: '1234 1234 1234 1234' }, 'unknown_card'],
    ])('declines %s with 402 %s', async (_case, body, statusDetail) => {
        const response = await recharge(body);

        expect(response.status).toBe(402);
        expect(response.body).toMatchObject({
            payer_email: user.email,
            status: 'failed',
            status_detail: statusDetail,
            transaction_amount: 100,
        });
        expect(response.body).not.toHaveProperty('authorization_code');
        expect(await currentBalance(user)).toBe(0);
    });

    it('returns 500 service_error for 4242424242424242', async () => {
        const response = await recharge({ ...APPROVED_CARD, ...OTHER_CARD_DATA, cardNumber: '4242424242424242' });

        expect(response.status).toBe(500);
        expect(response.body).toMatchObject({ status: 'error', status_detail: 'service_error' });
        expect(await currentBalance(user)).toBe(0);
    });
});
