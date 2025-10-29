import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Employee, Account } from '@prisma/client';
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
