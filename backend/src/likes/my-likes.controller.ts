import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LikesService } from './likes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUserId } from '../auth/decorators/current-user-id.decorator';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LikeEntity } from './like.entity';

@ApiTags('Likes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('bearer')
@Controller('likes/my')
export class MyLikesController {
  constructor(
    @InjectRepository(LikeEntity)
    private readonly likesRepository: Repository<LikeEntity>,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all post IDs liked by current user' })
  async getMyLikes(@CurrentUserId() userId: string) {
    const likes = await this.likesRepository.find({
      where: { user: { id: userId } },
      relations: ['post'],
    });
    return { likedPostIds: likes.map((like) => like.post.id) };
  }
}

