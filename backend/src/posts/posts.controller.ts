import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CommentsService } from '../comments/comments.service';
import { LikesService } from '../likes/likes.service';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUserId } from '../auth/decorators/current-user-id.decorator';

@ApiTags('Posts')
@Controller('posts')
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly commentsService: CommentsService,
    private readonly likesService: LikesService,
  ) {}

  @Get('hashtag/:tag')
  @ApiOperation({ summary: 'Search posts by hashtag' })
  async searchByHashtag(@Param('tag') tag: string) {
    const posts = await this.postsService.searchByHashtag(tag);
    const withCounts = await Promise.all(
      posts.map(async (p) => ({
        ...p,
        commentsCount: await this.commentsService.countForPost(p.id),
        likesCount: await this.likesService.countForPost(p.id),
      })),
    );
    return withCounts as any;
  }

  @Get()
  @ApiOperation({ summary: 'List recent posts (includes commentsCount)' })
  async list() {
    const posts = await this.postsService.listRecent();
    const withCounts = await Promise.all(
      posts.map(async (p) => ({
        ...p,
        commentsCount: await this.commentsService.countForPost(p.id),
        likesCount: await this.likesService.countForPost(p.id),
      })),
    );
    return withCounts as any;
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Create a new post' })
  async create(@CurrentUserId() userId: string, @Body() dto: CreatePostDto) {
    return this.postsService.createByUserId(userId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get post by ID (includes commentsCount)' })
  async findById(@Param('id') id: string) {
    const post = await this.postsService.findById(id);
    const commentsCount = await this.commentsService.countForPost(id);
    const likesCount = await this.likesService.countForPost(id);
    return { ...post, commentsCount, likesCount } as any;
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Update a post' })
  async update(@CurrentUserId() userId: string, @Param('id') id: string, @Body() dto: UpdatePostDto) {
    return this.postsService.update(userId, id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Delete a post' })
  async remove(@CurrentUserId() userId: string, @Param('id') id: string) {
    await this.postsService.remove(userId, id);
    return { success: true };
  }
}


