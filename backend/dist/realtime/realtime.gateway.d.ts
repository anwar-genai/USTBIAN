import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server } from 'socket.io';
export declare class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
    server: Server;
    handleConnection(): void;
    handleDisconnect(): void;
    emitLikeAdded(postId: string, userId: string): void;
    emitLikeRemoved(postId: string, userId: string): void;
}
