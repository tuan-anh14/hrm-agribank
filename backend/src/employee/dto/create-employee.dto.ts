import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateEmployeeDto {
  @ApiProperty({ example: 'Nguyễn Văn A', description: 'Họ và tên nhân viên' })
  @IsNotEmpty()
  @IsString()
  fullName: string;

  @ApiProperty({ example: 'Nam', required: false })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiProperty({ example: 'a.nguyen@agribank.vn', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: '0123456789', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'Phòng Tín dụng', required: false })
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiProperty({ example: 'Nhân viên', required: false })
  @IsOptional()
  @IsString()
  positionId?: string;

  @ApiProperty({ example: 'working', required: false })
  @IsOptional()
  @IsString()
  status?: string;
}
