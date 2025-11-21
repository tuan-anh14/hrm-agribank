import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateWorkScheduleDto {
  @ApiProperty({
    example: 'd3c5a0de-4c40-4a21-9384-2d959f996b2f',
    description: 'ID nhân viên',
  })
  @IsUUID(4, { message: 'ID nhân viên phải là UUID hợp lệ' })
  @IsNotEmpty({ message: 'ID nhân viên không được để trống' })
  employeeId: string;

  @ApiProperty({
    example: '039b53f2-4ae5-4c41-8c5a-2530502e90a3',
    description: 'ID ca làm việc',
    required: false,
  })
  @IsUUID(4, { message: 'ID ca làm việc phải là UUID hợp lệ' })
  @IsOptional()
  shiftId?: string;

  @ApiProperty({
    example: '2025-11-18',
    description: 'Ngày làm việc',
  })
  @IsDateString({}, { message: 'Ngày làm việc phải là định dạng ngày hợp lệ (YYYY-MM-DD)' })
  @IsNotEmpty({ message: 'Ngày làm việc không được để trống' })
  date: string;

  @ApiProperty({
    example: 'Làm ca sáng hỗ trợ hội nghị',
    description: 'Ghi chú',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Ghi chú phải là chuỗi' })
  @MaxLength(500, { message: 'Ghi chú không được quá 500 ký tự' })
  note?: string;
}

