import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID, IsDateString, IsEnum } from 'class-validator';
import { AttendanceStatus } from '@prisma/client';

export class CreateAttendanceDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID nhân viên',
  })
  @IsNotEmpty({ message: 'ID nhân viên không được để trống' })
  @IsUUID(4, { message: 'ID nhân viên phải là UUID hợp lệ' })
  employeeId: string;

  @ApiProperty({
    example: '2024-01-15',
    description: 'Ngày chấm công (YYYY-MM-DD)',
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: 'Ngày chấm công phải là định dạng ngày hợp lệ (YYYY-MM-DD)' })
  date?: string;

  @ApiProperty({
    example: '2024-01-15T08:00:00Z',
    description: 'Giờ check-in (ISO 8601)',
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: 'Giờ check-in phải là định dạng ngày giờ hợp lệ' })
  checkInTime?: string;

  @ApiProperty({
    example: '2024-01-15T17:00:00Z',
    description: 'Giờ check-out (ISO 8601)',
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: 'Giờ check-out phải là định dạng ngày giờ hợp lệ' })
  checkOutTime?: string;

  @ApiProperty({
    example: 'ON_TIME',
    description: 'Trạng thái chấm công',
    enum: AttendanceStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(AttendanceStatus, { message: 'Trạng thái chấm công không hợp lệ' })
  status?: AttendanceStatus;

  @ApiProperty({
    example: 'Ghi chú về chấm công',
    description: 'Ghi chú',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Ghi chú phải là chuỗi' })
  note?: string;
}

