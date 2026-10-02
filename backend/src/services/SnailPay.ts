import { Router } from 'express';
import type { NextFunction, Request, Response } from 'express';
import { requireAuth } from '../middlewares/RequireAuth.js';
import { repo } from '../repository/UserLocalRepository.js';
import { validateCard } from '../utils/CardValidation.js';
import { paymentGateway } from './ProcessPayment.js';

const router = Router();

type RechargeBody = {
    cardNumber: string;
    cardName: string;
    cardExpiration: string;
    cardCVV: string;
    amount: number;
}

router.use(requireAuth);
router.post('/recharge', async (req: Request, res: Response) => {
    const body = req.body as RechargeBody;
    const { amount, cardCVV, cardNumber } = body;

    if (!amount || typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ message: 'Invalid amount' });
    }

    const validation = validateCard(body);
    if (!validation.ok) {
        res.status(400).json({ message: 'Datos de tarjeta inválidos', errors: validation.errors });
        return;
    }
    if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await repo.findById(req.user.id);
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    const result = await paymentGateway.charge({ card: cardNumber, cvv: cardCVV, amount: amount, expMonth: validation.card.expMonth, expYear: validation.card.expYear });
    const payerInfo = {
        payer_id: user.id,
        payer_email: user.email,
        card_number: cardNumber,
        card_cvv: cardCVV,
        ...result,
    }
    if (result.status === 'failed') {
        res.status(402).json({ ...payerInfo });
        return;
    }
    if (result.status === 'error') {
        res.status(500).json({ ...payerInfo });
        return;
    }

    await repo.addBalance(user.id, amount);
    return res.status(200).json({ ...payerInfo });
})

export default router;