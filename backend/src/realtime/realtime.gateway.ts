import { OnGatewayConnection, OnGatewayDisconnect, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({ cors: { origin: true, credentials: true } })
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection() {}
  handleDisconnect() {}

  emitLikeAdded(postId: string, userId: string) {
    this.server.emit('post.like.added', { postId, userId });
  }

  emitLikeRemoved(postId: string, userId: string) {
    this.server.emit('post.like.removed', { postId, userId });
  }

  emitNotification(recipientId: string, notification: any) {
    this.server.emit(`notification.${recipientId}`, notification);
  }

  emitNotificationDeleted(recipientId: string, notificationId: string) {
    this.server.emit(`notification.deleted.${recipientId}`, { notificationId });
  }

  // Comments realtime
  emitCommentAdded(postId: string, comment: any) {
    this.server.emit(`comment.added.${postId}`, comment);
  }

  emitCommentDeleted(postId: string, commentId: string) {
    this.server.emit(`comment.deleted.${postId}`, { commentId });
  }
}


