import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class UpdateRequestDto {
  @ApiProperty({
    example: '039b53f2-4ae5-4c41-8c5a-2530502e90a3',
    description: 'ID loại đơn',
    required: false,
  })
  @IsOptional()
  @IsUUID(4, { message: 'ID loại đơn phải là UUID hợp lệ' })
  requestTypeId?: string;

  @ApiProperty({
    example: 'Nghỉ phép để về quê thăm gia đình',
    description: 'Lý do xin đơn',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Lý do phải là chuỗi' })
  @MaxLength(500, { message: 'Lý do không được quá 500 ký tự' })
  reason?: string;

  @ApiProperty({
    example: '2025-01-15',
    description: 'Ngày bắt đầu (YYYY-MM-DD)',
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: 'Ngày bắt đầu phải là định dạng ngày hợp lệ (YYYY-MM-DD)' })
  startDate?: string;

  @ApiProperty({
    example: '2025-01-17',
    description: 'Ngày kết thúc (YYYY-MM-DD)',
    required: false,
  })
  @IsOptional()
  @ValidateIf((o) => o.startDate !== undefined)
  @IsDateString({}, { message: 'Ngày kết thúc phải là định dạng ngày hợp lệ (YYYY-MM-DD)' })
  endDate?: string;
}

