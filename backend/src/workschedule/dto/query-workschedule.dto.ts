import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { RequestStatus } from '@prisma/client';

export class QueryWorkScheduleDto {
  @ApiProperty({
    example: 'd3c5a0de-4c40-4a21-9384-2d959f996b2f',
    description: 'Lọc theo ID nhân viên',
    required: false,
  })
  @IsOptional()
  @IsUUID(4, { message: 'ID nhân viên phải là UUID hợp lệ' })
  employeeId?: string;

  @ApiProperty({
    example: '039b53f2-4ae5-4c41-8c5a-2530502e90a3',
    description: 'Lọc theo ID ca làm việc',
    required: false,
  })
  @IsOptional()
  @IsUUID(4, { message: 'ID ca làm việc phải là UUID hợp lệ' })
  shiftId?: string;

  @ApiProperty({
    example: '2025-11-01',
    description: 'Ngày bắt đầu (YYYY-MM-DD)',
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: 'Ngày bắt đầu phải là định dạng ngày hợp lệ (YYYY-MM-DD)' })
  startDate?: string;

  @ApiProperty({
    example: '2025-11-30',
    description: 'Ngày kết thúc (YYYY-MM-DD)',
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: 'Ngày kết thúc phải là định dạng ngày hợp lệ (YYYY-MM-DD)' })
  endDate?: string;

  @ApiProperty({
    example: 'APPROVED',
    description: 'Trạng thái lịch làm việc',
    required: false,
    enum: RequestStatus,
  })
  @IsOptional()
  @IsEnum(RequestStatus, { message: 'Trạng thái không hợp lệ' })
  status?: RequestStatus;

  @ApiProperty({
    example: 1,
    description: 'Trang hiện tại',
    required: false,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Trang phải là số nguyên' })
  @Min(1, { message: 'Trang phải lớn hơn 0' })
  page?: number = 1;

  @ApiProperty({
    example: 10,
    description: 'Số bản ghi mỗi trang',
    required: false,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Số bản ghi phải là số nguyên' })
  @Min(1, { message: 'Số bản ghi phải lớn hơn 0' })
  @Max(100, { message: 'Số bản ghi tối đa 100' })
  limit?: number = 10;
}

