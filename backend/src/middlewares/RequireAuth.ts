import type { NextFunction, Request, Response } from "express";
import { verifyToken } from "../shared/jwt.js";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    const decoded = verifyToken(token);
    if (!decoded) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    req.user = decoded;
    next();
}