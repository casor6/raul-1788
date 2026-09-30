import { randomUUID } from 'crypto';

type StatusTx = 'success' | 'failed' | 'error';
type SuccessCode = 'approved';
type DeclineCode =
    | 'card_declined'
    | 'insufficient_funds'
    | 'incorrect_cvv'
    | 'incorrect_expiry'
    | 'unknown_card';
type ErrorCode = 'service_error'
type Outcome = { approved: true } | { approved: false; code: DeclineCode | ErrorCode; };
type ChargeResult = { id: string; status: StatusTx; status_detail: DeclineCode | SuccessCode | ErrorCode; date_created: string; transaction_amount: number; authorization_code?: string; reference?: string };
type PayCard = {
    card: string,
    cvv: string,
    amount: number,
    expMonth: number,
    expYear: number,
}
interface PaymentGateway {
    charge(card: PayCard): Promise<ChargeResult>;
}

interface TestCard {
    outcome: Outcome;
    cvv?: string;
    expMonth?: number;
    expYear?: number;
}

const TEST_CARDS: Record<string, TestCard> = {
    '1234123412341234': { outcome: { approved: true }, cvv: '543', expMonth: 12, expYear: 26 },
    '4000000000000002': { outcome: { approved: false, code: 'card_declined' } },
    '4000000000009995': { outcome: { approved: false, code: 'insufficient_funds' } },
    '1234123412341231': { outcome: { approved: false, code: 'incorrect_cvv' } },
    '4242424242424242': { outcome: { approved: false, code: 'service_error' } },
};

export class MockPaymentGateway {

    async charge(data: PayCard): Promise<ChargeResult> {
        const { card, cvv, amount, expMonth, expYear } = data;
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const testCard = TEST_CARDS[card];
        if (!testCard) {
            return { status: 'failed', status_detail: 'unknown_card', id: randomUUID(), date_created: new Date().toISOString(), transaction_amount: amount };
        }

        if (!testCard.outcome.approved && testCard.outcome.code === 'service_error') {
            return { status: 'error', status_detail: 'service_error', id: randomUUID(), date_created: new Date().toISOString(), transaction_amount: amount };
        }

        if (testCard.cvv !== undefined && testCard.cvv !== cvv) {
            return { status: 'failed', status_detail: 'incorrect_cvv', id: randomUUID(), date_created: new Date().toISOString(), transaction_amount: amount };
        }

        if (testCard.expMonth !== undefined && testCard.expYear !== undefined && (testCard.expMonth !== expMonth || testCard.expYear !== expYear)) {
            return { status: 'failed', status_detail: 'incorrect_expiry', id: randomUUID(), date_created: new Date().toISOString(), transaction_amount: amount };
        }

        if (!testCard.outcome.approved) return {
            status: 'failed',
            status_detail: testCard.outcome.code,
            id: `sim_${randomUUID()}`,
            date_created: new Date().toISOString(),
            transaction_amount: amount,
        };
        return {
            status: 'success',
            status_detail: 'approved',
            id: `sim_${randomUUID()}`,
            date_created: new Date().toISOString(),
            authorization_code: randomUUID(),
            reference: randomUUID(),
            transaction_amount: amount,
        };
    }
}

export const paymentGateway: PaymentGateway = new MockPaymentGateway();