export interface CardData {
    number: string;
    name: string;
    expMonth: number;
    expYear: number;
    cvv: string;
}

export type CardValidationResult =
    | { ok: true; card: CardData }
    | { ok: false; errors: Record<string, string> };


export function validateCard(input: Record<string, unknown>, now = new Date()): CardValidationResult {
    const errors: Record<string, string> = {};

    const number =
        typeof input.cardNumber === 'string' ? input.cardNumber.replace(/[\s-]/g, '') : '';
    if (!/^\d{13,19}$/.test(number)) {
        errors.cardNumber = 'Número de tarjeta inválido';
    }

    const name = typeof input.cardName === 'string' ? input.cardName.trim() : '';
    if (name.length < 2) {
        errors.cardName = 'Nombre del titular requerido';
    }

    let expMonth = 0;
    let expYear = 0;
    const exp =
        typeof input.cardExpiration === 'string'
            ? /^(\d{2})\/(\d{2})$/.exec(input.cardExpiration.trim())
            : null;

    if (!exp) {
        errors.cardExpiration = 'Formato esperado MM/AA';
    } else {
        expMonth = Number(exp[1]);
        expYear = 2000 + Number(exp[2]);

        if (expMonth < 1 || expMonth > 12) {
            errors.cardExpiration = 'Mes inválido';
        } else {
            const current = now.getFullYear() * 12 + now.getMonth();
            const expiry = expYear * 12 + (expMonth - 1);
            if (expiry < current) errors.cardExpiration = 'La tarjeta está vencida';
        }
        expYear = Number(exp[2]);
    }

    const cvv = typeof input.cardCVV === 'string' ? input.cardCVV.trim() : '';
    if (!/^\d{3,4}$/.test(cvv)) {
        errors.cardCVV = 'CVV inválido';
    }

    if (Object.keys(errors).length > 0) return { ok: false, errors };
    return { ok: true, card: { number, name, expMonth, expYear, cvv } };
}