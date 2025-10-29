import { Injectable, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Prisma, Position } from '@prisma/client';

@Injectable()
export class PositionService {
  constructor(private prisma: PrismaService) {}

  async getAll(): Promise<Position[]> {
    return this.prisma.position.findMany({
      include: { _count: { select: { employees: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getById(id: string): Promise<Position> {
    const position = await this.prisma.position.findUnique({
      where: { id },
      include: { _count: { select: { employees: true } } },
    });
    if (!position) {
      throw new NotFoundException(`Position with ID ${id} not found`);
    }
    return position;
  }

  async create(data: { title: string; baseSalary: number; allowance?: number; gradeLevel?: number }): Promise<Position> {
    const existing = await this.prisma.position.findFirst({
      where: { title: { equals: data.title, mode: 'insensitive' } },
    });
    if (existing) {
      throw new ConflictException('Position title already exists');
    }
    try {
      return await this.prisma.position.create({ data });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Position title must be unique');
        }
      }
      throw new BadRequestException('Failed to create position');
    }
  }

  async update(id: string, data: { title?: string; baseSalary?: number; allowance?: number; gradeLevel?: number }): Promise<Position> {
    if (data.title) {
      const conflict = await this.prisma.position.findFirst({
        where: {
          title: { equals: data.title, mode: 'insensitive' },
          NOT: { id },
        },
      });
      if (conflict) {
        throw new ConflictException('Position title already exists');
      }
    }
    try {
      return await this.prisma.position.update({ where: { id }, data });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Position with ID ${id} not found`);
        }
      }
      throw new BadRequestException('Failed to update position');
    }
  }

  async delete(id: string): Promise<Position> {
    const employeeCount = await this.prisma.employee.count({ where: { positionId: id } });
    if (employeeCount > 0) {
      throw new BadRequestException('Cannot delete position with assigned employees');
    }
    try {
      return await this.prisma.position.delete({ where: { id } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Position with ID ${id} not found`);
        }
      }
      throw new BadRequestException('Failed to delete position');
    }
  }
}
