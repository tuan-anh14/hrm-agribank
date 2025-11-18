import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateShiftDto {
  @ApiProperty({ example: 'Ca sáng' })
  @IsString({ message: 'Tên ca phải là chuỗi' })
  @IsNotEmpty({ message: 'Tên ca không được để trống' })
  @MaxLength(100, { message: 'Tên ca không được quá 100 ký tự' })
  name: string;

  @ApiProperty({
    example: '2025-11-18T08:30:00.000Z',
    description: 'Giờ bắt đầu (ISO string)',
  })
  @IsDateString({}, { message: 'Giờ bắt đầu phải là định dạng ISO hợp lệ' })
  startTime: string;

  @ApiProperty({
    example: '2025-11-18T17:30:00.000Z',
    description: 'Giờ kết thúc (ISO string)',
  })
  @IsDateString({}, { message: 'Giờ kết thúc phải là định dạng ISO hợp lệ' })
  endTime: string;

  @ApiProperty({
    example: 'Ca sáng chuẩn từ 8h30-17h30',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Mô tả phải là chuỗi' })
  @MaxLength(255, { message: 'Mô tả không được quá 255 ký tự' })
  description?: string;
}

