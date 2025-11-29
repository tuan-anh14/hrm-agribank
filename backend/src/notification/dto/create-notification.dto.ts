import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { NotificationType } from '@prisma/client';

export class CreateNotificationDto {
  @ApiProperty({
    description: 'ID của nhân viên nhận notification',
    example: 'uuid-here',
  })
  @IsUUID('4', { message: 'Employee ID phải là UUID hợp lệ' })
  @IsNotEmpty({ message: 'Employee ID không được để trống' })
  employeeId: string;

  @ApiProperty({
    description: 'Loại notification',
    enum: NotificationType,
    example: NotificationType.ATTENDANCE,
  })
  @IsEnum(NotificationType, { message: 'Notification type không hợp lệ' })
  @IsNotEmpty({ message: 'Notification type không được để trống' })
  type: NotificationType;

  @ApiProperty({
    description: 'Tiêu đề notification',
    example: 'Bạn đã vào ca sớm',
  })
  @IsString({ message: 'Title phải là chuỗi' })
  @IsNotEmpty({ message: 'Title không được để trống' })
  title: string;

  @ApiProperty({
    description: 'Nội dung notification',
    example: 'Bạn đã vào ca sớm lúc 08:12:22 - 05/04/2024',
  })
  @IsString({ message: 'Content phải là chuỗi' })
  @IsNotEmpty({ message: 'Content không được để trống' })
  content: string;
}

