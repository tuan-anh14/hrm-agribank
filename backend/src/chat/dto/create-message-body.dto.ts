import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/**
 * DTO cho request body khi gửi tin nhắn
 * roomId được lấy từ path parameter, không cần trong body
 */
export class CreateMessageBodyDto {
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

