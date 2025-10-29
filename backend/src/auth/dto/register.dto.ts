import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional, IsDateString, IsEnum } from 'class-validator';

export enum Role {
  ADMIN = 'ADMIN',
  HR = 'HR',
  EMPLOYEE = 'EMPLOYEE'
}

export class RegisterDto {
  @ApiProperty({
    description: 'Họ và tên',
    example: 'Nguyễn Văn A'
  })
  @IsString({ message: 'Họ và tên phải là chuỗi' })
  @IsNotEmpty({ message: 'Họ và tên không được để trống' })
  fullName: string;

  @ApiProperty({
    description: 'Email',
    example: 'user@example.com'
  })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;

  @ApiProperty({
    description: 'Mật khẩu',
    example: 'password123',
    minLength: 6
  })
  @IsString({ message: 'Mật khẩu phải là chuỗi' })
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  password: string;

  @ApiProperty({
    description: 'Số điện thoại',
    example: '0123456789',
    required: false
  })
  @IsOptional()
  @IsString({ message: 'Số điện thoại phải là chuỗi' })
  phone?: string;

  @ApiProperty({
    description: 'Địa chỉ',
    example: '123 Đường ABC, Quận XYZ, TP.HCM',
    required: false
  })
  @IsOptional()
  @IsString({ message: 'Địa chỉ phải là chuỗi' })
  address?: string;

  @ApiProperty({
    description: 'Giới tính',
    example: 'Nam',
    required: false
  })
  @IsOptional()
  @IsString({ message: 'Giới tính phải là chuỗi' })
  gender?: string;

  @ApiProperty({
    description: 'Ngày sinh',
    example: '1990-01-01',
    required: false
  })
  @IsOptional()
  @IsDateString({}, { message: 'Ngày sinh không hợp lệ' })
  dateOfBirth?: string;

  @ApiProperty({
    description: 'Vai trò',
    enum: Role,
    example: Role.EMPLOYEE,
    required: false
  })
  @IsOptional()
  @IsEnum(Role, { message: 'Vai trò không hợp lệ' })
  role?: Role;

  @ApiProperty({
    description: 'ID vị trí',
    example: 'uuid-string',
    required: false
  })
  @IsOptional()
  @IsString({ message: 'ID vị trí phải là chuỗi' })
  positionId?: string;

  @ApiProperty({
    description: 'ID phòng ban',
    example: 'uuid-string',
    required: false
  })
  @IsOptional()
  @IsString({ message: 'ID phòng ban phải là chuỗi' })
  departmentId?: string;
}
