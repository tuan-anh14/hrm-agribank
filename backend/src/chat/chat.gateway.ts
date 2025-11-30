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
      this.logger.warn(`Message send rejected: No user data for client ${client.id}`);
      client.emit(ChatServerEvents.MESSAGE_ERROR, {
        error: 'Không tìm thấy thông tin người dùng',
      });
      return;
    }

    try {
      this.logger.log(
        `📨 Message send request from ${user.username} (${user.id}) in room ${dto.roomId}: ${dto.content.substring(0, 50)}...`,
      );

      const message = await this.chatService.createMessage(dto, user.id);

      // Gửi tin nhắn đến tất cả clients trong room (bao gồm cả người gửi)
      const roomName = `room:${message.roomId}`;
      const clientsInRoom = await this.server.in(roomName).fetchSockets();
      
      this.logger.log(
        `📤 Broadcasting message to room ${roomName}, ${clientsInRoom.length} clients`,
      );

      // Broadcast đến tất cả clients trong room
      this.server.to(roomName).emit(ChatServerEvents.MESSAGE_NEW, message);

      // Cũng gửi lại cho chính người gửi để đảm bảo consistency (nếu họ chưa nhận từ optimistic update)
      client.emit(ChatServerEvents.MESSAGE_NEW, message);

      this.logger.debug(
        `✅ Message sent by ${user.username} in room ${message.roomId} to ${clientsInRoom.length} clients`,
      );

      return { success: true, message };
    } catch (error) {
      this.logger.error(`❌ Error sending message: ${error.message}`, error.stack);
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
    @MessageBody() data: { roomId: string } | string,
    @ConnectedSocket() client: Socket,
  ) {
    const user = client.data.user;
    if (!user) {
      this.logger.warn(`Room join rejected: No user data for client ${client.id}`);
      return { success: false, error: 'Không tìm thấy thông tin người dùng' };
    }

    try {
      // Handle both { roomId: string } and string formats
      const roomId = typeof data === 'string' ? data : data.roomId;
      
      if (!roomId) {
        this.logger.warn(`Room join rejected: No roomId provided by ${user.username}`);
        return { success: false, error: 'Room ID không được cung cấp' };
      }

      const roomName = `room:${roomId}`;
      client.join(roomName);
      
      const clientsInRoom = await this.server.in(roomName).fetchSockets();
      this.logger.log(
        `✅ User ${user.username} (${user.id}) joined room ${roomName}, total clients: ${clientsInRoom.length}`,
      );

      // Đánh dấu tất cả tin nhắn trong room đã đọc
      await this.chatService.markRoomAsRead(roomId, user.id);

      client.emit(ChatServerEvents.ROOM_JOINED, { roomId });
      return { success: true, roomId };
    } catch (error) {
      this.logger.error(`❌ Error joining room: ${error.message}`, error.stack);
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

