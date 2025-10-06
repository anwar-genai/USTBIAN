import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PostEntity } from './post.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { User } from '../users/user.entity';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(PostEntity)
    private readonly postsRepository: Repository<PostEntity>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(author: User, dto: CreatePostDto): Promise<PostEntity> {
    const post = this.postsRepository.create({ author, content: dto.content, mediaUrls: dto.mediaUrls });
    return await this.postsRepository.save(post);
  }

  async createByUserId(userId: string, dto: CreatePostDto): Promise<PostEntity> {
    const author = await this.usersRepository.findOne({ where: { id: userId } });
    if (!author) throw new NotFoundException('User not found');
    return this.create(author, dto);
  }

  async findById(id: string): Promise<PostEntity> {
    const post = await this.postsRepository.findOne({ where: { id } });
    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  async listRecent(limit = 20): Promise<PostEntity[]> {
    return await this.postsRepository.find({ order: { createdAt: 'DESC' }, take: limit });
  }

  async update(authorId: string, id: string, dto: UpdatePostDto): Promise<PostEntity> {
    const post = await this.findById(id);
    if (post.author.id !== authorId) throw new UnauthorizedException('Not the author');
    Object.assign(post, dto);
    return await this.postsRepository.save(post);
  }

  async remove(authorId: string, id: string): Promise<void> {
    const post = await this.findById(id);
    if (post.author.id !== authorId) throw new UnauthorizedException('Not the author');
    await this.postsRepository.remove(post);
  }
}


