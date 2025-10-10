import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SavedPostEntity } from './saved-post.entity';
import { User } from '../users/user.entity';
import { PostEntity } from '../posts/post.entity';

@Injectable()
export class SavedPostsService {
  constructor(
    @InjectRepository(SavedPostEntity)
    private readonly savedPostsRepository: Repository<SavedPostEntity>,
    @InjectRepository(PostEntity)
    private readonly postsRepository: Repository<PostEntity>,
  ) {}

  async save(user: User, postId: string) {
    const post = await this.postsRepository.findOne({ where: { id: postId } });
    if (!post) throw new ConflictException('Post not found');
    
    // Check if already saved
    const existing = await this.savedPostsRepository.findOne({
      where: { user: { id: user.id }, post: { id: postId } },
    });
    if (existing) {
      throw new ConflictException('Post already saved');
    }

    const savedPost = this.savedPostsRepository.create({ user, post });
    await this.savedPostsRepository.save(savedPost);

    return { success: true, message: 'Post saved successfully' };
  }

  async unsave(user: User, postId: string) {
    const existing = await this.savedPostsRepository.findOne({ 
      where: { user: { id: user.id }, post: { id: postId } },
    });
    if (!existing) return { success: true, message: 'Post not saved' };
    
    await this.savedPostsRepository.remove(existing);
    
    return { success: true, message: 'Post unsaved successfully' };
  }

  async saveByUserId(userId: string, postId: string) {
    const user = { id: userId } as User;
    return this.save(user, postId);
  }

  async unsaveByUserId(userId: string, postId: string) {
    const user = { id: userId } as User;
    return this.unsave(user, postId);
  }

  async checkSaved(userId: string, postId: string) {
    const existing = await this.savedPostsRepository.findOne({
      where: { user: { id: userId }, post: { id: postId } },
    });
    return { saved: !!existing };
  }

  async getSavedPostsForUser(userId: string): Promise<string[]> {
    const savedPosts = await this.savedPostsRepository.find({
      where: { user: { id: userId } },
      relations: ['post'],
      order: { createdAt: 'DESC' },
    });
    return savedPosts.map((sp) => sp.post.id);
  }

  async getSavedPostIdsForPosts(userId: string, postIds: string[]) {
    const savedPosts = await this.savedPostsRepository.find({
      where: postIds.map((postId) => ({ user: { id: userId }, post: { id: postId } })),
    });
    return savedPosts.map((sp) => sp.post.id);
  }
}

