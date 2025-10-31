import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, Length, MinLength, IsDateString } from 'class-validator';

export class ActivateAccountDto {
  @ApiProperty({ description: 'Mã nhân viên', required: false })
  @IsOptional()
  @IsString()
  employeeCode?: string;

  @ApiProperty({ description: 'Email cơ quan', example: 'user@agribank.com.vn' })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty({ message: 'Email cơ quan không được để trống' })
  workEmail: string;

  @ApiProperty({ description: '4 số cuối CCCD', required: false })
  @IsOptional()
  @Length(4, 4, { message: '4 số cuối CCCD phải có đúng 4 ký tự' })
  idLast4?: string;

  @ApiProperty({ description: 'Ngày sinh (yyyy-MM-dd)', required: false })
  @IsOptional()
  @IsDateString({}, { message: 'Ngày sinh không hợp lệ' })
  dob?: string;

  @ApiProperty({ description: 'Mật khẩu mới', minLength: 6 })
  @IsString({ message: 'Mật khẩu phải là chuỗi' })
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  newPassword: string;
}


