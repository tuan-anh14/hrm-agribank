import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Employee } from '@prisma/client';

@Injectable()
export class EmployeeService {
  constructor(private prisma: PrismaService) {}

  async getAll(): Promise<Employee[]> {
    return this.prisma.employee.findMany({
      include: { department: true, position: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getById(id: string): Promise<Employee | null> {
    return this.prisma.employee.findUnique({
      where: { id },
      include: { department: true, position: true },
    });
  }

  async create(data: any): Promise<Employee> {
    return this.prisma.employee.create({
      data,
    });
  }

  async update(id: string, data: any): Promise<Employee> {
    return this.prisma.employee.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<Employee> {
    return this.prisma.employee.delete({
      where: { id },
    });
  }
}
