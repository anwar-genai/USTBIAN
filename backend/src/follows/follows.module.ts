import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FollowsService } from './follows.service';
import { FollowsController } from './follows.controller';
import { FollowEntity } from './follow.entity';
import { User } from '../users/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FollowEntity, User])],
  providers: [FollowsService],
  controllers: [FollowsController],
  exports: [FollowsService],
})
export class FollowsModule {}

