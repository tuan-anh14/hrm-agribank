import { Injectable, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Prisma, Department } from '@prisma/client';

@Injectable()
export class DepartmentService {
  constructor(private prisma: PrismaService) {}

  async getAll(): Promise<Department[]> {
    return this.prisma.department.findMany({
      include: { _count: { select: { employees: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getById(id: string): Promise<Department> {
    const department = await this.prisma.department.findUnique({
      where: { id },
      include: { _count: { select: { employees: true } } },
    });
    if (!department) {
      throw new NotFoundException(`Department with ID ${id} not found`);
    }
    return department;
  }

  async create(data: { name: string; description?: string }): Promise<Department> {
    const existing = await this.prisma.department.findFirst({
      where: { name: { equals: data.name, mode: 'insensitive' } },
    });
    if (existing) {
      throw new ConflictException('Department name already exists');
    }
    try {
      return await this.prisma.department.create({ data });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Department name must be unique');
        }
      }
      throw new BadRequestException('Failed to create department');
    }
  }

  async update(id: string, data: { name?: string; description?: string }): Promise<Department> {
    if (data.name) {
      const conflict = await this.prisma.department.findFirst({
        where: {
          name: { equals: data.name, mode: 'insensitive' },
          NOT: { id },
        },
      });
      if (conflict) {
        throw new ConflictException('Department name already exists');
      }
    }
    try {
      return await this.prisma.department.update({ where: { id }, data });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Department with ID ${id} not found`);
        }
      }
      throw new BadRequestException('Failed to update department');
    }
  }

  async delete(id: string): Promise<Department> {
    const employeeCount = await this.prisma.employee.count({ where: { departmentId: id } });
    if (employeeCount > 0) {
      throw new BadRequestException('Cannot delete department with assigned employees');
    }
    try {
      return await this.prisma.department.delete({ where: { id } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Department with ID ${id} not found`);
        }
      }
      throw new BadRequestException('Failed to delete department');
    }
  }
}
