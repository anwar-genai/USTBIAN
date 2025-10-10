import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SavedPostsService } from './saved-posts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUserId } from '../auth/decorators/current-user-id.decorator';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SavedPostEntity } from './saved-post.entity';
import { CommentsService } from '../comments/comments.service';
import { LikesService } from '../likes/likes.service';

@ApiTags('Saved Posts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('bearer')
@Controller('saved-posts/my')
export class MySavedPostsController {
  constructor(
    @InjectRepository(SavedPostEntity)
    private readonly savedPostsRepository: Repository<SavedPostEntity>,
    private readonly commentsService: CommentsService,
    private readonly likesService: LikesService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all posts saved by current user' })
  async getMySavedPosts(@CurrentUserId() userId: string) {
    const savedPosts = await this.savedPostsRepository.find({
      where: { user: { id: userId } },
      relations: ['post', 'post.author'],
      order: { createdAt: 'DESC' },
    });

    // Add counts like in posts controller
    const postsWithCounts = await Promise.all(
      savedPosts.map(async (sp) => ({
        ...sp.post,
        commentsCount: await this.commentsService.countForPost(sp.post.id),
        likesCount: await this.likesService.countForPost(sp.post.id),
        savedAt: sp.createdAt,
      })),
    );

    return postsWithCounts;
  }

  @Get('ids')
  @ApiOperation({ summary: 'Get all post IDs saved by current user' })
  async getMySavedPostIds(@CurrentUserId() userId: string) {
    const savedPosts = await this.savedPostsRepository.find({
      where: { user: { id: userId } },
      relations: ['post'],
    });
    return { savedPostIds: savedPosts.map((sp) => sp.post.id) };
  }
}

