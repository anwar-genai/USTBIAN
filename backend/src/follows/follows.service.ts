import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FollowEntity } from './follow.entity';
import { User } from '../users/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/notification.entity';

@Injectable()
export class FollowsService {
  constructor(
    @InjectRepository(FollowEntity)
    private readonly followsRepository: Repository<FollowEntity>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async follow(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new ConflictException('Cannot follow yourself');
    }
    const follower = await this.usersRepository.findOne({ where: { id: followerId } });
    const following = await this.usersRepository.findOne({ where: { id: followingId } });
    if (!follower || !following) throw new NotFoundException('User not found');

    const existing = await this.followsRepository.findOne({
      where: { follower: { id: followerId }, following: { id: followingId } },
    });
    if (existing) throw new ConflictException('Already following');

    const follow = this.followsRepository.create({ follower, following });
    await this.followsRepository.save(follow);

    // Create notification for the user being followed
    await this.notificationsService.create(
      followingId,
      NotificationType.FOLLOW,
      followerId,
      `${follower.displayName} started following you`,
      { followerId }
    );

    return { success: true };
  }

  async unfollow(followerId: string, followingId: string) {
    const existing = await this.followsRepository.findOne({
      where: { follower: { id: followerId }, following: { id: followingId } },
    });
    if (!existing) return { success: true };
    await this.followsRepository.remove(existing);
    return { success: true };
  }

  async getFollowers(userId: string): Promise<User[]> {
    const follows = await this.followsRepository.find({
      where: { following: { id: userId } },
    });
    return follows.map((f) => f.follower);
  }

  async getFollowing(userId: string): Promise<User[]> {
    const follows = await this.followsRepository.find({
      where: { follower: { id: userId } },
    });
    return follows.map((f) => f.following);
  }
}

