import { Controller, Delete, Param, Post, UseGuards } from '@nestjs/common';
import { LikesService } from './likes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUserId } from '../auth/decorators/current-user-id.decorator';

@UseGuards(JwtAuthGuard)
@Controller('posts/:postId/likes')
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  @Post()
  async like(@CurrentUserId() userId: string, @Param('postId') postId: string) {
    return this.likesService.likeByUserId(userId, postId);
  }

  @Delete()
  async unlike(@CurrentUserId() userId: string, @Param('postId') postId: string) {
    return this.likesService.unlikeByUserId(userId, postId);
  }
}


