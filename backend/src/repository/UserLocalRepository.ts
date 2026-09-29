import { promises as fs } from 'fs';
import path from 'path';
import type { User, UserRepository } from '../interfaces/IUser.js';

const FILE = path.resolve(process.cwd(), 'data', 'users.json');

async function readUsers(): Promise<User[]> {
    try {
        const data = await fs.readFile(FILE, 'utf-8');
        return JSON.parse(data).users || [];
    } catch {
        return [];
    }
}

async function writeUsers(users: User[]): Promise<void> {
    await fs.mkdir(path.dirname(FILE), { recursive: true });
    await fs.writeFile(FILE, JSON.stringify({ users }, null, 2), 'utf-8');
}

export const repo: UserRepository = {
    findByEmail: async (email: string) => {
        const users = await readUsers();
        return users.find((u) => u.email === email) || null;
    },
    findById: async (id: string) => {
        const users = await readUsers();
        return users.find((u) => u.id === id) || null;
    },
    create: async (user: User) => {
        const users = await readUsers();
        users.push(user);
        await writeUsers(users);
        return user;
    },
};
