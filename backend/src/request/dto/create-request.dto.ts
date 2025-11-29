import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class CreateRequestDto {
  @ApiProperty({
    example: 'd3c5a0de-4c40-4a21-9384-2d959f996b2f',
    description: 'ID nhân viên',
  })
  @IsUUID(4, { message: 'ID nhân viên phải là UUID hợp lệ' })
  @IsNotEmpty({ message: 'ID nhân viên không được để trống' })
  employeeId: string;

  @ApiProperty({
    example: '039b53f2-4ae5-4c41-8c5a-2530502e90a3',
    description: 'ID loại đơn',
  })
  @IsUUID(4, { message: 'ID loại đơn phải là UUID hợp lệ' })
  @IsNotEmpty({ message: 'ID loại đơn không được để trống' })
  requestTypeId: string;

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

