import { Router } from 'express';
import type { NextFunction, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { repo } from '../repository/UserLocalRepository.js';
import type { User } from '../interfaces/IUser.js';
import { randomUUID } from 'crypto';
import jwt from 'jsonwebtoken';

const router = Router();
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const JWT_SECRET = process.env.JWT_SECRET || 'replace_with_a_secret';


router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body ?? {};
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
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
        name: email,
        createdAt: new Date().toISOString(),
        balance: 0,
    };

    const newUser = await repo.create(user);
    return res.status(201).json(newUser);
});

router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body ?? {};
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
    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '24h' });
    return res.status(200).json({ token });
});

export default router;
