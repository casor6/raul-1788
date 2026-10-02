import { useState } from 'react';
import { ApiError } from '../api/http';
import { payRequest, type PayData, type PayResponse, type PayStatusDetail } from '../api/paymentService';
import { useAuth } from '../context/AuthContext';

const statusMessages: Record<PayStatusDetail, string> = {
    approved: 'Pago aprobado',
    card_declined: 'La tarjeta fue rechazada',
    insufficient_funds: 'Fondos insuficientes',
    incorrect_cvv: 'El CVV es incorrecto',
    incorrect_expiry: 'La fecha de expiración es incorrecta',
    unknown_card: 'Tarjeta no reconocida',
    service_error: 'El servicio de pagos no está disponible, intenta más tarde',
};

const saveLastPayment = (payment: unknown) =>
    localStorage.setItem('lastPayment', JSON.stringify(payment));

function getErrorMessage(data: unknown): string | null {
    if (typeof data !== 'object' || data === null) return null;

    if ('errors' in data && typeof data.errors === 'object' && data.errors !== null) {
        const [first] = Object.values(data.errors);
        if (typeof first === 'string') return first;
    }

    if ('status_detail' in data) {
        return statusMessages[data.status_detail as PayStatusDetail] ?? null;
    }

    return null;
}

export function useRecharge() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { addBalance } = useAuth();

    const recharge = async (data: PayData): Promise<PayResponse | null> => {
        setLoading(true);
        setError('');
        try {
            const res = await payRequest(data);
            saveLastPayment(res);
            addBalance(data.amount);
            return res;
        } catch (err) {
            const errorMessage = err instanceof ApiError ? getErrorMessage(err.data) : null;
            setError(errorMessage ?? (err instanceof Error ? err.message : 'No se pudo procesar el pago'));
            return null;
        } finally {
            setLoading(false);
        }
    };

    return { recharge, loading, error };
}