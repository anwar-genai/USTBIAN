import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LikesService } from './likes.service';
import { LikesController } from './likes.controller';
import { LikeEntity } from './like.entity';
import { PostEntity } from '../posts/post.entity';
import { UsersModule } from '../users/users.module';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [TypeOrmModule.forFeature([LikeEntity, PostEntity]), UsersModule, RealtimeModule],
  providers: [LikesService],
  controllers: [LikesController],
})
export class LikesModule {}


