import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Put,
  } from '@nestjs/common';
  import { EmployeeService } from './employee.service';
  import { CreateEmployeeDto } from './dto/create-employee.dto';
  import { UpdateEmployeeDto } from './dto/update-employee.dto';
  
  @Controller('employee')
  export class EmployeeController {
    constructor(private readonly employeeService: EmployeeService) {}
  
    @Get()
    async getAll() {
      return this.employeeService.getAll();
    }
  
    @Get(':id')
    async getById(@Param('id') id: string) {
      return this.employeeService.getById(id);
    }
  
    @Post()
    async create(@Body() data: CreateEmployeeDto) {
      return this.employeeService.create(data);
    }
  
    @Put(':id')
    async update(@Param('id') id: string, @Body() data: UpdateEmployeeDto) {
      return this.employeeService.update(id, data);
    }
  
    @Delete(':id')
    async delete(@Param('id') id: string) {
      return this.employeeService.delete(id);
    }
  }
  