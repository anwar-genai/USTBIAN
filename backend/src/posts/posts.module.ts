import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { PostEntity } from './post.entity';
import { UsersModule } from '../users/users.module';
import { CommentsModule } from '../comments/comments.module';
import { LikesModule } from '../likes/likes.module';
import { User } from '../users/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PostEntity, User]), UsersModule, CommentsModule, LikesModule],
  providers: [PostsService],
  controllers: [PostsController],
})
export class PostsModule {}


