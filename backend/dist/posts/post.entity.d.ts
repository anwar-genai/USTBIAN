import { User } from '../users/user.entity';
export declare class PostEntity {
    id: string;
    author: User;
    content: string;
    mediaUrls?: string[] | null;
    createdAt: Date;
    updatedAt: Date;
}
