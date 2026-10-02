import { randomUUID } from 'crypto';
import { rm } from 'fs/promises';
import os from 'os';
import path from 'path';
import { afterAll } from 'vitest';

const usersFile = path.join(os.tmpdir(), `users-${randomUUID()}.json`);
process.env.USERS_FILE = usersFile;

afterAll(async () => {
    await rm(usersFile, { force: true });
});
