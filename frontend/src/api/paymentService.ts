import { apiFetch } from './http';

type PayStatus = 'approved' | 'failed' | 'error';
export type PayStatusDetail = 'approved' | 'card_declined' | 'insufficient_funds' | 'incorrect_cvv' | 'incorrect_expiry' | 'unknown_card' | 'service_error';

export type PayResponse = { payer_id: string; payer_email: string; status: PayStatus; status_detail: PayStatusDetail; id: string; date_created: string; transaction_amount: number };
export type PayData = { amount: number; cardNumber: string; cardName: string; cardExpiration: string; cardCVV: string };

export const payRequest = (data: PayData) =>
    apiFetch<PayResponse>('/snailpay/recharge', {
        method: 'POST',
        body: JSON.stringify(data),
    });