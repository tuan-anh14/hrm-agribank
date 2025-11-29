import { Injectable, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Prisma, Position, AuditAction, AuditModule, AuditStatus } from '@prisma/client';
import { AuditLogService } from '@/audit-log/audit-log.service';

@Injectable()
export class PositionService {
  constructor(
    private prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

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
      const position = await this.prisma.position.create({ data });

      await this.auditLogService.createLog({
        module: AuditModule.POSITION,
        action: AuditAction.CREATE,
        status: AuditStatus.SUCCESS,
        entityName: 'Position',
        entityId: position.id,
        afterData: position,
        description: `Tạo chức danh ${position.title}`,
      });

      return position;
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
      const before = await this.prisma.position.findUnique({ where: { id } });
      if (!before) {
        throw new NotFoundException(`Position with ID ${id} not found`);
      }

      const position = await this.prisma.position.update({ where: { id }, data });

      await this.auditLogService.createLog({
        module: AuditModule.POSITION,
        action: AuditAction.UPDATE,
        status: AuditStatus.SUCCESS,
        entityName: 'Position',
        entityId: position.id,
        beforeData: before,
        afterData: position,
        description: `Cập nhật chức danh ${position.title}`,
      });

      return position;
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
      const before = await this.prisma.position.findUnique({ where: { id } });

      const position = await this.prisma.position.delete({ where: { id } });

      await this.auditLogService.createLog({
        module: AuditModule.POSITION,
        action: AuditAction.DELETE,
        status: AuditStatus.SUCCESS,
        entityName: 'Position',
        entityId: id,
        beforeData: before ?? undefined,
        description: `Xóa chức danh với ID ${id}`,
      });

      return position;
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
