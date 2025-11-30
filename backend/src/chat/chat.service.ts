import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { ChatRoomType, Prisma } from '@prisma/client';
import { CreateMessageDto } from './dto/create-message.dto';
import { QueryMessageDto } from './dto/query-message.dto';

// Type definitions for room with last message
type ChatRoomWithLastMessage = Prisma.ChatRoomGetPayload<{
  include: {
    department: true;
  };
}> & {
  lastMessage: (Prisma.ChatMessageGetPayload<{
    include: {
      sender: {
        select: {
          id: true;
          fullName: true;
        };
      };
    };
  }>) | null;
};

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tạo hoặc lấy room chat chung toàn công ty
   * Chỉ có 1 room COMPANY_WIDE duy nhất trong hệ thống
   */
  async getOrCreateCompanyRoom() {
    let room = await this.prisma.chatRoom.findFirst({
      where: {
        type: ChatRoomType.COMPANY_WIDE,
        departmentId: null,
      },
      include: {
        department: true,
      },
    });

    if (!room) {
      room = await this.prisma.chatRoom.create({
        data: {
          departmentId: null,
          name: 'Chat chung Agribank',
          type: ChatRoomType.COMPANY_WIDE,
        },
        include: {
          department: true,
        },
      });
    }

    return room;
  }

  /**
   * Tạo hoặc lấy room chat giữa phòng ban và HRM
   * Mỗi department chỉ có 1 room DEPARTMENT_HRM
   */
  async getOrCreateDepartmentRoom(departmentId: string) {
    // Kiểm tra department tồn tại
    const department = await this.prisma.department.findUnique({
      where: { id: departmentId },
    });

    if (!department) {
      throw new NotFoundException(`Không tìm thấy phòng ban ID ${departmentId}`);
    }

    let room = await this.prisma.chatRoom.findFirst({
      where: {
        departmentId,
        type: ChatRoomType.DEPARTMENT_HRM,
      },
      include: {
        department: true,
      },
    });

    if (!room) {
      room = await this.prisma.chatRoom.create({
        data: {
          departmentId,
          name: `Phòng ${department.name}`,
          type: ChatRoomType.DEPARTMENT_HRM,
        },
        include: {
          department: true,
        },
      });
    }

    return room;
  }

  /**
   * Tạo hoặc lấy room chat 1-1 giữa 2 nhân viên
   * Sắp xếp IDs để đảm bảo tính nhất quán
   */
  async getOrCreateDirectMessageRoom(userId1: string, userId2: string) {
    // Sắp xếp IDs để đảm bảo tính nhất quán
    const [id1, id2] = [userId1, userId2].sort();

    // Kiểm tra 2 employees tồn tại
    const [employee1, employee2] = await Promise.all([
      this.prisma.employee.findUnique({ where: { id: id1 } }),
      this.prisma.employee.findUnique({ where: { id: id2 } }),
    ]);

    if (!employee1) {
      throw new NotFoundException(`Không tìm thấy nhân viên ID ${id1}`);
    }
    if (!employee2) {
      throw new NotFoundException(`Không tìm thấy nhân viên ID ${id2}`);
    }

    // Tìm room 1-1 đã tồn tại giữa 2 người
    const existingRooms = await this.prisma.chatRoom.findMany({
      where: {
        type: ChatRoomType.DIRECT_MESSAGE,
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

    // Kiểm tra xem có room nào có đúng 2 participants không
    for (const room of existingRooms) {
      if (room.participants.length === 2) {
        const participantIds = room.participants
          .map((p) => p.employeeId)
          .sort();
        if (participantIds[0] === id1 && participantIds[1] === id2) {
          return this.prisma.chatRoom.findUnique({
            where: { id: room.id },
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
        }
      }
    }

    // Tạo room mới
    const room = await this.prisma.chatRoom.create({
      data: {
        departmentId: null,
        name: `${employee1.fullName} & ${employee2.fullName}`,
        type: ChatRoomType.DIRECT_MESSAGE,
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

  /**
   * Lấy tất cả rooms mà user có quyền truy cập
   * @param userId - Employee ID (từ JWT payload.sub, vì auth.service.ts set sub = user.id là Employee ID)
   * @param userRole - Role của user (ADMIN, HR, EMPLOYEE)
   */
  async getRoomsForUser(
    userId: string,
    userRole: string,
  ): Promise<{
    company: ChatRoomWithLastMessage | null;
    departments: ChatRoomWithLastMessage[];
    directMessages: Array<
      Prisma.ChatRoomGetPayload<{
        include: {
          participants: {
            include: {
              employee: {
                select: {
                  id: true;
                  fullName: true;
                  employeeCode: true;
                };
              };
            };
          };
        };
      }> & {
        otherParticipant: {
          id: string;
          fullName: string;
          employeeCode: string;
        } | null;
        lastMessage: (Prisma.ChatMessageGetPayload<{
          include: {
            sender: {
              select: {
                id: true;
                fullName: true;
              };
            };
          };
        }>) | null;
      }
    >;
  }> {
    // userId từ JWT token là Employee ID (từ payload.sub trong auth.service.ts)
    // Kiểm tra employee tồn tại
    const employee = await this.prisma.employee.findUnique({
      where: { id: userId },
      include: {
        department: true,
        account: {
          select: {
            id: true,
            role: true,
          },
        },
      },
    });

    if (!employee) {
      throw new NotFoundException('Không tìm thấy thông tin nhân viên');
    }

    const isAdminOrHR = userRole === 'ADMIN' || userRole === 'HR';

    // 1. Chat chung toàn công ty - tất cả mọi người đều thấy
    const companyRoom = await this.getOrCreateCompanyRoom();
    const companyLastMessage = await this.prisma.chatMessage.findFirst({
      where: { roomId: companyRoom.id },
      orderBy: { createdAt: 'desc' },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    const companyRoomWithLastMessage: ChatRoomWithLastMessage = {
      ...companyRoom,
      department: companyRoom.department,
      lastMessage: companyLastMessage,
    };

    // 2. Chat theo phòng ban
    let departmentRooms: ChatRoomWithLastMessage[] = [];
    if (isAdminOrHR) {
      // ADMIN/HR thấy tất cả phòng ban
      const rooms = await this.prisma.chatRoom.findMany({
        where: { type: ChatRoomType.DEPARTMENT_HRM },
        include: {
          department: true,
        },
        orderBy: { updatedAt: 'desc' },
      });

      // Lấy last message cho từng room
      departmentRooms = await Promise.all(
        rooms.map(async (room) => {
          const lastMessage = await this.prisma.chatMessage.findFirst({
            where: { roomId: room.id },
            orderBy: { createdAt: 'desc' },
            include: {
              sender: {
                select: {
                  id: true,
                  fullName: true,
                },
              },
            },
          });
          return {
            ...room,
            lastMessage,
          };
        }),
      );
    } else if (employee.departmentId) {
      // Employee chỉ thấy room của phòng ban mình
      const deptRoom = await this.getOrCreateDepartmentRoom(employee.departmentId);
      const lastMessage = await this.prisma.chatMessage.findFirst({
        where: { roomId: deptRoom.id },
        orderBy: { createdAt: 'desc' },
        include: {
          sender: {
            select: {
              id: true,
              fullName: true,
            },
          },
        },
      });
      departmentRooms = [{ ...deptRoom, lastMessage }];
    }

    // 3. Chat 1-1 - lấy tất cả rooms mà user tham gia
    const directMessageRooms = await this.prisma.chatRoom.findMany({
      where: {
        type: ChatRoomType.DIRECT_MESSAGE,
        participants: {
          some: {
            employeeId: employee.id,
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
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Lấy last message cho từng direct message room
    const directMessagesWithLastMessage = await Promise.all(
      directMessageRooms.map(async (room) => {
        const lastMessage = await this.prisma.chatMessage.findFirst({
          where: { roomId: room.id },
          orderBy: { createdAt: 'desc' },
          include: {
            sender: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
        });

        // Tìm người còn lại trong chat 1-1 (không phải mình)
        const otherParticipant = room.participants.find(
          (p) => p.employeeId !== employee.id,
        );

        return {
          ...room,
          otherParticipant: otherParticipant?.employee || null,
          lastMessage,
        };
      }),
    );

    // Format lại để frontend dễ sử dụng
    return {
      company: companyRoomWithLastMessage,
      departments: departmentRooms,
      directMessages: directMessagesWithLastMessage,
    };
  }

  /**
   * Tạo tin nhắn mới trong room
   * @param dto - CreateMessageDto với roomId và content
   * @param senderId - Employee ID (từ JWT payload.sub, vì auth.service.ts set sub = user.id là Employee ID)
   */
  async createMessage(dto: CreateMessageDto, senderId: string) {
    // senderId từ JWT token là Employee ID (từ payload.sub trong auth.service.ts)
    // Kiểm tra employee tồn tại
    const employee = await this.prisma.employee.findUnique({
      where: { id: senderId },
      include: {
        account: {
          select: {
            id: true,
            role: true,
          },
        },
        department: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!employee) {
      throw new NotFoundException('Không tìm thấy thông tin nhân viên');
    }

    const employeeId = employee.id;
    const isAdminOrHR = employee.account?.role === 'ADMIN' || employee.account?.role === 'HR';

    // Kiểm tra quyền truy cập room
    const room = await this.prisma.chatRoom.findUnique({
      where: { id: dto.roomId },
      include: {
        department: true,
        participants: true,
      },
    });

    if (!room) {
      throw new NotFoundException(`Không tìm thấy phòng chat ID ${dto.roomId}`);
    }

    // Kiểm tra quyền truy cập theo loại room
    if (room.type === 'COMPANY_WIDE') {
      // Chat chung: tất cả mọi người đều có thể gửi
      // Không cần kiểm tra
    } else if (room.type === 'DEPARTMENT_HRM') {
      // Chat phòng ban: chỉ HRM hoặc nhân viên trong phòng ban đó
      if (!isAdminOrHR && room.departmentId !== employee.departmentId) {
        throw new ForbiddenException('Bạn không có quyền gửi tin nhắn vào phòng này');
      }
    } else if (room.type === 'DIRECT_MESSAGE') {
      // Chat 1-1: chỉ 2 người trong room mới được gửi
      const isParticipant = room.participants.some(
        (p) => p.employeeId === employeeId,
      );
      if (!isParticipant) {
        throw new ForbiddenException('Bạn không có quyền gửi tin nhắn vào phòng này');
      }
    }

    // Tạo tin nhắn
    const message = await this.prisma.chatMessage.create({
      data: {
        roomId: dto.roomId,
        senderId: employeeId,
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

  /**
   * Lấy lịch sử tin nhắn trong room với pagination
   * @param roomId - ID của room
   * @param query - QueryMessageDto với page và limit
   */
  async getMessages(roomId: string, query: QueryMessageDto) {
    // Kiểm tra room tồn tại
    const room = await this.prisma.chatRoom.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      throw new NotFoundException(`Không tìm thấy phòng chat ID ${roomId}`);
    }

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

    // Đảo ngược để hiển thị từ cũ đến mới (oldest first)
    return {
      data: messages.reverse(),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Đánh dấu tin nhắn đã đọc
   * @param messageId - ID của tin nhắn
   * @param userId - Employee ID (từ JWT payload.sub, vì auth.service.ts set sub = user.id là Employee ID)
   */
  async markAsRead(messageId: string, userId: string) {
    // userId từ JWT token là Employee ID
    // Kiểm tra employee tồn tại
    const employee = await this.prisma.employee.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!employee) {
      throw new NotFoundException('Không tìm thấy thông tin nhân viên');
    }

    const message = await this.prisma.chatMessage.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException(`Không tìm thấy tin nhắn ID ${messageId}`);
    }

    // Chỉ đánh dấu đọc nếu không phải người gửi
    if (message.senderId !== employee.id && !message.isRead) {
      return this.prisma.chatMessage.update({
        where: { id: messageId },
        data: {
          isRead: true,
          readAt: new Date(),
        },
        include: {
          sender: {
            select: {
              id: true,
              fullName: true,
              employeeCode: true,
            },
          },
        },
      });
    }

    // Nếu đã đọc hoặc là người gửi, trả về message hiện tại
    return this.prisma.chatMessage.findUnique({
      where: { id: messageId },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            employeeCode: true,
          },
        },
      },
    });
  }

  /**
   * Đánh dấu tất cả tin nhắn trong room đã đọc
   * @param roomId - ID của room
   * @param userId - Employee ID (từ JWT payload.sub, vì auth.service.ts set sub = user.id là Employee ID)
   */
  async markRoomAsRead(roomId: string, userId: string) {
    // userId từ JWT token là Employee ID
    // Kiểm tra employee tồn tại
    const employee = await this.prisma.employee.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!employee) {
      throw new NotFoundException('Không tìm thấy thông tin nhân viên');
    }

    // Kiểm tra room tồn tại
    const room = await this.prisma.chatRoom.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      throw new NotFoundException(`Không tìm thấy phòng chat ID ${roomId}`);
    }

    // Đánh dấu tất cả tin nhắn chưa đọc (không phải của chính mình) là đã đọc
    const result = await this.prisma.chatMessage.updateMany({
      where: {
        roomId,
        senderId: { not: employee.id }, // Không phải tin nhắn của chính mình
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return { count: result.count };
  }
}

