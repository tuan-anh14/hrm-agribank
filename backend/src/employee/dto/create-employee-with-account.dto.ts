import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID, IsDateString, MinLength, IsEnum } from 'class-validator';
import { Role } from '@/auth/dto/register.dto';

export class CreateEmployeeWithAccountDto {
  @ApiProperty({ 
    example: 'Nguyễn Văn A', 
    description: 'Họ và tên nhân viên'
  })
  @IsNotEmpty({ message: 'Họ và tên không được để trống' })
  @IsString({ message: 'Họ và tên phải là chuỗi' })
  fullName: string;

  @ApiProperty({ 
    example: 'a.nguyen@agribank.vn', 
    description: 'Email nhân viên (sẽ dùng làm username)'
  })
  @IsNotEmpty({ message: 'Email không được để trống' })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @ApiProperty({ 
    example: 'password123', 
    description: 'Mật khẩu cho tài khoản',
    minLength: 6
  })
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @IsString({ message: 'Mật khẩu phải là chuỗi' })
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  password: string;

  @ApiProperty({ 
    example: 'EMPLOYEE', 
    description: 'Vai trò',
    enum: Role,
    default: 'EMPLOYEE'
  })
  @IsOptional()
  @IsEnum(Role, { message: 'Vai trò không hợp lệ' })
  role?: Role;

  @ApiProperty({ 
    example: 'Nam', 
    description: 'Giới tính',
    required: false
  })
  @IsOptional()
  @IsString({ message: 'Giới tính phải là chuỗi' })
  gender?: string;

  @ApiProperty({ 
    example: '0123456789', 
    description: 'Số điện thoại',
    required: false
  })
  @IsOptional()
  @IsString({ message: 'Số điện thoại phải là chuỗi' })
  phone?: string;

  @ApiProperty({ 
    example: '123 Đường ABC, Quận 1, TP.HCM', 
    description: 'Địa chỉ',
    required: false
  })
  @IsOptional()
  @IsString({ message: 'Địa chỉ phải là chuỗi' })
  address?: string;

  @ApiProperty({ 
    example: '1990-01-01', 
    description: 'Ngày sinh',
    required: false
  })
  @IsOptional()
  @IsDateString({}, { message: 'Ngày sinh không hợp lệ' })
  dateOfBirth?: string;

  @ApiProperty({ 
    example: '123e4567-e89b-12d3-a456-426614174000', 
    description: 'ID phòng ban',
    required: false
  })
  @IsOptional()
  @IsUUID(4, { message: 'ID phòng ban phải là UUID hợp lệ' })
  departmentId?: string;

  @ApiProperty({ 
    example: '123e4567-e89b-12d3-a456-426614174001', 
    description: 'ID vị trí',
    required: false
  })
  @IsOptional()
  @IsUUID(4, { message: 'ID vị trí phải là UUID hợp lệ' })
  positionId?: string;

  @ApiProperty({ 
    example: 'working', 
    description: 'Trạng thái làm việc',
    required: false,
    default: 'working'
  })
  @IsOptional()
  @IsString({ message: 'Trạng thái phải là chuỗi' })
  status?: string;
}

