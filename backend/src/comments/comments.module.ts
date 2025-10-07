import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { CommentEntity } from './comment.entity';
import { PostEntity } from '../posts/post.entity';
import { User } from '../users/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CommentEntity, PostEntity, User])],
  providers: [CommentsService],
  controllers: [CommentsController],
  exports: [CommentsService],
})
export class CommentsModule {}


