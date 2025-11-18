import { PartialType } from '@nestjs/swagger';
import { CreateWorkScheduleDto } from './create-workschedule.dto';

export class UpdateWorkScheduleDto extends PartialType(CreateWorkScheduleDto) {}

