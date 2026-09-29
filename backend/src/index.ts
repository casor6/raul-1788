import express, { type Request, type Response } from 'express';
import AuthRouter from './services/Auth.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use('/auth', AuthRouter)

app.get('/', (req: Request, res: Response) => {
    res.send('Hello Snail Race!');
});

app.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}`);
});