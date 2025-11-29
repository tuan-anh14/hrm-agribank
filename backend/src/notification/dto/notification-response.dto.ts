import { ApiProperty } from '@nestjs/swagger';
import { Notification, NotificationType } from '@prisma/client';

export class NotificationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  employeeId: string;

  @ApiProperty({ enum: NotificationType })
  type: NotificationType;

  @ApiProperty()
  title: string;

  @ApiProperty()
  content: string;

  @ApiProperty()
  isRead: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  constructor(notification: Notification) {
    this.id = notification.id;
    this.employeeId = notification.employeeId;
    this.type = notification.type;
    this.title = notification.title;
    this.content = notification.content;
    this.isRead = notification.isRead;
    this.createdAt = notification.createdAt;
    this.updatedAt = notification.updatedAt;
  }
}

export class NotificationListResponseDto {
  @ApiProperty({ type: [NotificationResponseDto] })
  data: NotificationResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}

export class NotificationDetailResponseDto {
  @ApiProperty({ type: NotificationResponseDto })
  data: NotificationResponseDto;
}

export class UnreadCountResponseDto {
  @ApiProperty()
  count: number;
}

