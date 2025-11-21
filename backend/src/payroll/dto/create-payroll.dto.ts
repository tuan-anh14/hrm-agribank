import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min, Max } from 'class-validator';

export class CreatePayrollDto {
    @ApiProperty({ example: 'uuid-employee-id' })
    @IsNotEmpty()
    @IsUUID()
    employeeId: string;

    @ApiProperty({ example: 11 })
    @IsNotEmpty()
    @IsInt()
    @Min(1)
    @Max(12)
    month: number;

    @ApiProperty({ example: 2025 })
    @IsNotEmpty()
    @IsInt()
    @Min(2000)
    year: number;

    @ApiProperty({ example: 1000000, required: false })
    @IsOptional()
    @IsNumber()
    bonus?: number;

    @ApiProperty({ example: 500000, required: false })
    @IsOptional()
    @IsNumber()
    allowance?: number;

    @ApiProperty({ example: 200000, required: false })
    @IsOptional()
    @IsNumber()
    deduction?: number;
}
