import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { RewardPenaltyService } from '../reward-penalty/reward-penalty.service';
import {
    AuditAction,
    AuditModule,
    AuditStatus,
    EmployeeType,
    Prisma,
    RewardPenaltyType,
} from '@prisma/client';
import { AuditLogService } from '@/audit-log/audit-log.service';
import { NotificationService } from '@/notification/notification.service';
import {
    notifyPayrollCreated,
    notifyPayrollPaid,
} from '@/notification/notification-templates.helper';

@Injectable()
export class PayrollService {
    constructor(
        private prisma: PrismaService,
        private rewardPenaltyService: RewardPenaltyService,
        private readonly auditLogService: AuditLogService,
        private readonly notificationService: NotificationService,
    ) { }

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
        // Note: In simplified model, we don't strictly use this for Full-time salary anymore,
        // but we keep it for reference or potential future use.
        let standardDays = 0;
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const day = d.getDay();
            if (day !== 0 && day !== 6) standardDays++;
        }
        if (standardDays === 0) standardDays = 22;

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

        // 4. Process each employee
        const payrollPromises = employees.map(async (employee) => {
            const empAttendances = attendanceMap.get(employee.id) || [];

            // --- A. Calculate Time & Attendance ---
            let totalWorkHours = 0;
            let actualWorkDays = 0;
            let lateMinutes = 0;
            let earlyMinutes = 0;

            for (const att of empAttendances) {
                if (att?.checkInTime && att?.checkOutTime) {
                    const diff = att.checkOutTime.getTime() - att.checkInTime.getTime();
                    const hours = Math.round((diff / (1000 * 60 * 60)) * 100) / 100;
                    totalWorkHours += hours;

                    // Count as 1 day if worked >= 4 hours, else 0.5 or 0? 
                    // Agribank: usually count by half-day blocks. 
                    // Simplified: > 4h = 1 day, > 0 = 0.5 day
                    if (hours >= 4) actualWorkDays += 1;
                    else if (hours > 0) actualWorkDays += 0.5;
                }
                lateMinutes += att.lateMinutes || 0;
                earlyMinutes += att.earlyMinutes || 0;
            }

            // --- B. Fetch Rewards & Penalties ---
            const rewardsPenalties = await this.rewardPenaltyService.getMonthlyRewards(employee.id, month, year);
            const totalReward = rewardsPenalties
                .filter(r => r.type === RewardPenaltyType.REWARD)
                .reduce((sum, r) => sum + r.amount, 0);
            const totalPenalty = rewardsPenalties
                .filter(r => r.type === RewardPenaltyType.PENALTY)
                .reduce((sum, r) => sum + r.amount, 0);

            // --- C. Calculate Salary Components ---
            let salaryV1 = 0; // Lương ngạch bậc
            let salaryV2 = 0; // Lương kinh doanh
            let allowance = employee.position?.allowance || 0;
            let totalWorkAmount = 0;
            let insuranceDeduction = 0;
            let taxDeduction = 0;
            let otherDeduction = 0;
            let totalSalary = 0;

            if (employee.type === EmployeeType.FULL_TIME) {
                // 1. Salary V1: Base * Coefficient
                const base = employee.position?.baseSalary || 0;
                const coeff = employee.salaryCoefficient || 1.0;
                salaryV1 = base * coeff;

                // 2. Salary V2: Removed in simplified model.
                // Full-time employees receive fixed salary regardless of actual days (unless unpaid leave).
                // "Unpaid leave" should be handled via Penalties or separate logic if needed.
                salaryV2 = 0;

                // 3. Total Work Amount (Gross before deductions)
                totalWorkAmount = salaryV1 + allowance;

                // 4. Deductions
                // a. Insurance: 10.5% of V1 (Social 8% + Health 1.5% + Unemployment 1%)
                insuranceDeduction = salaryV1 * 0.105;

                // b. Other Deductions (Penalties only)
                // Late/Early fines are now auto-generated as Penalties.
                otherDeduction = totalPenalty;

                // c. Tax (PIT)
                // Taxable Income = Total - Insurance - Personal Deduction (11M) - Dependent Deduction (4.4M/person)
                // Simplified: Taxable = Total - Insurance - 11,000,000
                const taxableIncome = totalWorkAmount + totalReward - insuranceDeduction - 11000000;
                if (taxableIncome > 0) {
                    // Simplified progressive tax (5% for first 5M, 10% next, etc.)
                    // For demo: flat 5% on taxable
                    taxDeduction = taxableIncome * 0.05;
                }

                // 5. Final Net Salary
                totalSalary = totalWorkAmount + totalReward - insuranceDeduction - taxDeduction - otherDeduction;

            } else {
                // Part-time: Hourly Rate * Actual Hours
                const rate = employee.hourlyRate || 0;
                totalWorkAmount = rate * totalWorkHours;

                // No V1/V2/Insurance for Part-time usually
                totalSalary = totalWorkAmount + totalReward - totalPenalty;
            }

            // Rounding
            salaryV1 = Math.round(salaryV1);
            salaryV2 = Math.round(salaryV2);
            insuranceDeduction = Math.round(insuranceDeduction);
            taxDeduction = Math.round(taxDeduction);
            otherDeduction = Math.round(otherDeduction);
            totalSalary = Math.round(totalSalary);

            // Prepare data
            const data: Prisma.PayrollCreateInput = {
                employee: { connect: { id: employee.id } },
                month,
                year,
                salaryCoefficient: employee.salaryCoefficient,
                baseSalary: employee.position?.baseSalary,
                standardWorkHours,
                overtimeHours: 0, // TODO

                salaryV1,
                salaryV2,
                actualWorkDays,

                totalWorkAmount,
                totalOTAmount: 0,
                allowance,
                bonus: totalReward,

                insuranceDeduction,
                taxDeduction,
                otherDeduction,

                totalSalary,
                status: 'pending',
            };

            const existing = await this.prisma.payroll.findFirst({
                where: { employeeId: employee.id, month, year }
            });

            let payroll;
            if (existing) {
                payroll = await this.prisma.payroll.update({
                    where: { id: existing.id },
                    data: {
                        ...data,
                        employee: undefined,
                    } as Prisma.PayrollUpdateInput,
                });
            } else {
                payroll = await this.prisma.payroll.create({ data });
            }

            await this.auditLogService.createLog({
                module: AuditModule.PAYROLL,
                action: AuditAction.GENERATE_PAYROLL,
                status: AuditStatus.SUCCESS,
                entityName: 'Payroll',
                entityId: payroll.id,
                afterData: payroll,
                description: `Tạo/cập nhật bảng lương tháng ${month}/${year} cho nhân sự ${employee.id}`,
            });

            // Gửi notification cho employee
            try {
                await notifyPayrollCreated(
                    this.notificationService,
                    employee.id,
                    month,
                    year,
                    totalSalary,
                );
            } catch (error) {
                console.error(`Error sending notification for payroll creation for employee ${employee.id}:`, error);
            }

            return payroll;
        });

        return Promise.all(payrollPromises);
    }

    async getAll(query: any) {
        return this.prisma.payroll.findMany({
            where: query,
            include: { employee: true },
            orderBy: [{ year: 'desc' }, { month: 'desc' }],
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

    async updateStatus(id: string, status: string) {
        const before = await this.prisma.payroll.findUnique({ where: { id } });
        if (!before) {
            throw new NotFoundException('Payroll not found');
        }

        const payroll = await this.prisma.payroll.update({
            where: { id },
            data: { status },
        });

        await this.auditLogService.createLog({
            module: AuditModule.PAYROLL,
            action: AuditAction.UPDATE_STATUS,
            status: AuditStatus.SUCCESS,
            entityName: 'Payroll',
            entityId: payroll.id,
            beforeData: before,
            afterData: payroll,
            description: `Cập nhật trạng thái bảng lương ${payroll.id} thành ${status}`,
        });

        return payroll;
    }

    async pay(id: string) {
        const payroll = await this.getById(id);
        if (payroll.status !== 'approved') {
            throw new BadRequestException('Payroll must be approved before payment');
        }

        // Create Payment record
        await this.prisma.payment.create({
            data: {
                payrollId: id,
                amount: payroll.totalSalary,
                note: `Payment for payroll ${payroll.month}/${payroll.year}`,
            }
        });

        const payrollUpdated = await this.prisma.payroll.update({
            where: { id },
            data: { status: 'paid' },
        });

        await this.auditLogService.createLog({
            module: AuditModule.PAYROLL,
            action: AuditAction.PAY,
            status: AuditStatus.SUCCESS,
            entityName: 'Payroll',
            entityId: id,
            beforeData: payroll,
            afterData: payrollUpdated,
            description: `Thanh toán bảng lương ${payroll.month}/${payroll.year} cho nhân sự ${payroll.employeeId}`,
        });

        // Gửi notification cho employee
        try {
            const payment = await this.prisma.payment.findFirst({
                where: { payrollId: id },
                orderBy: { createdAt: 'desc' },
            });

            await notifyPayrollPaid(
                this.notificationService,
                payroll.employeeId,
                payroll.month,
                payroll.year,
                payroll.totalSalary,
                payment?.paidDate || new Date(),
            );
        } catch (error) {
            console.error(`Error sending notification for payroll payment for employee ${payroll.employeeId}:`, error);
        }

        return payrollUpdated;
    }
}
