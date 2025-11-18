import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { RequestStatus } from '@prisma/client';

const APPROVAL_STATUSES = [RequestStatus.APPROVED, RequestStatus.REJECTED] as const;

export class ApproveWorkScheduleDto {
  @ApiProperty({
    example: 'APPROVED',
    description: 'Trạng thái phê duyệt',
    enum: APPROVAL_STATUSES,
  })
  @IsEnum(APPROVAL_STATUSES, { message: 'Trạng thái phê duyệt không hợp lệ' })
  @IsNotEmpty({ message: 'Trạng thái phê duyệt không được để trống' })
  status: (typeof APPROVAL_STATUSES)[number];

  @ApiProperty({
    example: 'Đồng ý làm thêm ca tối',
    description: 'Ghi chú phê duyệt',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Ghi chú phải là chuỗi' })
  @MaxLength(500, { message: 'Ghi chú không được quá 500 ký tự' })
  note?: string;
}

