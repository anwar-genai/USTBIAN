import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LikeEntity } from './like.entity';
import { User } from '../users/user.entity';
import { PostEntity } from '../posts/post.entity';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Injectable()
export class LikesService {
  constructor(
    @InjectRepository(LikeEntity)
    private readonly likesRepository: Repository<LikeEntity>,
    @InjectRepository(PostEntity)
    private readonly postsRepository: Repository<PostEntity>,
    private readonly realtime: RealtimeGateway,
  ) {}

  async like(user: User, postId: string) {
    const post = await this.postsRepository.findOne({ where: { id: postId } });
    if (!post) throw new ConflictException('Post not found');
    const like = this.likesRepository.create({ user, post });
    try {
      await this.likesRepository.insert(like);
    } catch (e) {
      throw new ConflictException('Already liked');
    }
    this.realtime.emitLikeAdded(postId, user.id);
    return { success: true };
  }

  async unlike(user: User, postId: string) {
    const existing = await this.likesRepository.findOne({ where: { user: { id: user.id }, post: { id: postId } } });
    if (!existing) return { success: true };
    await this.likesRepository.remove(existing);
    this.realtime.emitLikeRemoved(postId, user.id);
    return { success: true };
  }

  async likeByUserId(userId: string, postId: string) {
    const user = { id: userId } as User; // minimal reference
    return this.like(user, postId);
  }

  async unlikeByUserId(userId: string, postId: string) {
    const user = { id: userId } as User;
    return this.unlike(user, postId);
  }
}


