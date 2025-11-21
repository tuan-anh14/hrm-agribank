import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreatePayrollDto } from './dto/create-payroll.dto';
import { EmployeeType, Prisma } from '@prisma/client';

@Injectable()
export class PayrollService {
    constructor(private prisma: PrismaService) { }

    async generatePayrollForMonth(month: number, year: number) {
        // 1. Get all active employees with their position
        const employees = await this.prisma.employee.findMany({
            where: { status: 'working' },
            include: { position: true },
        });

        // 2. Prepare date range
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);

        // Calculate standard work days (excluding weekends - Sat/Sun)
        // Agribank rule: Standard working days usually exclude weekends
        let standardDays = 0;
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const day = d.getDay();
            if (day !== 0 && day !== 6) standardDays++;
        }
        const standardWorkHours = standardDays * 8;

        // 3. Batch fetch all attendances for the month
        const allAttendances = await this.prisma.attendance.findMany({
            where: {
                date: { gte: startDate, lte: endDate },
                status: { not: 'ABSENT' },
            },
        });

        // Group attendances by employeeId
        const attendanceMap = new Map<string, any[]>();
        allAttendances.forEach(att => {
            if (!attendanceMap.has(att.employeeId)) {
                attendanceMap.set(att.employeeId, []);
            }
            attendanceMap.get(att.employeeId)!.push(att);
        });

        // 4. Process each employee (Parallel processing)
        const payrollPromises = employees.map(async (employee) => {
            const empAttendances = attendanceMap.get(employee.id) || [];

            let totalWorkHours = 0;
            // Calculate actual work hours
            for (const att of empAttendances) {
                if (att?.checkInTime && att?.checkOutTime) {
                    const diff = att.checkOutTime.getTime() - att.checkInTime.getTime();
                    // Convert to hours and round to 2 decimal places
                    const hours = Math.round((diff / (1000 * 60 * 60)) * 100) / 100;
                    totalWorkHours += hours;
                }
            }

            // Calculate Salary
            let totalSalary = 0;
            let totalWorkAmount = 0;
            let deduction = 0;

            if (employee.type === EmployeeType.FULL_TIME) {
                // Full-time: Base Salary * Coefficient
                const base = employee.position?.baseSalary || 0;
                const coeff = employee.salaryCoefficient || 1.0;
                const salaryPerMonth = base * coeff;

                // Deduction logic for missing hours (Simple version)
                // If actual hours < standard hours, deduct proportionally?
                // For Agribank (State-owned), usually fixed unless unpaid leave.
                // Let's keep it fixed for now but ready for deduction logic.

                totalWorkAmount = salaryPerMonth;

                // Example deduction: Late/Early penalties could be added here
                // deduction = ...

                totalSalary = totalWorkAmount + (employee.position?.allowance || 0) - deduction;
            } else {
                // Part-time: Hourly Rate * Actual Hours
                const rate = employee.hourlyRate || 0;
                totalWorkAmount = rate * totalWorkHours;
                totalSalary = totalWorkAmount;
            }

            // Round final amounts
            totalWorkAmount = Math.round(totalWorkAmount);
            totalSalary = Math.round(totalSalary);

            // Prepare data
            const data: Prisma.PayrollCreateInput = {
                employee: { connect: { id: employee.id } },
                month,
                year,
                salaryCoefficient: employee.salaryCoefficient,
                baseSalary: employee.position?.baseSalary,
                standardWorkHours,
                overtimeHours: 0, // TODO: Implement OT logic
                totalWorkAmount,
                totalOTAmount: 0,
                allowance: employee.position?.allowance || 0,
                bonus: 0,
                deduction,
                totalSalary,
                status: 'pending',
            };

            // Upsert (Check existing inside the transaction or logic)
            // Since we are inside a map, we can't easily use a single transaction for all.
            // But we can use upsert if we had a unique constraint on (employeeId, month, year).
            // Currently schema doesn't enforce unique(employeeId, month, year) but it should.
            // We will use findFirst + update/create pattern but optimized.

            const existing = await this.prisma.payroll.findFirst({
                where: { employeeId: employee.id, month, year }
            });

            if (existing) {
                return this.prisma.payroll.update({
                    where: { id: existing.id },
                    data: {
                        ...data,
                        employee: undefined,
                    } as Prisma.PayrollUpdateInput,
                });
            } else {
                return this.prisma.payroll.create({ data });
            }
        });

        // Execute all promises
        return Promise.all(payrollPromises);
    }

    async getAll(query: any) {
        return this.prisma.payroll.findMany({
            where: query,
            include: { employee: true },
            orderBy: { year: 'desc', month: 'desc' },
        });
    }

    async getById(id: string) {
        const payroll = await this.prisma.payroll.findUnique({
            where: { id },
            include: { employee: true },
        });
        if (!payroll) throw new NotFoundException('Payroll not found');
        return payroll;
    }
}
