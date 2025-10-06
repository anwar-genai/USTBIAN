import { User } from '../users/user.entity';
import { PostEntity } from '../posts/post.entity';
export declare class LikeEntity {
    id: string;
    user: User;
    post: PostEntity;
    createdAt: Date;
}
