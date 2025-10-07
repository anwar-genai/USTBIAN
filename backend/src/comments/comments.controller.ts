import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUserId } from '../auth/decorators/current-user-id.decorator';
import { CreateCommentDto } from './dto/create-comment.dto';

@ApiTags('Comments')
@Controller('posts/:postId/comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get()
  @ApiOperation({ summary: 'List comments for a post' })
  list(@Param('postId') postId: string) {
    return this.commentsService.listForPost(postId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @Post()
  @ApiOperation({ summary: 'Add a comment to a post (supports replies via parentId)' })
  add(@CurrentUserId() userId: string, @Param('postId') postId: string, @Body() dto: CreateCommentDto) {
    return this.commentsService.addComment(postId, userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @Delete(':commentId')
  @ApiOperation({ summary: 'Delete a comment (author only)' })
  async delete(@CurrentUserId() userId: string, @Param('commentId') commentId: string) {
    await this.commentsService.deleteComment(userId, commentId);
    return { success: true };
  }
}


