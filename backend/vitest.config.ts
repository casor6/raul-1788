import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        include: ['tests/**/*.test.ts'],
        setupFiles: ['tests/setup.ts'],
        env: {
            JWT_SECRET: 'test_secret',
            PAYMENT_DELAY_MS: '0',
        },
    },
});
