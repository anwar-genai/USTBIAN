import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationEntity, NotificationType } from './notification.entity';
import { User } from '../users/user.entity';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notificationsRepository: Repository<NotificationEntity>,
    private readonly realtime: RealtimeGateway,
  ) {}

  async create(
    recipientId: string,
    type: NotificationType,
    actorId?: string,
    message?: string,
    metadata?: Record<string, any>,
  ) {
    const recipient = { id: recipientId } as User;
    const actor = actorId ? ({ id: actorId } as User) : null;
    const notification = this.notificationsRepository.create({
      recipient,
      actor,
      type,
      message,
      metadata,
      read: false,
    });
    const saved = await this.notificationsRepository.save(notification);
    this.realtime.emitNotification(recipientId, saved);
    return saved;
  }

  async getForUser(userId: string, limit = 50) {
    return await this.notificationsRepository.find({
      where: { recipient: { id: userId } },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async markAsRead(userId: string, notificationId: string) {
    const notification = await this.notificationsRepository.findOne({
      where: { id: notificationId, recipient: { id: userId } },
    });
    if (!notification) return { success: false };
    notification.read = true;
    await this.notificationsRepository.save(notification);
    return { success: true };
  }

  async markAllAsRead(userId: string) {
    await this.notificationsRepository.update({ recipient: { id: userId }, read: false }, { read: true });
    return { success: true };
  }

  async deleteLikeNotification(recipientId: string, actorId: string, postId: string) {
    // Find ALL like notifications from this actor to this recipient (no matter how many)
    const notifications = await this.notificationsRepository.find({
      where: {
        recipient: { id: recipientId },
        actor: { id: actorId },
        type: NotificationType.LIKE,
      },
    });

    // Filter by postId in metadata and delete ALL matches
    const toDelete = notifications.filter((n) => n.metadata?.postId === postId);
    
    if (toDelete.length > 0) {
      console.log(`Deleting ${toDelete.length} notification(s) for post ${postId}`);
      
      // Capture IDs before deletion
      const idsToDelete = toDelete.map((n) => n.id);
      
      // Delete from database
      await this.notificationsRepository.remove(toDelete);
      
      // Emit realtime deletion event for each deleted notification
      idsToDelete.forEach((id) => {
        console.log(`Emitting deletion for notification ID: ${id}`);
        this.realtime.emitNotificationDeleted(recipientId, id);
      });
    }

    return { success: true, deleted: toDelete.length };
  }
}

