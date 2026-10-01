import type { TokenPayload } from '../shared/jwt.js';

declare global {
    namespace Express {
        interface Request {
            user?: TokenPayload;
        }
    }
}

export { };