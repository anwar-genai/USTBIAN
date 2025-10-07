import { Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FollowsService } from './follows.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUserId } from '../auth/decorators/current-user-id.decorator';

@ApiTags('Follows')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('bearer')
@Controller('users/:userId/follow')
export class FollowsController {
  constructor(private readonly followsService: FollowsService) {}

  @Post()
  @ApiOperation({ summary: 'Follow a user' })
  follow(@CurrentUserId() followerId: string, @Param('userId') followingId: string) {
    return this.followsService.follow(followerId, followingId);
  }

  @Delete()
  @ApiOperation({ summary: 'Unfollow a user' })
  unfollow(@CurrentUserId() followerId: string, @Param('userId') followingId: string) {
    return this.followsService.unfollow(followerId, followingId);
  }

  @Get('followers')
  @ApiOperation({ summary: 'Get followers of a user' })
  getFollowers(@Param('userId') userId: string) {
    return this.followsService.getFollowers(userId);
  }

  @Get('following')
  @ApiOperation({ summary: 'Get users followed by a user' })
  getFollowing(@Param('userId') userId: string) {
    return this.followsService.getFollowing(userId);
  }
}

