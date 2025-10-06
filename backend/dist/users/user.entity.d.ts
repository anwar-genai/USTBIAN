export declare class User {
    id: string;
    email: string;
    username: string;
    displayName: string;
    avatarUrl?: string | null;
    bio?: string | null;
    passwordHash: string;
    createdAt: Date;
    updatedAt: Date;
}
