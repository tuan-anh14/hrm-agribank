import { Injectable, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Prisma, Department, AuditAction, AuditModule, AuditStatus } from '@prisma/client';
import { AuditLogService } from '@/audit-log/audit-log.service';

@Injectable()
export class DepartmentService {
  constructor(
    private prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

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
      const department = await this.prisma.department.create({ data });

      await this.auditLogService.createLog({
        module: AuditModule.DEPARTMENT,
        action: AuditAction.CREATE,
        status: AuditStatus.SUCCESS,
        entityName: 'Department',
        entityId: department.id,
        afterData: department,
        description: `Tạo phòng ban ${department.name}`,
      });

      return department;
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
      const before = await this.prisma.department.findUnique({ where: { id } });
      if (!before) {
        throw new NotFoundException(`Department with ID ${id} not found`);
      }

      const department = await this.prisma.department.update({ where: { id }, data });

      await this.auditLogService.createLog({
        module: AuditModule.DEPARTMENT,
        action: AuditAction.UPDATE,
        status: AuditStatus.SUCCESS,
        entityName: 'Department',
        entityId: department.id,
        beforeData: before,
        afterData: department,
        description: `Cập nhật phòng ban ${department.name}`,
      });

      return department;
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
      const before = await this.prisma.department.findUnique({ where: { id } });

      const department = await this.prisma.department.delete({ where: { id } });

      await this.auditLogService.createLog({
        module: AuditModule.DEPARTMENT,
        action: AuditAction.DELETE,
        status: AuditStatus.SUCCESS,
        entityName: 'Department',
        entityId: id,
        beforeData: before ?? undefined,
        description: `Xóa phòng ban với ID ${id}`,
      });

      return department;
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
