export interface User {
    id: string;
    name: string;
    email: string;
    password: string;
    createdAt: string;
    balance: number;
}

export type PublicUser = Omit<User, 'password'>;

export interface UserRepository {
    findByEmail(email: string): Promise<User | null>;
    findById(id: string): Promise<User | null>;
    create(user: User): Promise<User>;
    addBalance(id: string, amount: number): Promise<User | null>;
}