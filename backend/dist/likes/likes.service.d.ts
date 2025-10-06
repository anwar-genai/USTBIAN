import { Repository } from 'typeorm';
import { LikeEntity } from './like.entity';
import { User } from '../users/user.entity';
import { PostEntity } from '../posts/post.entity';
import { RealtimeGateway } from '../realtime/realtime.gateway';
export declare class LikesService {
    private readonly likesRepository;
    private readonly postsRepository;
    private readonly realtime;
    constructor(likesRepository: Repository<LikeEntity>, postsRepository: Repository<PostEntity>, realtime: RealtimeGateway);
    like(user: User, postId: string): Promise<{
        success: boolean;
    }>;
    unlike(user: User, postId: string): Promise<{
        success: boolean;
    }>;
    likeByUserId(userId: string, postId: string): Promise<{
        success: boolean;
    }>;
    unlikeByUserId(userId: string, postId: string): Promise<{
        success: boolean;
    }>;
}
