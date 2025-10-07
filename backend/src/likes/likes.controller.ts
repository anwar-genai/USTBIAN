import { Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LikesService } from './likes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUserId } from '../auth/decorators/current-user-id.decorator';

@ApiTags('Likes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('bearer')
@Controller('posts/:postId/likes')
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  @Post()
  @ApiOperation({ summary: 'Like a post' })
  async like(@CurrentUserId() userId: string, @Param('postId') postId: string) {
    return this.likesService.likeByUserId(userId, postId);
  }

  @Delete()
  @ApiOperation({ summary: 'Unlike a post' })
  async unlike(@CurrentUserId() userId: string, @Param('postId') postId: string) {
    return this.likesService.unlikeByUserId(userId, postId);
  }

  @Get()
  @ApiOperation({ summary: 'Check if current user liked this post' })
  async checkLike(@CurrentUserId() userId: string, @Param('postId') postId: string) {
    return this.likesService.checkLike(userId, postId);
  }
}
