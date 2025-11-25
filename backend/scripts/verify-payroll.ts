import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { PayrollService } from '../src/payroll/payroll.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { RewardPenaltyService } from '../src/reward-penalty/reward-penalty.service';
import { EmployeeType, RewardPenaltyType } from '@prisma/client';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const prisma = app.get(PrismaService);
    const payrollService = app.get(PayrollService);
    const rewardService = app.get(RewardPenaltyService);

    console.log('--- Starting Payroll Verification ---');

    try {
        // 1. Setup Data
        console.log('1. Setting up test data...');

        // Create Position
        const position = await prisma.position.create({
            data: {
                title: 'Test Position Payroll',
                baseSalary: 5000000,
                businessSalary: 10000000,
                allowance: 1000000,
            }
        });

        // Create Employee
        const employee = await prisma.employee.create({
            data: {
                employeeCode: 'TEST_PAYROLL_001',
                fullName: 'Test Employee Payroll',
                type: EmployeeType.FULL_TIME,
                salaryCoefficient: 2.0,
                positionId: position.id,
                status: 'working',
            }
        });

        // Create Attendance (20 days worked, 2 days late)
        const month = 11;
        const year = 2025;

        // Create 20 days of attendance
        // Note: We need to be careful with dates to not overlap with existing data if any
        // Using a specific range in 2025

        for (let i = 1; i <= 20; i++) {
            const date = new Date(year, month - 1, i);
            if (date.getDay() === 0 || date.getDay() === 6) continue; // Skip weekends

            // Set hours to ensure it's within the day
            const checkIn = new Date(date);
            checkIn.setHours(8, 0, 0);
            const checkOut = new Date(date);
            checkOut.setHours(17, 0, 0);

            await prisma.attendance.create({
                data: {
                    employeeId: employee.id,
                    date: date,
                    checkInTime: checkIn,
                    checkOutTime: checkOut,
                    status: 'ON_TIME',
                }
            });
        }

        // Add a late day
        const lateDate = new Date(year, month - 1, 25); // Ensure it's a weekday if possible, or just force it
        const lateCheckIn = new Date(lateDate);
        lateCheckIn.setHours(8, 30, 0);
        const lateCheckOut = new Date(lateDate);
        lateCheckOut.setHours(17, 0, 0);

        await prisma.attendance.create({
            data: {
                employeeId: employee.id,
                date: lateDate,
                checkInTime: lateCheckIn,
                checkOutTime: lateCheckOut,
                status: 'LATE',
                lateMinutes: 30,
            }
        });

        // Create Reward
        await rewardService.create({
            employeeId: employee.id,
            type: RewardPenaltyType.REWARD,
            amount: 500000,
            reason: 'Test Reward',
        });

        // 2. Run Calculation
        console.log('2. Running Payroll Calculation...');
        await payrollService.generatePayrollForMonth(month, year);

        // 3. Verify
        console.log('3. Verifying results...');
        const payroll = await prisma.payroll.findFirst({
            where: { employeeId: employee.id, month, year }
        });

        if (!payroll) {
            console.error('FAILED: Payroll record not found');
        } else {
            console.log('Payroll Record:', JSON.stringify(payroll, null, 2));

            console.log(`V1: ${payroll.salaryV1} (Expected: 10000000)`);
            console.log(`Insurance: ${payroll.insuranceDeduction} (Expected: 1050000)`);

            if (payroll.salaryV1 === 10000000 && payroll.insuranceDeduction === 1050000) {
                console.log('SUCCESS: Basic calculation verified!');
            } else {
                console.error('FAILED: Calculation mismatch');
            }
        }

        // Cleanup
        console.log('4. Cleaning up...');
        await prisma.payroll.deleteMany({ where: { employeeId: employee.id } });
        await prisma.attendance.deleteMany({ where: { employeeId: employee.id } });
        await prisma.rewardPenalty.deleteMany({ where: { employeeId: employee.id } });
        await prisma.employee.delete({ where: { id: employee.id } });
        await prisma.position.delete({ where: { id: position.id } });

    } catch (error) {
        console.error('Error during verification:', error);
    } finally {
        await app.close();
    }
}

bootstrap();
