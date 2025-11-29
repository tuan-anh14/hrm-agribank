import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, Max, Min } from 'class-validator';

export class NotifyMonthAvailableDto {
  @ApiProperty({
    description: 'Tháng (1-12)',
    example: 5,
    minimum: 1,
    maximum: 12,
  })
  @IsNotEmpty({ message: 'Month không được để trống' })
  @IsInt({ message: 'Month phải là số nguyên' })
  @Min(1, { message: 'Month phải từ 1 đến 12' })
  @Max(12, { message: 'Month phải từ 1 đến 12' })
  month: number;

  @ApiProperty({
    description: 'Năm',
    example: 2024,
    minimum: 2020,
    maximum: 2100,
  })
  @IsNotEmpty({ message: 'Year không được để trống' })
  @IsInt({ message: 'Year phải là số nguyên' })
  @Min(2020, { message: 'Year phải từ 2020 đến 2100' })
  @Max(2100, { message: 'Year phải từ 2020 đến 2100' })
  year: number;
}

