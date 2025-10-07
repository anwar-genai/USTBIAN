import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommentEntity } from './comment.entity';
import { PostEntity } from '../posts/post.entity';
import { User } from '../users/user.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(CommentEntity)
    private readonly commentsRepository: Repository<CommentEntity>,
    @InjectRepository(PostEntity)
    private readonly postsRepository: Repository<PostEntity>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly realtime: RealtimeGateway,
  ) {}

  async addComment(postId: string, authorId: string, dto: CreateCommentDto): Promise<CommentEntity> {
    const post = await this.postsRepository.findOne({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');
    const author = await this.usersRepository.findOne({ where: { id: authorId } });
    if (!author) throw new NotFoundException('User not found');

    let parent: CommentEntity | null = null;
    if (dto.parentId) {
      parent = await this.commentsRepository.findOne({ where: { id: dto.parentId } });
      if (!parent) throw new NotFoundException('Parent comment not found');
    }

    const comment = this.commentsRepository.create({ content: dto.content, post, author, parent });
    const saved = await this.commentsRepository.save(comment);
    this.realtime.emitCommentAdded(postId, { ...saved, post: undefined });
    return saved;
  }

  async deleteComment(authorId: string, commentId: string): Promise<void> {
    const c = await this.commentsRepository.findOne({ where: { id: commentId }, relations: ['author'] });
    if (!c) return;
    if (c.author.id !== authorId) throw new UnauthorizedException('Cannot delete others comments');
    await this.commentsRepository.remove(c);
    this.realtime.emitCommentDeleted(c.post.id, commentId);
  }

  async listForPost(postId: string, limit = 50, offset = 0): Promise<CommentEntity[]> {
    return await this.commentsRepository.find({
      where: { post: { id: postId } },
      order: { createdAt: 'ASC' },
      take: limit,
      skip: offset,
    });
  }

  async countForPost(postId: string): Promise<number> {
    return await this.commentsRepository.count({ where: { post: { id: postId } } });
  }
}


