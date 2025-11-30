import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryMessageDto {
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
    example: 50,
    description: 'Số bản ghi mỗi trang',
    required: false,
    default: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Số bản ghi phải là số nguyên' })
  @Min(1, { message: 'Số bản ghi phải lớn hơn 0' })
  @Max(100, { message: 'Số bản ghi tối đa 100' })
  limit?: number = 50;
}

