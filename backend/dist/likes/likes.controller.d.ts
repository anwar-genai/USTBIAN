import { LikesService } from './likes.service';
export declare class LikesController {
    private readonly likesService;
    constructor(likesService: LikesService);
    like(userId: string, postId: string): Promise<{
        success: boolean;
    }>;
    unlike(userId: string, postId: string): Promise<{
        success: boolean;
    }>;
}
