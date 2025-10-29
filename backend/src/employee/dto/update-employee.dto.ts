import { PartialType } from '@nestjs/mapped-types';
import { CreateEmployeeDto } from '@/employee/dto/create-employee.dto';

export class UpdateEmployeeDto extends PartialType(CreateEmployeeDto) {}
