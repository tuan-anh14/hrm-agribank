import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsDateString, IsString } from 'class-validator';

export class CheckOutDto {
  @ApiProperty({
    example: '2024-01-15T17:00:00Z',
    description: 'Giờ check-out (ISO 8601). Nếu không có sẽ dùng thời gian hiện tại',
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: 'Giờ check-out phải là định dạng ngày giờ hợp lệ' })
  checkOutTime?: string;

  @ApiProperty({
    example: 'Ghi chú check-out',
    description: 'Ghi chú',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Ghi chú phải là chuỗi' })
  note?: string;
}

