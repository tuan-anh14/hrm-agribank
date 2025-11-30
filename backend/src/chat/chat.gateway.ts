import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards, Logger } from '@nestjs/common';
import { WsJwtAuthGuard } from './guards/ws-jwt-auth.guard';
import { ChatService } from './chat.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { ChatClientEvents, ChatServerEvents } from './constants/chat.events';

@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
  namespace: '/chat',
})
@UseGuards(WsJwtAuthGuard)
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private connectedUsers = new Map<string, string>(); // userId -> socketId

  constructor(private readonly chatService: ChatService) {}

  async handleConnection(client: Socket) {
    const user = client.data.user;
    if (user) {
      this.connectedUsers.set(user.id, client.id);
      this.logger.log(`User ${user.username} connected (socket: ${client.id})`);

      // Join user vào các room mà họ có quyền truy cập
      const roomsData = await this.chatService.getRoomsForUser(user.id, user.role);

      // Join room chat chung
      if (roomsData.company) {
        client.join(`room:${roomsData.company.id}`);
        this.logger.debug(`User ${user.username} joined room: ${roomsData.company.id}`);
      }

      // Join room phòng ban
      roomsData.departments.forEach((room) => {
        client.join(`room:${room.id}`);
        this.logger.debug(`User ${user.username} joined room: ${room.id}`);
      });

      // Join room chat 1-1
      roomsData.directMessages.forEach((room) => {
        client.join(`room:${room.id}`);
        this.logger.debug(`User ${user.username} joined room: ${room.id}`);
      });

      // Broadcast user online status
      this.server.emit(ChatServerEvents.USER_STATUS_CHANGED, {
        userId: user.id,
        status: 'online',
        timestamp: new Date(),
      });
    }
  }

  async handleDisconnect(client: Socket) {
    const user = client.data.user;
    if (user) {
      this.connectedUsers.delete(user.id);
      this.logger.log(`User ${user.username} disconnected (socket: ${client.id})`);

      // Broadcast user offline status
      this.server.emit(ChatServerEvents.USER_STATUS_CHANGED, {
        userId: user.id,
        status: 'offline',
        timestamp: new Date(),
      });
    }
  }

  /**
   * Xử lý gửi tin nhắn mới
   */
  @SubscribeMessage(ChatClientEvents.MESSAGE_SEND)
  async handleMessage(
    @MessageBody() dto: CreateMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    const user = client.data.user;
    if (!user) {
      client.emit(ChatServerEvents.MESSAGE_ERROR, {
        error: 'Không tìm thấy thông tin người dùng',
      });
      return;
    }

    try {
      const message = await this.chatService.createMessage(dto, user.id);

      // Gửi tin nhắn đến tất cả clients trong room
      this.server.to(`room:${message.roomId}`).emit(ChatServerEvents.MESSAGE_NEW, message);

      this.logger.debug(
        `Message sent by ${user.username} in room ${message.roomId}`,
      );

      return { success: true, message };
    } catch (error) {
      this.logger.error(`Error sending message: ${error.message}`, error.stack);
      client.emit(ChatServerEvents.MESSAGE_ERROR, {
        error: error.message || 'Không thể gửi tin nhắn',
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * Xử lý join vào room cụ thể
   */
  @SubscribeMessage(ChatClientEvents.ROOM_JOIN)
  async handleJoinRoom(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const user = client.data.user;
    if (!user) {
      return { success: false, error: 'Không tìm thấy thông tin người dùng' };
    }

    try {
      client.join(`room:${data.roomId}`);
      this.logger.debug(`User ${user.username} joined room: ${data.roomId}`);

      // Đánh dấu tất cả tin nhắn trong room đã đọc
      await this.chatService.markRoomAsRead(data.roomId, user.id);

      client.emit(ChatServerEvents.ROOM_JOINED, { roomId: data.roomId });
      return { success: true, roomId: data.roomId };
    } catch (error) {
      this.logger.error(`Error joining room: ${error.message}`, error.stack);
      return { success: false, error: error.message };
    }
  }

  /**
   * Xử lý leave khỏi room
   */
  @SubscribeMessage(ChatClientEvents.ROOM_LEAVE)
  async handleLeaveRoom(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const user = client.data.user;
    if (!user) {
      return { success: false, error: 'Không tìm thấy thông tin người dùng' };
    }

    try {
      client.leave(`room:${data.roomId}`);
      this.logger.debug(`User ${user.username} left room: ${data.roomId}`);

      client.emit(ChatServerEvents.ROOM_LEFT, { roomId: data.roomId });
      return { success: true, roomId: data.roomId };
    } catch (error) {
      this.logger.error(`Error leaving room: ${error.message}`, error.stack);
      return { success: false, error: error.message };
    }
  }

  /**
   * Xử lý typing indicator - bắt đầu typing
   */
  @SubscribeMessage(ChatClientEvents.TYPING_START)
  handleTyping(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const user = client.data.user;
    if (!user) {
      return;
    }

    // Gửi typing indicator đến tất cả clients khác trong room (không gửi cho chính mình)
    client.to(`room:${data.roomId}`).emit(ChatServerEvents.TYPING_USER, {
      roomId: data.roomId,
      userId: user.id,
      username: user.username,
    });
  }

  /**
   * Xử lý typing indicator - dừng typing
   */
  @SubscribeMessage(ChatClientEvents.TYPING_STOP)
  handleTypingStop(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const user = client.data.user;
    if (!user) {
      return;
    }

    // Gửi typing stop đến tất cả clients khác trong room
    client.to(`room:${data.roomId}`).emit(ChatServerEvents.TYPING_STOP, {
      roomId: data.roomId,
      userId: user.id,
    });
  }
}

