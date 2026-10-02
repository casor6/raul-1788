import express, { type Request, type Response } from 'express';
import AuthRouter from './services/Auth.js';
import SnailPayRouter from './services/SnailPay.js';
import cors from 'cors';

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

app.use('/auth', AuthRouter)
app.use('/snailpay', SnailPayRouter)

app.get('/', (req: Request, res: Response) => {
    res.send('OK');
});

export default app;
