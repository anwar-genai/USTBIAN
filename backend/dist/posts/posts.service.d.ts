import { Repository } from 'typeorm';
import { PostEntity } from './post.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { User } from '../users/user.entity';
export declare class PostsService {
    private readonly postsRepository;
    private readonly usersRepository;
    constructor(postsRepository: Repository<PostEntity>, usersRepository: Repository<User>);
    create(author: User, dto: CreatePostDto): Promise<PostEntity>;
    createByUserId(userId: string, dto: CreatePostDto): Promise<PostEntity>;
    findById(id: string): Promise<PostEntity>;
    listRecent(limit?: number): Promise<PostEntity[]>;
    update(authorId: string, id: string, dto: UpdatePostDto): Promise<PostEntity>;
    remove(authorId: string, id: string): Promise<void>;
}
