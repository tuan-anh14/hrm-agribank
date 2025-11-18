import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsUUID, IsDateString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryAttendanceDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Lọc theo ID nhân viên',
    required: false,
  })
  @IsOptional()
  @IsUUID(4, { message: 'ID nhân viên phải là UUID hợp lệ' })
  employeeId?: string;

  @ApiProperty({
    example: '2024-01-01',
    description: 'Ngày bắt đầu (YYYY-MM-DD)',
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: 'Ngày bắt đầu phải là định dạng ngày hợp lệ (YYYY-MM-DD)' })
  startDate?: string;

  @ApiProperty({
    example: '2024-01-31',
    description: 'Ngày kết thúc (YYYY-MM-DD)',
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: 'Ngày kết thúc phải là định dạng ngày hợp lệ (YYYY-MM-DD)' })
  endDate?: string;

  @ApiProperty({
    example: 1,
    description: 'Trang hiện tại (bắt đầu từ 1)',
    required: false,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Số trang phải là số nguyên' })
  @Min(1, { message: 'Số trang phải lớn hơn 0' })
  page?: number = 1;

  @ApiProperty({
    example: 10,
    description: 'Số lượng bản ghi mỗi trang',
    required: false,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Số lượng bản ghi phải là số nguyên' })
  @Min(1, { message: 'Số lượng bản ghi phải lớn hơn 0' })
  @Max(100, { message: 'Số lượng bản ghi không được vượt quá 100' })
  limit?: number = 10;
}

