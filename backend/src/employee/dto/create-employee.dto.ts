import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID, IsDateString } from 'class-validator';

export class CreateEmployeeDto {
  @ApiProperty({ 
    example: 'Nguyễn Văn A', 
    description: 'Họ và tên nhân viên',
    minLength: 2,
    maxLength: 100
  })
  @IsNotEmpty({ message: 'Họ và tên không được để trống' })
  @IsString({ message: 'Họ và tên phải là chuỗi' })
  fullName: string;

  @ApiProperty({ 
    example: 'Nam', 
    description: 'Giới tính',
    required: false,
    enum: ['Nam', 'Nữ', 'Khác']
  })
  @IsOptional()
  @IsString({ message: 'Giới tính phải là chuỗi' })
  gender?: string;

  @ApiProperty({ 
    example: 'a.nguyen@agribank.vn', 
    description: 'Email nhân viên',
    required: false
  })
  @IsOptional()
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email?: string;

  @ApiProperty({ 
    example: '0123456789', 
    description: 'Số điện thoại',
    required: false,
    pattern: '^[0-9]{10,11}$'
  })
  @IsOptional()
  @IsString({ message: 'Số điện thoại phải là chuỗi' })
  phone?: string;

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
    enum: ['working', 'on_leave', 'terminated']
  })
  @IsOptional()
  @IsString({ message: 'Trạng thái phải là chuỗi' })
  status?: string;

  @ApiProperty({ 
    example: '1990-01-01', 
    description: 'Ngày sinh',
    required: false
  })
  @IsOptional()
  @IsDateString({}, { message: 'Ngày sinh phải là định dạng ngày hợp lệ' })
  dateOfBirth?: string;

  @ApiProperty({ 
    example: '123 Đường ABC, Quận 1, TP.HCM', 
    description: 'Địa chỉ',
    required: false
  })
  @IsOptional()
  @IsString({ message: 'Địa chỉ phải là chuỗi' })
  address?: string;
}
