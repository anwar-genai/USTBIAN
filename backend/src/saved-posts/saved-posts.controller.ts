import { Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SavedPostsService } from './saved-posts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUserId } from '../auth/decorators/current-user-id.decorator';

@ApiTags('Saved Posts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('bearer')
@Controller('posts/:postId/saved')
export class SavedPostsController {
  constructor(private readonly savedPostsService: SavedPostsService) {}

  @Post()
  @ApiOperation({ summary: 'Save a post (bookmark)' })
  async save(@CurrentUserId() userId: string, @Param('postId') postId: string) {
    return this.savedPostsService.saveByUserId(userId, postId);
  }

  @Delete()
  @ApiOperation({ summary: 'Unsave a post (remove bookmark)' })
  async unsave(@CurrentUserId() userId: string, @Param('postId') postId: string) {
    return this.savedPostsService.unsaveByUserId(userId, postId);
  }

  @Get()
  @ApiOperation({ summary: 'Check if current user saved this post' })
  async checkSaved(@CurrentUserId() userId: string, @Param('postId') postId: string) {
    return this.savedPostsService.checkSaved(userId, postId);
  }
}

