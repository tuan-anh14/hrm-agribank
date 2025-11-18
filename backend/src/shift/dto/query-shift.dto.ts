import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryShiftDto {
  @ApiProperty({
    example: 'Ca sáng',
    description: 'Tìm kiếm theo tên ca',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Tên ca phải là chuỗi' })
  search?: string;

  @ApiProperty({ example: 1, required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Trang phải là số nguyên' })
  @Min(1, { message: 'Trang phải lớn hơn 0' })
  page?: number = 1;

  @ApiProperty({ example: 10, required: false, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Giới hạn phải là số nguyên' })
  @Min(1, { message: 'Giới hạn tối thiểu 1' })
  @Max(100, { message: 'Giới hạn tối đa 100' })
  limit?: number = 10;
}

