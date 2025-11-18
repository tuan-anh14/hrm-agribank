import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsDateString, IsString } from 'class-validator';

export class CheckInDto {
  @ApiProperty({
    example: '2024-01-15T08:00:00Z',
    description: 'Giờ check-in (ISO 8601). Nếu không có sẽ dùng thời gian hiện tại',
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: 'Giờ check-in phải là định dạng ngày giờ hợp lệ' })
  checkInTime?: string;

  @ApiProperty({
    example: 'Ghi chú check-in',
    description: 'Ghi chú',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Ghi chú phải là chuỗi' })
  note?: string;
}

