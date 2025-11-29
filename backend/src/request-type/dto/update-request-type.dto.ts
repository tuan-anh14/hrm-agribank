import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateRequestTypeDto {
  @ApiProperty({
    example: 'Nghỉ phép có lương',
    description: 'Tên loại đơn',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Tên loại đơn phải là chuỗi' })
  @MaxLength(100, { message: 'Tên loại đơn không được quá 100 ký tự' })
  name?: string;

  @ApiProperty({
    example: 'Đơn xin nghỉ phép có hưởng lương theo quy định',
    description: 'Mô tả loại đơn',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Mô tả phải là chuỗi' })
  @MaxLength(500, { message: 'Mô tả không được quá 500 ký tự' })
  description?: string;
}

