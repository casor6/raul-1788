import { Router } from 'express';
import type { NextFunction, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { repo } from '../repository/UserLocalRepository.js';
import type { User } from '../interfaces/IUser.js';
import { randomUUID } from 'crypto';
import { signToken } from '../shared/jwt.js';

const router = Router();
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

type RegisterBody = {
    name: string;
    email: string;
    password: string;
}

type LoginBody = {
    email: string;
    password: string;
}

router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
    const body = req.body as RegisterBody;
    const { name, email, password } = body;
    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Name, email and password are required' });
    }
    const normalizedEmail = email.trim().toLowerCase();

    if (!EMAIL_REGEX.test(normalizedEmail)) {
        return res.status(400).json({ message: 'Invalid email format' });
    }

    if (!password || password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const userExists = await repo.findByEmail(normalizedEmail);

    if (userExists) {
        return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user: User = {
        id: randomUUID(),
        email: normalizedEmail,
        password: hashedPassword,
        name,
        createdAt: new Date().toISOString(),
        balance: 0,
    };

    const newUser = await repo.create(user);
    const token = signToken({ id: newUser.id, email: newUser.email, name: newUser.name, balance: newUser.balance });
    return res.status(201).json({ token });
});

router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
    const body = req.body as LoginBody;
    const { email, password } = body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }
    const normalizedEmail = email.trim().toLowerCase();
    const user = await repo.findByEmail(normalizedEmail);
    if (!user) {
        return res.status(401).json({ message: 'Invalid email or password' });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = signToken({ id: user.id, email: user.email, name: user.name, balance: user.balance });
    return res.status(200).json({ token });
});

export default router;
