import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
export declare class PostsController {
    private readonly postsService;
    constructor(postsService: PostsService);
    list(): Promise<import("./post.entity").PostEntity[]>;
    create(userId: string, dto: CreatePostDto): Promise<import("./post.entity").PostEntity>;
    findById(id: string): Promise<import("./post.entity").PostEntity>;
    update(userId: string, id: string, dto: UpdatePostDto): Promise<import("./post.entity").PostEntity>;
    remove(userId: string, id: string): Promise<{
        success: boolean;
    }>;
}
