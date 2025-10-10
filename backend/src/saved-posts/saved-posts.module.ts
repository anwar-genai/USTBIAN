import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SavedPostsService } from './saved-posts.service';
import { SavedPostsController } from './saved-posts.controller';
import { MySavedPostsController } from './my-saved-posts.controller';
import { SavedPostEntity } from './saved-post.entity';
import { PostEntity } from '../posts/post.entity';
import { User } from '../users/user.entity';
import { CommentsModule } from '../comments/comments.module';
import { LikesModule } from '../likes/likes.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SavedPostEntity, PostEntity, User]),
    CommentsModule,
    LikesModule,
  ],
  providers: [SavedPostsService],
  controllers: [SavedPostsController, MySavedPostsController],
  exports: [SavedPostsService],
})
export class SavedPostsModule {}

