import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { PostEntity } from './post.entity';
import { UsersModule } from '../users/users.module';
import { CommentsModule } from '../comments/comments.module';
import { LikesModule } from '../likes/likes.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { User } from '../users/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([PostEntity, User]),
    UsersModule,
    CommentsModule,
    LikesModule,
    forwardRef(() => NotificationsModule),
    RealtimeModule,
  ],
  providers: [PostsService],
  controllers: [PostsController],
  exports: [PostsService],
})
export class PostsModule {}


