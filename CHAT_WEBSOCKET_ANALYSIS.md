# PHÂN TÍCH VÀ KẾ HOẠCH TRIỂN KHAI CHAT REALTIME WEBSOCKET

## 📋 ĐÁNH GIÁ TỔNG QUAN

### ✅ DỰ ÁN PHÙ HỢP VỚI CHỨC NĂNG CHAT REALTIME

**Lý do:**

1. **Backend đã có sẵn WebSocket packages:**
   - ✅ `@nestjs/platform-socket.io` (v11.1.8)
   - ✅ `@nestjs/websockets` (v11.1.8)
   - Không cần cài thêm dependencies

2. **Kiến trúc phù hợp:**
   - ✅ NestJS hỗ trợ WebSocket Gateway tốt
   - ✅ Đã có hệ thống authentication với JWT
   - ✅ Có role-based access control (ADMIN, HR, EMPLOYEE)
   - ✅ Có hệ thống notification sẵn có (có thể tích hợp)

3. **Database schema phù hợp:**
   - ✅ Employee có `departmentId` (quan hệ với Department)
   - ✅ Có thể mở rộng schema để lưu chat messages
   - ✅ PostgreSQL hỗ trợ tốt cho real-time data

4. **Frontend sẵn sàng:**
   - ✅ React với Ant Design UI
   - ✅ Có thể tích hợp socket.io-client
   - ✅ Đã có pattern xử lý real-time (notification polling)

---

## 🎯 MÔ TẢ CHỨC NĂNG

### 3 LOẠI CHAT CẦN TRIỂN KHAI:

#### 1. 💬 **Chat chung toàn công ty (Agribank)**
- **Tất cả nhân viên** trong công ty có thể tham gia
- Chat công khai, mọi người đều thấy
- Phù hợp cho thông báo chung, trao đổi công việc liên phòng ban

#### 2. 🏢 **Chat theo phòng ban**
- **HRM (ADMIN/HR)** có thể chat với **tất cả các phòng ban**
- **Phòng ban** có thể chat với **HRM** (không chat với phòng ban khác)
- **Nhân viên** trong phòng ban có thể xem/gửi tin nhắn của phòng ban mình
- Mỗi phòng ban có 1 room riêng với HRM

#### 3. 👤 **Chat cá nhân (1-1)**
- **Bất kỳ nhân viên nào** có thể chat riêng với nhân viên khác
- Chat riêng tư, chỉ 2 người thấy
- Tự động tạo room khi bắt đầu chat lần đầu

### Tính năng cần có:
1. ✅ Gửi/nhận tin nhắn real-time
2. ✅ Hiển thị danh sách rooms (theo loại: công ty, phòng ban, cá nhân)
3. ✅ Hiển thị lịch sử tin nhắn
4. ✅ Đánh dấu đã đọc/chưa đọc
5. ✅ Thông báo khi có tin nhắn mới
6. ✅ Typing indicator (optional)
7. ✅ Online/Offline status (optional)
8. ✅ Tìm kiếm nhân viên để chat 1-1
9. ✅ Filter rooms theo loại

---

## 📦 CẦN LÀM GÌ ĐỂ TRIỂN KHAI

### PHASE 1: BACKEND - Database Schema

#### 1.1. Cập nhật Prisma Schema

**Thêm các model mới vào `backend/prisma/schema.prisma`:**

```prisma
// Thêm vào enum NotificationType
enum NotificationType {
  SYSTEM
  PAYROLL
  ATTENDANCE
  REQUEST
  SHIFT
  CHAT  // Thêm mới
}

// Enum loại phòng chat
enum ChatRoomType {
  COMPANY_WIDE     // Chat chung toàn công ty (Agribank)
  DEPARTMENT_HRM   // Chat giữa phòng ban và HRM
  DIRECT_MESSAGE   // Chat 1-1 giữa cá nhân
}

// Model ChatRoom - Phòng chat
model ChatRoom {
  id          String   @id @default(uuid())
  departmentId String? // null = chat công ty hoặc 1-1
  name        String   // Tên phòng chat
  type        ChatRoomType @default(DEPARTMENT_HRM)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  department  Department? @relation(fields: [departmentId], references: [id])
  messages    ChatMessage[]
  participants ChatRoomParticipant[] // Cho chat 1-1 và quản lý quyền truy cập
  
  @@unique([departmentId, type]) // Mỗi department chỉ có 1 room DEPARTMENT_HRM
}

// Model ChatRoomParticipant - Quản lý người tham gia room
// Quan trọng cho chat 1-1 và kiểm soát quyền truy cập
model ChatRoomParticipant {
  id          String   @id @default(uuid())
  roomId      String
  employeeId  String
  joinedAt    DateTime @default(now())
  lastReadAt  DateTime? // Thời điểm đọc tin nhắn cuối cùng
  
  room        ChatRoom  @relation(fields: [roomId], references: [id], onDelete: Cascade)
  employee    Employee  @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  
  @@unique([roomId, employeeId]) // Mỗi employee chỉ có 1 record trong 1 room
  @@index([employeeId])
  @@index([roomId])
}

// Model ChatMessage - Tin nhắn
model ChatMessage {
  id          String   @id @default(uuid())
  roomId      String
  senderId    String   // Employee ID
  content     String
  isRead      Boolean  @default(false)
  readAt      DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  room        ChatRoom  @relation(fields: [roomId], references: [id], onDelete: Cascade)
  sender      Employee  @relation("ChatMessageSender", fields: [senderId], references: [id])
  
  @@index([roomId, createdAt])
  @@index([senderId])
}

// Cập nhật model Department
model Department {
  // ... existing fields
  chatRoom    ChatRoom?
}

// Cập nhật model Employee
model Employee {
  // ... existing fields
  sentMessages ChatMessage[] @relation("ChatMessageSender")
  chatRooms    ChatRoomParticipant[] // Rooms mà employee tham gia
}
```

#### 1.2. Tạo Migration

```bash
cd backend
npx prisma migrate dev --name add_chat_feature
npx prisma generate
```

---

### PHASE 2: BACKEND - WebSocket Gateway

#### 2.1. Tạo Chat Module

**Tạo cấu trúc thư mục:**
```
backend/src/chat/
├── chat.module.ts
├── chat.gateway.ts
├── chat.service.ts
├── chat.controller.ts
├── dto/
│   ├── create-message.dto.ts
│   ├── create-room.dto.ts
│   └── query-message.dto.ts
└── guards/
    └── ws-jwt-auth.guard.ts
```

#### 2.2. WebSocket JWT Authentication Guard

**File: `backend/src/chat/guards/ws-jwt-auth.guard.ts`**

```typescript
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Socket } from 'socket.io';

@Injectable()
export class WsJwtAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient();
    const token = this.extractTokenFromHeader(client);
    
    if (!token) {
      client.disconnect();
      return false;
    }

    try {
      const secret = this.configService.get<string>('JWT_ACCESS_TOKEN');
      const payload = await this.jwtService.verifyAsync(token, { secret });
      client.data.user = payload;
      return true;
    } catch {
      client.disconnect();
      return false;
    }
  }

  private extractTokenFromHeader(client: Socket): string | undefined {
    const authHeader = client.handshake.headers.authorization;
    return authHeader?.split(' ')[1]; // Bearer <token>
  }
}
```

#### 2.3. Chat Service

**File: `backend/src/chat/chat.service.ts`**

```typescript
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { QueryMessageDto } from './dto/query-message.dto';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  // Tạo hoặc lấy chat room cho department (DEPARTMENT_HRM)
  async getOrCreateDepartmentRoom(departmentId: string) {
    let room = await this.prisma.chatRoom.findFirst({
      where: { 
        departmentId,
        type: 'DEPARTMENT_HRM',
      },
      include: { department: true },
    });

    if (!room) {
      const department = await this.prisma.department.findUnique({
        where: { id: departmentId },
      });
      if (!department) {
        throw new NotFoundException('Department not found');
      }

      room = await this.prisma.chatRoom.create({
        data: {
          departmentId,
          name: `Phòng ${department.name}`,
          type: 'DEPARTMENT_HRM',
        },
        include: { department: true },
      });
    }
    return room;
  }

  // Tạo hoặc lấy room chat chung toàn công ty
  async getOrCreateCompanyRoom() {
    let room = await this.prisma.chatRoom.findFirst({
      where: { 
        type: 'COMPANY_WIDE',
        departmentId: null,
      },
    });

    if (!room) {
      room = await this.prisma.chatRoom.create({
        data: {
          departmentId: null,
          name: 'Chat chung Agribank',
          type: 'COMPANY_WIDE',
        },
      });
    }
    return room;
  }

  // Tạo hoặc lấy room chat 1-1 giữa 2 người
  async getOrCreateDirectMessageRoom(userId1: string, userId2: string) {
    // Sắp xếp IDs để đảm bảo tính nhất quán
    const [id1, id2] = [userId1, userId2].sort();
    
    // Tìm room 1-1 đã tồn tại giữa 2 người
    const existingRoom = await this.prisma.chatRoom.findFirst({
      where: {
        type: 'DIRECT_MESSAGE',
        participants: {
          every: {
            employeeId: { in: [id1, id2] },
          },
        },
      },
      include: {
        participants: true,
      },
    });

    // Kiểm tra xem room có đúng 2 participants không
    if (existingRoom && existingRoom.participants.length === 2) {
      const participantIds = existingRoom.participants.map(p => p.employeeId).sort();
      if (participantIds[0] === id1 && participantIds[1] === id2) {
        return existingRoom;
      }
    }

    // Tạo room mới
    const employee1 = await this.prisma.employee.findUnique({ where: { id: id1 } });
    const employee2 = await this.prisma.employee.findUnique({ where: { id: id2 } });
    
    if (!employee1 || !employee2) {
      throw new NotFoundException('Employee not found');
    }

    const room = await this.prisma.chatRoom.create({
      data: {
        departmentId: null,
        name: `${employee1.fullName} & ${employee2.fullName}`,
        type: 'DIRECT_MESSAGE',
        participants: {
          create: [
            { employeeId: id1 },
            { employeeId: id2 },
          ],
        },
      },
      include: {
        participants: {
          include: {
            employee: {
              select: {
                id: true,
                fullName: true,
                employeeCode: true,
              },
            },
          },
        },
      },
    });

    return room;
  }

  // Lấy danh sách rooms mà user có quyền truy cập
  async getRoomsForUser(userId: string, userRole: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: userId },
      include: { department: true },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    const isAdminOrHR = userRole === 'ADMIN' || userRole === 'HR';

    // 1. Chat chung toàn công ty - tất cả mọi người đều thấy
    const companyRoom = await this.getOrCreateCompanyRoom();

    // 2. Chat theo phòng ban
    let departmentRooms = [];
    if (isAdminOrHR) {
      // ADMIN/HR thấy tất cả phòng ban
      departmentRooms = await this.prisma.chatRoom.findMany({
        where: { type: 'DEPARTMENT_HRM' },
        include: {
          department: true,
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            include: {
              sender: {
                select: {
                  id: true,
                  fullName: true,
                },
              },
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      });
    } else if (employee.departmentId) {
      // Employee chỉ thấy room của phòng ban mình
      const deptRoom = await this.getOrCreateDepartmentRoom(employee.departmentId);
      departmentRooms = [deptRoom];
    }

    // 3. Chat 1-1 - lấy tất cả rooms mà user tham gia
    const directMessageRooms = await this.prisma.chatRoom.findMany({
      where: {
        type: 'DIRECT_MESSAGE',
        participants: {
          some: {
            employeeId: userId,
          },
        },
      },
      include: {
        participants: {
          include: {
            employee: {
              select: {
                id: true,
                fullName: true,
                employeeCode: true,
              },
            },
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: {
            sender: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Format lại để frontend dễ sử dụng
    return {
      company: {
        ...companyRoom,
        lastMessage: companyRoom.messages?.[0] || null,
      },
      departments: departmentRooms.map(room => ({
        ...room,
        lastMessage: room.messages?.[0] || null,
      })),
      directMessages: directMessageRooms.map(room => {
        // Tìm người còn lại trong chat 1-1 (không phải mình)
        const otherParticipant = room.participants.find(p => p.employeeId !== userId);
        return {
          ...room,
          otherParticipant: otherParticipant?.employee || null,
          lastMessage: room.messages?.[0] || null,
        };
      }),
    };
  }

  // Tạo tin nhắn mới
  async createMessage(dto: CreateMessageDto, senderId: string) {
    // Kiểm tra quyền truy cập room
    const room = await this.prisma.chatRoom.findUnique({
      where: { id: dto.roomId },
      include: { 
        department: true,
        participants: true,
      },
    });

    if (!room) {
      throw new NotFoundException('Chat room not found');
    }

    const sender = await this.prisma.employee.findUnique({
      where: { id: senderId },
    });

    if (!sender) {
      throw new NotFoundException('Sender not found');
    }

    const account = await this.prisma.account.findUnique({
      where: { employeeId: senderId },
    });

    const isAdminOrHR = account?.role === 'ADMIN' || account?.role === 'HR';

    // Kiểm tra quyền truy cập theo loại room
    if (room.type === 'COMPANY_WIDE') {
      // Chat chung: tất cả mọi người đều có thể gửi
      // Không cần kiểm tra
    } else if (room.type === 'DEPARTMENT_HRM') {
      // Chat phòng ban: chỉ HRM hoặc nhân viên trong phòng ban đó
      if (!isAdminOrHR && room.departmentId !== sender.departmentId) {
        throw new ForbiddenException('Bạn không có quyền gửi tin nhắn vào phòng này');
      }
    } else if (room.type === 'DIRECT_MESSAGE') {
      // Chat 1-1: chỉ 2 người trong room mới được gửi
      const isParticipant = room.participants.some(p => p.employeeId === senderId);
      if (!isParticipant) {
        throw new ForbiddenException('Bạn không có quyền gửi tin nhắn vào phòng này');
      }
    }

    const message = await this.prisma.chatMessage.create({
      data: {
        roomId: dto.roomId,
        senderId,
        content: dto.content,
      },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            employeeCode: true,
            department: {
              select: { id: true, name: true },
            },
          },
        },
        room: {
          include: {
            department: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    // Cập nhật updatedAt của room
    await this.prisma.chatRoom.update({
      where: { id: dto.roomId },
      data: { updatedAt: new Date() },
    });

    return message;
  }

  // Lấy lịch sử tin nhắn
  async getMessages(roomId: string, query: QueryMessageDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      this.prisma.chatMessage.findMany({
        where: { roomId },
        include: {
          sender: {
            select: {
              id: true,
              fullName: true,
              employeeCode: true,
              department: {
                select: { id: true, name: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.chatMessage.count({ where: { roomId } }),
    ]);

    return {
      data: messages.reverse(), // Đảo ngược để hiển thị từ cũ đến mới
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Đánh dấu tin nhắn đã đọc
  async markAsRead(messageId: string, userId: string) {
    const message = await this.prisma.chatMessage.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Chỉ đánh dấu đọc nếu không phải người gửi
    if (message.senderId !== userId) {
      return this.prisma.chatMessage.update({
        where: { id: messageId },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });
    }

    return message;
  }

  // Đánh dấu tất cả tin nhắn trong room đã đọc
  async markRoomAsRead(roomId: string, userId: string) {
    return this.prisma.chatMessage.updateMany({
      where: {
        roomId,
        senderId: { not: userId }, // Không phải tin nhắn của chính mình
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }
}
```

#### 2.4. WebSocket Gateway

**File: `backend/src/chat/chat.gateway.ts`**

```typescript
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
      this.connectedUsers.set(user.sub, client.id);
      this.logger.log(`User ${user.username} connected (socket: ${client.id})`);

      // Join user vào các room mà họ có quyền truy cập
      const roomsData = await this.chatService.getRoomsForUser(user.sub, user.role);
      
      // Join room chat chung
      if (roomsData.company) {
        client.join(`room:${roomsData.company.id}`);
      }
      
      // Join room phòng ban
      roomsData.departments.forEach((room) => {
        client.join(`room:${room.id}`);
      });
      
      // Join room chat 1-1
      roomsData.directMessages.forEach((room) => {
        client.join(`room:${room.id}`);
      });
    }
  }

  async handleDisconnect(client: Socket) {
    const user = client.data.user;
    if (user) {
      this.connectedUsers.delete(user.sub);
      this.logger.log(`User ${user.username} disconnected`);
    }
  }

  @SubscribeMessage('message:send')
  async handleMessage(
    @MessageBody() dto: CreateMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    const user = client.data.user;
    
    try {
      const message = await this.chatService.createMessage(dto, user.sub);

      // Gửi tin nhắn đến tất cả clients trong room
      this.server.to(`room:${message.roomId}`).emit('message:new', message);

      // Gửi notification đến các user khác trong room (nếu họ không online)
      // Có thể tích hợp với NotificationService

      return { success: true, message };
    } catch (error) {
      this.logger.error('Error sending message:', error);
      client.emit('message:error', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('room:join')
  async handleJoinRoom(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const user = client.data.user;
    client.join(`room:${data.roomId}`);
    
    // Đánh dấu tất cả tin nhắn trong room đã đọc
    await this.chatService.markRoomAsRead(data.roomId, user.sub);
    
    client.emit('room:joined', { roomId: data.roomId });
  }

  @SubscribeMessage('room:leave')
  async handleLeaveRoom(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(`room:${data.roomId}`);
    client.emit('room:left', { roomId: data.roomId });
  }

  @SubscribeMessage('typing:start')
  handleTyping(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const user = client.data.user;
    client.to(`room:${data.roomId}`).emit('typing:user', {
      roomId: data.roomId,
      userId: user.sub,
      username: user.username,
    });
  }

  @SubscribeMessage('typing:stop')
  handleTypingStop(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const user = client.data.user;
    client.to(`room:${data.roomId}`).emit('typing:stop', {
      roomId: data.roomId,
      userId: user.sub,
    });
  }
}
```

#### 2.5. Chat Controller (REST API)

**File: `backend/src/chat/chat.controller.ts`**

```typescript
import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { Roles } from '@/auth/decorator/roles.decorator';
import { GetUser } from '@/auth/decorator/get-user.decorator';
import { ChatService } from './chat.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { QueryMessageDto } from './dto/query-message.dto';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('rooms')
  async getRooms(@GetUser() user: any) {
    return this.chatService.getRoomsForUser(user.id, user.role);
  }

  @Post('rooms/direct-message/:otherUserId')
  async createDirectMessageRoom(
    @Param('otherUserId') otherUserId: string,
    @GetUser() user: any,
  ) {
    return this.chatService.getOrCreateDirectMessageRoom(user.id, otherUserId);
  }

  @Get('rooms/:roomId/messages')
  async getMessages(
    @Param('roomId') roomId: string,
    @Query() query: QueryMessageDto,
  ) {
    return this.chatService.getMessages(roomId, query);
  }

  @Post('rooms/:roomId/messages')
  async createMessage(
    @Param('roomId') roomId: string,
    @Body() dto: CreateMessageDto,
    @GetUser() user: any,
  ) {
    return this.chatService.createMessage(
      { ...dto, roomId },
      user.id,
    );
  }

  @Post('messages/:messageId/read')
  async markAsRead(
    @Param('messageId') messageId: string,
    @GetUser() user: any,
  ) {
    return this.chatService.markAsRead(messageId, user.id);
  }

  @Post('rooms/:roomId/read')
  async markRoomAsRead(
    @Param('roomId') roomId: string,
    @GetUser() user: any,
  ) {
    return this.chatService.markRoomAsRead(roomId, user.id);
  }
}
```

#### 2.6. Chat Module

**File: `backend/src/chat/chat.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { PrismaModule } from '@/prisma/prisma.module';

@Module({
  imports: [PrismaModule, JwtModule, ConfigModule],
  controllers: [ChatController],
  providers: [ChatGateway, ChatService],
  exports: [ChatService],
})
export class ChatModule {}
```

#### 2.7. DTOs

**File: `backend/src/chat/dto/create-message.dto.ts`**

```typescript
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateMessageDto {
  @IsString()
  @IsNotEmpty()
  roomId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content: string;
}
```

**File: `backend/src/chat/dto/query-message.dto.ts`**

```typescript
import { IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryMessageDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
```

#### 2.8. Cập nhật App Module

**File: `backend/src/app.module.ts`**

```typescript
// Thêm import
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [
    // ... existing imports
    ChatModule,
  ],
  // ...
})
```

---

### PHASE 3: FRONTEND

#### 3.1. Cài đặt Dependencies

```bash
cd frontend
npm install socket.io-client
```

#### 3.2. Tạo Socket Service

**File: `frontend/src/services/socket.service.ts`**

```typescript
import { io, Socket } from 'socket.io-client';
import { getToken } from '@/utils/token.util';

class SocketService {
  private socket: Socket | null = null;
  private readonly baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  connect() {
    if (this.socket?.connected) {
      return this.socket;
    }

    const token = getToken();
    if (!token) {
      console.error('No token found');
      return null;
    }

    this.socket = io(`${this.baseURL}/chat`, {
      auth: {
        token: `Bearer ${token}`,
      },
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket() {
    return this.socket;
  }

  isConnected() {
    return this.socket?.connected ?? false;
  }
}

export const socketService = new SocketService();
```

#### 3.3. Tạo Chat Types

**File: `frontend/src/types/chat.ts`**

```typescript
export interface ChatRoom {
  id: string;
  departmentId: string | null;
  name: string;
  type: 'COMPANY_WIDE' | 'DEPARTMENT_HRM' | 'DIRECT_MESSAGE';
  department?: {
    id: string;
    name: string;
  };
  participants?: ChatRoomParticipant[];
  otherParticipant?: { // Cho chat 1-1: người còn lại
    id: string;
    fullName: string;
    employeeCode: string;
  };
  lastMessage?: ChatMessage | null;
  messages?: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface ChatRoomParticipant {
  id: string;
  roomId: string;
  employeeId: string;
  joinedAt: string;
  lastReadAt: string | null;
  employee?: {
    id: string;
    fullName: string;
    employeeCode: string;
  };
}

export interface ChatRoomsResponse {
  company: ChatRoom;
  departments: ChatRoom[];
  directMessages: ChatRoom[];
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  content: string;
  isRead: boolean;
  readAt: string | null;
  sender: {
    id: string;
    fullName: string;
    employeeCode: string;
    department?: {
      id: string;
      name: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

export interface ChatRoomListResponse {
  data: ChatRoom[];
  total: number;
}

export interface ChatMessageListResponse {
  data: ChatMessage[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
```

#### 3.4. Tạo Chat API Service

**File: `frontend/src/services/api.ts`** (thêm vào file hiện có)

```typescript
// Thêm imports
import type { ChatRoom, ChatMessage, ChatRoomListResponse, ChatMessageListResponse } from '@/types/chat';

// Thêm các API functions
export const getChatRoomsAPI = () => {
  const urlBackend = "/api/v1/chat/rooms";
  return axios.get<ChatRoomsResponse>(urlBackend);
};

export const createDirectMessageRoomAPI = (otherUserId: string) => {
  const urlBackend = `/api/v1/chat/rooms/direct-message/${otherUserId}`;
  return axios.post<IBackendRes<ChatRoom>>(urlBackend, {});
};

export const getChatMessagesAPI = (roomId: string, params?: { page?: number; limit?: number }) => {
  const urlBackend = `/api/v1/chat/rooms/${roomId}/messages`;
  return axios.get<ChatMessageListResponse>(urlBackend, { params });
};

export const createChatMessageAPI = (roomId: string, content: string) => {
  const urlBackend = `/api/v1/chat/rooms/${roomId}/messages`;
  return axios.post<IBackendRes<ChatMessage>>(urlBackend, { content });
};

export const markMessageAsReadAPI = (messageId: string) => {
  const urlBackend = `/api/v1/chat/messages/${messageId}/read`;
  return axios.post<IBackendRes<ChatMessage>>(urlBackend, {});
};

export const markRoomAsReadAPI = (roomId: string) => {
  const urlBackend = `/api/v1/chat/rooms/${roomId}/read`;
  return axios.post<IBackendRes<{ count: number }>>(urlBackend, {});
};
```

#### 3.5. Tạo Chat Components

**File: `frontend/src/pages/chat/index.tsx`**

```typescript
import { useState, useEffect, useRef } from 'react';
import { Layout, List, Input, Button, Avatar, Badge, Spin, Empty, Tabs, Modal, Select } from 'antd';
import { SendOutlined, UserOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { socketService } from '@/services/socket.service';
import {
  getChatRoomsAPI,
  getChatMessagesAPI,
  createChatMessageAPI,
  markRoomAsReadAPI,
  createDirectMessageRoomAPI,
  getAllEmployeesAPI,
} from '@/services/api';
import type { Employee } from '@/types/employee';
import type { ChatRoom, ChatMessage } from '@/types/chat';
import { formatRelativeTime } from '@/utils/date.util';
import './chat.scss';

const { Content, Sider } = Layout;
const { TextArea } = Input;

const ChatPage: React.FC = () => {
  const [roomsData, setRoomsData] = useState<ChatRoomsResponse | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [activeTab, setActiveTab] = useState<'company' | 'departments' | 'direct'>('company');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageContent, setMessageContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchEmployee, setSearchEmployee] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socket = socketService.getSocket();

  // Load rooms
  useEffect(() => {
    loadRooms();
    connectSocket();
  }, []);

  const connectSocket = () => {
    const socket = socketService.connect();
    if (!socket) return;

    socket.on('message:new', (message: ChatMessage) => {
      if (selectedRoom && message.roomId === selectedRoom.id) {
        setMessages((prev) => [...prev, message]);
        scrollToBottom();
      }
      // Cập nhật unread count trong danh sách rooms
      updateRoomUnreadCount(message.roomId);
    });

    socket.on('typing:user', (data: { roomId: string; userId: string; username: string }) => {
      // Handle typing indicator
      console.log(`${data.username} is typing...`);
    });
  };

  const loadRooms = async () => {
    try {
      const response = await getChatRoomsAPI();
      setRoomsData(response.data || response);
      
      // Auto-select company room nếu chưa có room nào được chọn
      if (!selectedRoom && response.data?.company) {
        setSelectedRoom(response.data.company);
        loadMessages(response.data.company.id);
      }
    } catch (error) {
      console.error('Error loading rooms:', error);
    }
  };

  const loadMessages = async (roomId: string) => {
    setLoading(true);
    try {
      const response = await getChatMessagesAPI(roomId, { limit: 50 });
      setMessages(response.data || []);
      scrollToBottom();
      
      // Đánh dấu đã đọc
      await markRoomAsReadAPI(roomId);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoomSelect = (room: ChatRoom) => {
    setSelectedRoom(room);
    loadMessages(room.id);
    
    // Join room via socket
    if (socket) {
      socket.emit('room:join', { roomId: room.id });
    }
  };

  const handleSendMessage = async () => {
    if (!messageContent.trim() || !selectedRoom || sending) return;

    setSending(true);
    try {
      // Gửi qua socket (sẽ tự động broadcast)
      if (socket) {
        socket.emit('message:send', {
          roomId: selectedRoom.id,
          content: messageContent.trim(),
        });
      }
      
      // Hoặc gửi qua REST API
      // await createChatMessageAPI(selectedRoom.id, messageContent.trim());
      
      setMessageContent('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const updateRoomUnreadCount = (roomId: string) => {
    // Logic để cập nhật unread count
    setRooms((prev) =>
      prev.map((room) =>
        room.id === roomId
          ? { ...room, unreadCount: (room.unreadCount || 0) + 1 }
          : room
      )
    );
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load danh sách nhân viên để tìm kiếm (cho chat 1-1)
  useEffect(() => {
    if (showNewChatModal) {
      loadEmployees();
    }
  }, [showNewChatModal]);

  const loadEmployees = async () => {
    try {
      const response = await getAllEmployeesAPI();
      setEmployees(response.data || response);
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const handleStartDirectChat = async (employeeId: string) => {
    try {
      const response = await createDirectMessageRoomAPI(employeeId);
      const newRoom = response.data;
      
      // Reload rooms để có room mới
      await loadRooms();
      
      // Chọn room vừa tạo
      setSelectedRoom(newRoom);
      loadMessages(newRoom.id);
      
      // Join room via socket
      if (socket) {
        socket.emit('room:join', { roomId: newRoom.id });
      }
      
      setShowNewChatModal(false);
      setSearchEmployee('');
      setActiveTab('direct'); // Chuyển sang tab cá nhân
    } catch (error) {
      console.error('Error creating direct message room:', error);
    }
  };

  // Filter employees theo search
  const filteredEmployees = employees.filter(emp => 
    emp.fullName.toLowerCase().includes(searchEmployee.toLowerCase()) ||
    emp.employeeCode.toLowerCase().includes(searchEmployee.toLowerCase())
  );

  // Lấy danh sách rooms theo tab hiện tại
  const getRoomsForCurrentTab = (): ChatRoom[] => {
    if (!roomsData) return [];
    
    switch (activeTab) {
      case 'company':
        return roomsData.company ? [roomsData.company] : [];
      case 'departments':
        return roomsData.departments || [];
      case 'direct':
        return roomsData.directMessages || [];
      default:
        return [];
    }
  };

  return (
    <Layout className="chat-layout">
      <Sider width={300} className="chat-sidebar">
        <div className="chat-sidebar-header">
          <h3>Phòng chat</h3>
        </div>
        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as typeof activeTab)}
          items={[
            { key: 'company', label: 'Công ty' },
            { key: 'departments', label: 'Phòng ban' },
            { 
              key: 'direct', 
              label: 'Cá nhân',
              tab: (
                <span>
                  Cá nhân
                  <Button
                    type="text"
                    icon={<PlusOutlined />}
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowNewChatModal(true);
                    }}
                    style={{ marginLeft: 8 }}
                  />
                </span>
              ),
            },
          ]}
        />
        <List
          dataSource={getRoomsForCurrentTab()}
          renderItem={(room) => (
            <List.Item
              className={`chat-room-item ${selectedRoom?.id === room.id ? 'active' : ''}`}
              onClick={() => handleRoomSelect(room)}
            >
              <List.Item.Meta
                avatar={<Avatar icon={<UserOutlined />} />}
                title={
                  room.type === 'DIRECT_MESSAGE' && room.otherParticipant
                    ? room.otherParticipant.fullName
                    : room.name
                }
                description={
                  room.type === 'DIRECT_MESSAGE'
                    ? 'Chat cá nhân'
                    : room.department?.name || 'Chat chung'
                }
              />
              {room.unreadCount > 0 && (
                <Badge count={room.unreadCount} />
              )}
            </List.Item>
          )}
        />
      </Sider>
      <Content className="chat-content">
        {selectedRoom ? (
          <>
            <div className="chat-header">
              <h3>{selectedRoom.name}</h3>
            </div>
            <div className="chat-messages">
              {loading ? (
                <Spin />
              ) : messages.length === 0 ? (
                <Empty description="Chưa có tin nhắn" />
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`chat-message ${message.senderId === 'current-user-id' ? 'own' : ''}`}
                  >
                    <Avatar>{message.sender.fullName[0]}</Avatar>
                    <div className="message-content">
                      <div className="message-header">
                        <span className="sender-name">{message.sender.fullName}</span>
                        <span className="message-time">
                          {formatRelativeTime(message.createdAt)}
                        </span>
                      </div>
                      <div className="message-text">{message.content}</div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="chat-input">
              <TextArea
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                onPressEnter={(e) => {
                  if (!e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Nhập tin nhắn..."
                rows={3}
                disabled={sending}
              />
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSendMessage}
                loading={sending}
                disabled={!messageContent.trim()}
              >
                Gửi
              </Button>
            </div>
          </>
        ) : (
          <Empty description="Chọn phòng chat để bắt đầu" />
        )}
      </Content>

      {/* Modal tìm kiếm nhân viên để chat 1-1 */}
      <Modal
        title="Tìm nhân viên để chat"
        open={showNewChatModal}
        onCancel={() => {
          setShowNewChatModal(false);
          setSearchEmployee('');
        }}
        footer={null}
        width={500}
      >
        <Input
          placeholder="Tìm theo tên hoặc mã nhân viên..."
          prefix={<SearchOutlined />}
          value={searchEmployee}
          onChange={(e) => setSearchEmployee(e.target.value)}
          style={{ marginBottom: 16 }}
        />
        <List
          dataSource={filteredEmployees}
          renderItem={(employee) => (
            <List.Item
              className="employee-search-item"
              onClick={() => handleStartDirectChat(employee.id)}
              style={{ cursor: 'pointer' }}
            >
              <List.Item.Meta
                avatar={<Avatar>{employee.fullName[0]}</Avatar>}
                title={employee.fullName}
                description={`${employee.employeeCode} - ${employee.department?.name || 'Chưa có phòng ban'}`}
              />
            </List.Item>
          )}
          locale={{ emptyText: 'Không tìm thấy nhân viên' }}
        />
      </Modal>
    </Layout>
  );
};

export default ChatPage;
```

#### 3.6. Thêm Route

**File: `frontend/src/config/routes.tsx`**

```typescript
// Thêm route mới
{
  path: '/chat',
  element: <ChatPage />,
  // Có thể thêm role guard nếu cần
}
```

---

## 🔧 CẤU HÌNH BỔ SUNG

### 1. Cập nhật CORS trong main.ts

```typescript
app.enableCors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

### 2. Environment Variables

**Backend `.env`:**
```
# Đã có sẵn
JWT_ACCESS_TOKEN=your-secret-key
```

**Frontend `.env`:**
```
VITE_API_URL=http://localhost:8000
```

---

## 📝 TÓM TẮT CÁC BƯỚC TRIỂN KHAI

### ✅ Checklist:

**Backend:**
- [ ] 1. Cập nhật Prisma schema (thêm ChatRoom, ChatMessage, ChatRoomParticipant với 3 loại room)
- [ ] 2. Tạo migration và generate Prisma client
- [ ] 3. Tạo ChatModule với Gateway, Service, Controller
- [ ] 4. Tạo WebSocket JWT Auth Guard
- [ ] 5. Tạo DTOs
- [ ] 6. Implement logic cho 3 loại chat:
  - [ ] Chat chung toàn công ty (COMPANY_WIDE)
  - [ ] Chat theo phòng ban (DEPARTMENT_HRM)
  - [ ] Chat 1-1 (DIRECT_MESSAGE)
- [ ] 7. Đăng ký ChatModule vào AppModule
- [ ] 8. Test WebSocket connection

**Frontend:**
- [ ] 1. Cài đặt socket.io-client
- [ ] 2. Tạo SocketService
- [ ] 3. Tạo Chat types (bao gồm ChatRoomsResponse)
- [ ] 4. Tạo Chat API functions (bao gồm createDirectMessageRoom)
- [ ] 5. Tạo ChatPage component với tabs (Công ty, Phòng ban, Cá nhân)
- [ ] 6. Tạo component tìm kiếm nhân viên để chat 1-1
- [ ] 7. Thêm route
- [ ] 8. Test real-time messaging cho cả 3 loại chat

**Testing:**
- [ ] 1. Test chat chung toàn công ty (tất cả mọi người thấy)
- [ ] 2. Test chat theo phòng ban (HRM với từng phòng ban)
- [ ] 3. Test chat 1-1 (tạo room, gửi/nhận tin nhắn)
- [ ] 4. Test quyền truy cập (HR có thể chat với tất cả, Employee chỉ chat với phòng ban mình)
- [ ] 5. Test đánh dấu đã đọc
- [ ] 6. Test reconnection khi mất kết nối
- [ ] 7. Test filter rooms theo loại

---

## 🚀 KẾT LUẬN

Dự án của bạn **HOÀN TOÀN PHÙ HỢP** để triển khai tính năng chat realtime WebSocket. Tất cả các dependencies cần thiết đã có sẵn, kiến trúc phù hợp, và có thể tích hợp mượt mà với hệ thống hiện tại.

**Ước tính thời gian triển khai:** 2-3 ngày (tùy vào mức độ chi tiết UI/UX)

**Lưu ý:**
- Cần test kỹ phần authentication qua WebSocket
- Có thể cần thêm Redis nếu scale lên nhiều server instances
- Cân nhắc thêm file upload nếu muốn gửi ảnh/file
- Chat 1-1 cần quản lý participants để đảm bảo chỉ 2 người trong room
- Chat chung toàn công ty có thể có nhiều tin nhắn, cần pagination tốt
- Cần UI để tìm kiếm và bắt đầu chat 1-1 với nhân viên khác

---

## 🎯 ĐIỂM CẦN TINH CHỈNH NHẸ (Nếu muốn đạt mức "Senior-Polished")

Sau khi triển khai các tính năng cơ bản, các điểm sau sẽ nâng cấp hệ thống chat lên mức production-ready và dễ bảo trì:

### 1. ✅ Tách Socket Event Types riêng (chat.events.ts)

**Mục tiêu:** Giảm lỗi khi backend – frontend mismatch, type-safe events

**Implementation:**

**Backend: `backend/src/chat/constants/chat.events.ts`**
```typescript
export enum ChatEvents {
  // Client -> Server
  MESSAGE_SEND = 'message:send',
  ROOM_JOIN = 'room:join',
  ROOM_LEAVE = 'room:leave',
  TYPING_START = 'typing:start',
  TYPING_STOP = 'typing:stop',
  USER_ONLINE = 'user:online',
  USER_OFFLINE = 'user:offline',
  
  // Server -> Client
  MESSAGE_NEW = 'message:new',
  MESSAGE_ERROR = 'message:error',
  ROOM_JOINED = 'room:joined',
  ROOM_LEFT = 'room:left',
  TYPING_USER = 'typing:user',
  USER_STATUS_CHANGED = 'user:status:changed',
  CONNECTION = 'connect',
  DISCONNECTION = 'disconnect',
}
```

**Frontend: `frontend/src/services/chat/chat.events.ts`**
```typescript
export const ChatEvents = {
  // Client -> Server
  MESSAGE_SEND: 'message:send',
  ROOM_JOIN: 'room:join',
  ROOM_LEAVE: 'room:leave',
  TYPING_START: 'typing:start',
  TYPING_STOP: 'typing:stop',
  
  // Server -> Client
  MESSAGE_NEW: 'message:new',
  MESSAGE_ERROR: 'message:error',
  ROOM_JOINED: 'room:joined',
  TYPING_USER: 'typing:user',
  USER_STATUS_CHANGED: 'user:status:changed',
} as const;
```

**Lợi ích:**
- Type-safe: TypeScript sẽ báo lỗi nếu dùng sai event name
- Dễ refactor: Đổi tên event ở 1 nơi, tự động cập nhật toàn bộ
- Tránh typo: Không còn lỗi do gõ sai tên event

---

### 2. ✅ Thêm Event user:online / user:offline

**Mục tiêu:** Hiển thị trạng thái online thực tế

**Implementation:**

**Backend: Cập nhật `chat.gateway.ts`**
```typescript
async handleConnection(client: Socket) {
  const user = client.data.user;
  if (user) {
    this.connectedUsers.set(user.sub, client.id);
    
    // Broadcast user online status
    this.server.emit(ChatEvents.USER_STATUS_CHANGED, {
      userId: user.sub,
      status: 'online',
      timestamp: new Date(),
    });
    
    // ... existing code
  }
}

async handleDisconnect(client: Socket) {
  const user = client.data.user;
  if (user) {
    this.connectedUsers.delete(user.sub);
    
    // Broadcast user offline status
    this.server.emit(ChatEvents.USER_STATUS_CHANGED, {
      userId: user.sub,
      status: 'offline',
      timestamp: new Date(),
    });
  }
}
```

**Frontend: Cập nhật `ChatPage`**
```typescript
const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

useEffect(() => {
  if (!socket) return;

  socket.on(ChatEvents.USER_STATUS_CHANGED, (data: { userId: string; status: string }) => {
    setOnlineUsers(prev => {
      const next = new Set(prev);
      if (data.status === 'online') {
        next.add(data.userId);
      } else {
        next.delete(data.userId);
      }
      return next;
    });
  });

  return () => {
    socket.off(ChatEvents.USER_STATUS_CHANGED);
  };
}, [socket]);

// Hiển thị badge online
{onlineUsers.has(message.sender.id) && (
  <Badge status="success" text="Online" />
)}
```

**Lợi ích:**
- UX tốt hơn: User biết ai đang online
- Tối ưu gửi tin nhắn: Có thể ưu tiên gửi cho người online
- Analytics: Theo dõi activity của users

---

### 3. ✅ Pagination Tin Nhắn (Infinite Scroll)

**Mục tiêu:** Tránh tải toàn bộ message một lần, tối ưu performance

**Implementation:**

**Backend: Cập nhật `getMessages()` - đã có sẵn pagination**

**Frontend: `frontend/src/pages/chat/ChatMessages.tsx`**
```typescript
import { InfiniteScroll } from 'antd-mobile'; // hoặc tự implement

const ChatMessages: React.FC<{ roomId: string }> = ({ roomId }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const loadMore = async () => {
    if (loading || !hasMore) return;
    
    setLoading(true);
    try {
      const response = await getChatMessagesAPI(roomId, { page, limit: 20 });
      const newMessages = response.data || [];
      
      if (newMessages.length < 20) {
        setHasMore(false);
      }
      
      // Prepend messages (tin nhắn cũ ở trên)
      setMessages(prev => [...newMessages, ...prev]);
      setPage(prev => prev + 1);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-messages-container">
      <InfiniteScroll
        loadMore={loadMore}
        hasMore={hasMore}
        loader={<Spin />}
      >
        {messages.map(message => (
          <ChatMessageItem key={message.id} message={message} />
        ))}
      </InfiniteScroll>
    </div>
  );
};
```

**Lợi ích:**
- Performance: Chỉ load 20-50 tin nhắn mỗi lần
- UX tốt: Scroll mượt mà, không lag
- Tiết kiệm bandwidth: Đặc biệt quan trọng với chat chung toàn công ty

---

### 4. ✅ Redis Adapter (Sau này)

**Mục tiêu:** Scale socket.io qua nhiều server instances

**Khi nào cần:**
- Khi có > 1 server instance (load balancing)
- Khi cần horizontal scaling

**Implementation:**

```bash
npm install @socket.io/redis-adapter redis
```

**Backend: `backend/src/main.ts`**
```typescript
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // ... existing code
  
  // Redis adapter cho WebSocket (chỉ khi có nhiều instances)
  if (process.env.REDIS_URL) {
    const pubClient = createClient({ url: process.env.REDIS_URL });
    const subClient = pubClient.duplicate();
    
    await Promise.all([pubClient.connect(), subClient.connect()]);
    
    const io = app.getHttpServer().io; // Lấy socket.io instance
    io.adapter(createAdapter(pubClient, subClient));
  }
  
  // ... rest of code
}
```

**Lợi ích:**
- Scale horizontal: Có thể chạy nhiều server, messages vẫn sync
- High availability: Nếu 1 server down, các server khác vẫn hoạt động

---

### 5. ✅ Audit Log cho Chat

**Mục tiêu:** Gắn kết với hệ thống Audit Log tổng thể

**Implementation:**

**Backend: Cập nhật `chat.service.ts`**
```typescript
import { AuditLogService } from '@/audit-log/audit-log.service';
import { AuditModule, AuditAction } from '@prisma/client';

async createMessage(dto: CreateMessageDto, senderId: string) {
  // ... existing validation
  
  const message = await this.prisma.chatMessage.create({...});
  
  // Audit log
  await this.auditLogService.createLog({
    module: AuditModule.CHAT, // Cần thêm CHAT vào enum
    action: AuditAction.CREATE,
    entityName: 'ChatMessage',
    entityId: message.id,
    actorEmployeeId: senderId,
    description: `Gửi tin nhắn trong room ${dto.roomId}`,
    afterData: {
      roomId: dto.roomId,
      contentLength: dto.content.length,
      // Không lưu full content để tránh privacy issues
    },
  });
  
  return message;
}

async deleteMessage(messageId: string, userId: string) {
  const message = await this.prisma.chatMessage.findUnique({
    where: { id: messageId },
  });
  
  if (message.senderId !== userId) {
    throw new ForbiddenException('Chỉ có thể xóa tin nhắn của chính mình');
  }
  
  await this.prisma.chatMessage.delete({ where: { id: messageId } });
  
  // Audit log
  await this.auditLogService.createLog({
    module: AuditModule.CHAT,
    action: AuditAction.DELETE,
    entityName: 'ChatMessage',
    entityId: messageId,
    actorEmployeeId: userId,
    description: `Xóa tin nhắn ${messageId}`,
    beforeData: { roomId: message.roomId },
  });
}
```

**Cập nhật Prisma Schema:**
```prisma
enum AuditModule {
  // ... existing
  CHAT  // Thêm mới
}
```

**Lợi ích:**
- Compliance: Tuân thủ yêu cầu audit trail
- Security: Theo dõi ai gửi/xóa tin nhắn
- Debugging: Dễ trace lỗi khi có vấn đề

---

### 6. ✅ Tách Message vào Queue khi Offline

**Mục tiêu:** Dự phòng mất kết nối, đảm bảo delivery

**Implementation:**

**Frontend: `frontend/src/services/chat/message-queue.service.ts`**
```typescript
class MessageQueueService {
  private queue: Array<{ roomId: string; content: string; timestamp: number }> = [];
  private readonly STORAGE_KEY = 'chat_message_queue';

  constructor() {
    this.loadQueue();
  }

  addToQueue(roomId: string, content: string) {
    const message = { roomId, content, timestamp: Date.now() };
    this.queue.push(message);
    this.saveQueue();
  }

  async processQueue(socket: Socket) {
    if (!socket.connected) return;

    const messages = [...this.queue];
    this.queue = [];
    this.saveQueue();

    for (const msg of messages) {
      try {
        socket.emit(ChatEvents.MESSAGE_SEND, {
          roomId: msg.roomId,
          content: msg.content,
        });
        // Đợi một chút để tránh spam
        await new Promise(resolve => setTimeout(resolve, 100)));
      } catch (error) {
        // Nếu fail, thêm lại vào queue
        this.queue.push(msg);
      }
    }
  }

  private saveQueue() {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.queue));
  }

  private loadQueue() {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      this.queue = JSON.parse(saved);
    }
  }
}

export const messageQueueService = new MessageQueueService();
```

**Sử dụng trong ChatPage:**
```typescript
useEffect(() => {
  if (socket?.connected) {
    // Process queue khi reconnect
    messageQueueService.processQueue(socket);
  }
}, [socket?.connected]);

const handleSendMessage = async () => {
  if (!socket?.connected) {
    // Nếu offline, thêm vào queue
    messageQueueService.addToQueue(selectedRoom.id, messageContent);
    // Hiển thị thông báo
    message.error('Đang offline, tin nhắn sẽ được gửi khi có kết nối');
    return;
  }
  
  // ... existing send logic
};
```

**Lợi ích:**
- Reliability: Không mất tin nhắn khi mất kết nối
- UX tốt: User vẫn có thể soạn tin nhắn khi offline
- Auto-retry: Tự động gửi lại khi reconnect

---

### 7. ✅ Unit Test ChatService (NestJS)

**Mục tiêu:** Tăng độ tin cậy cho các chức năng message, room, permission

**Implementation:**

**Backend: `backend/src/chat/chat.service.spec.ts`**
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { ChatService } from './chat.service';
import { PrismaService } from '@/prisma/prisma.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('ChatService', () => {
  let service: ChatService;
  let prisma: PrismaService;

  const mockPrismaService = {
    chatRoom: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    chatMessage: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    employee: {
      findUnique: jest.fn(),
    },
    account: {
      findUnique: jest.fn(),
    },
    department: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('createMessage', () => {
    it('should create message successfully for COMPANY_WIDE room', async () => {
      mockPrismaService.chatRoom.findUnique.mockResolvedValue({
        id: 'room-1',
        type: 'COMPANY_WIDE',
        departmentId: null,
      });
      mockPrismaService.employee.findUnique.mockResolvedValue({
        id: 'user-1',
        departmentId: 'dept-1',
      });
      mockPrismaService.chatMessage.create.mockResolvedValue({
        id: 'msg-1',
        roomId: 'room-1',
        senderId: 'user-1',
        content: 'Hello',
      });

      const result = await service.createMessage(
        { roomId: 'room-1', content: 'Hello' },
        'user-1',
      );

      expect(result).toBeDefined();
      expect(mockPrismaService.chatMessage.create).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if employee tries to send to wrong department', async () => {
      mockPrismaService.chatRoom.findUnique.mockResolvedValue({
        id: 'room-1',
        type: 'DEPARTMENT_HRM',
        departmentId: 'dept-2',
      });
      mockPrismaService.employee.findUnique.mockResolvedValue({
        id: 'user-1',
        departmentId: 'dept-1', // Khác với room
      });
      mockPrismaService.account.findUnique.mockResolvedValue({
        role: 'EMPLOYEE', // Không phải ADMIN/HR
      });

      await expect(
        service.createMessage(
          { roomId: 'room-1', content: 'Hello' },
          'user-1',
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow ADMIN to send to any department room', async () => {
      // ... test case
    });
  });

  describe('getRoomsForUser', () => {
    it('should return all rooms for ADMIN', async () => {
      // ... test case
    });

    it('should return only own department room for EMPLOYEE', async () => {
      // ... test case
    });
  });

  // Thêm các test cases khác...
});
```

**Lợi ích:**
- Confidence: Đảm bảo logic đúng trước khi deploy
- Refactoring safe: Có thể refactor mà không sợ break
- Documentation: Test cases là documentation sống

---

## 📊 ĐÁNH GIÁ TỔNG QUAN

### ✅ **TẤT CẢ 7 ĐIỂM ĐỀU RẤT HỢP LÝ VÀ CẦN THIẾT**

**Độ ưu tiên:**

1. **Cao (Nên làm ngay):**
   - ✅ #1: Tách event types (dễ làm, lợi ích lớn)
   - ✅ #3: Pagination (quan trọng cho performance)
   - ✅ #7: Unit tests (đảm bảo chất lượng code)

2. **Trung bình (Làm sau khi có MVP):**
   - ✅ #2: Online/Offline status (UX tốt)
   - ✅ #5: Audit log (compliance)
   - ✅ #6: Message queue (reliability)

3. **Thấp (Khi cần scale):**
   - ✅ #4: Redis adapter (chỉ khi có nhiều instances)

**Khuyến nghị:**
- Bắt đầu với #1, #3, #7 (dễ implement, impact cao)
- Sau đó làm #2, #5, #6 (cải thiện UX và reliability)
- #4 chỉ làm khi thực sự cần scale horizontal

