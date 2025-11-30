import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateDirectMessageRoomDto {
  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    description: 'ID của nhân viên đối phương (có thể là Account ID hoặc Employee ID)',
  })
  @IsUUID(4, { message: 'ID nhân viên phải là UUID hợp lệ' })
  @IsNotEmpty({ message: 'ID nhân viên không được để trống' })
  @IsString({ message: 'ID nhân viên phải là chuỗi' })
  otherUserId: string;
}

