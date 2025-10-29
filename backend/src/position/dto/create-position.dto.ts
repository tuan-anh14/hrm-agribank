import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreatePositionDto {
  @ApiProperty({ example: 'Senior Developer' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title: string;

  @ApiProperty({ example: 1500 })
  @IsNumber()
  @IsPositive()
  baseSalary: number;

  @ApiProperty({ example: 200, required: false })
  @IsNumber()
  @IsOptional()
  @Min(0)
  allowance?: number;

  @ApiProperty({ example: 3, required: false, description: 'Cấp bậc chức vụ' })
  @IsInt()
  @IsOptional()
  @Min(0)
  @Max(20)
  gradeLevel?: number;
}


