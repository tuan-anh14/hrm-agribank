import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateMessageDto {
  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    description: 'ID của phòng chat',
  })
  @IsUUID(4, { message: 'ID phòng chat phải là UUID hợp lệ' })
  @IsNotEmpty({ message: 'ID phòng chat không được để trống' })
  roomId: string;

  @ApiProperty({
    example: 'Xin chào mọi người!',
    description: 'Nội dung tin nhắn',
    maxLength: 2000,
  })
  @IsString({ message: 'Nội dung tin nhắn phải là chuỗi' })
  @IsNotEmpty({ message: 'Nội dung tin nhắn không được để trống' })
  @MaxLength(2000, { message: 'Nội dung tin nhắn không được quá 2000 ký tự' })
  content: string;
}

