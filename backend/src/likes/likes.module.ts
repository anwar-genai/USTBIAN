import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LikesService } from './likes.service';
import { LikesController } from './likes.controller';
import { MyLikesController } from './my-likes.controller';
import { LikeEntity } from './like.entity';
import { PostEntity } from '../posts/post.entity';
import { UsersModule } from '../users/users.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { NotificationsModule } from '../notifications/notifications.module';

import { User } from '../users/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([LikeEntity, PostEntity, User]),
    UsersModule,
    RealtimeModule,
    NotificationsModule,
  ],
  providers: [LikesService],
  controllers: [LikesController, MyLikesController],
})
export class LikesModule {}


