import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUserId } from '../auth/decorators/current-user-id.decorator';

@ApiTags('Posts')
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  @ApiOperation({ summary: 'List recent posts' })
  list() {
    return this.postsService.listRecent();
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Create a new post' })
  async create(@CurrentUserId() userId: string, @Body() dto: CreatePostDto) {
    return this.postsService.createByUserId(userId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get post by ID' })
  findById(@Param('id') id: string) {
    return this.postsService.findById(id);
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


