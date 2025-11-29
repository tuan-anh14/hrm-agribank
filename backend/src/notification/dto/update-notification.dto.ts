import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateNotificationDto {
  @ApiProperty({
    description: 'Đánh dấu đã đọc',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'isRead phải là boolean' })
  isRead?: boolean;
}

