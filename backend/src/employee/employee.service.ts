import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Employee, Account, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';

type EmployeeWithAccount = Employee & {
  account?: Account | null;
  department?: any;
  position?: any;
};

@Injectable()
export class EmployeeService {
  constructor(private prisma: PrismaService) {}

  async getAll(): Promise<Employee[]> {
    return this.prisma.employee.findMany({
      include: { department: true, position: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getById(id: string): Promise<Employee> {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: { department: true, position: true },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }

    return employee;
  }

  async create(data: any): Promise<Employee> {
    try {
      return await this.prisma.employee.create({
        data,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Email already exists');
        }
      }
      throw new BadRequestException('Failed to create employee');
    }
  }

  async update(id: string, data: any): Promise<Employee> {
    try {
      return await this.prisma.employee.update({
        where: { id },
        data,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Employee with ID ${id} not found`);
        }
        if (error.code === 'P2002') {
          throw new ConflictException('Email already exists');
        }
      }
      throw new BadRequestException('Failed to update employee');
    }
  }

  async delete(id: string): Promise<Employee> {
    try {
      return await this.prisma.employee.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Employee with ID ${id} not found`);
        }
      }
      throw new BadRequestException('Failed to delete employee');
    }
  }

  async findOneByUsername(username: string): Promise<EmployeeWithAccount | null> {
    return this.prisma.employee.findFirst({
      where: { email: username },
      include: { 
        department: true, 
        position: true,
        account: true
      },
    });
  }

  async isValidPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  async createAccount(data: any): Promise<Account> {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    return this.prisma.account.create({
      data: {
        username: data.username,
        password: hashedPassword,
        role: data.role || 'EMPLOYEE',
        isActive: true,
        employeeId: data.employeeId
      }
    });
  }
}
