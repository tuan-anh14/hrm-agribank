import { PrismaClient, EmployeeType, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('Start seeding...');

    const email = 'admin@agribank.com';
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);

    // 1. Create or Update Employee
    const employee = await prisma.employee.upsert({
        where: { employeeCode: 'EMP-ADMIN' },
        update: {
            email: email,
            fullName: 'Administrator',
            type: EmployeeType.FULL_TIME,
            status: 'working',
        },
        create: {
            employeeCode: 'EMP-ADMIN',
            fullName: 'Administrator',
            email: email,
            type: EmployeeType.FULL_TIME,
            status: 'working',
            salaryCoefficient: 1.0,
            gender: 'Nam',
            phone: '0123456789',
        },
    });

    console.log(`Created/Updated Employee: ${employee.id}`);

    // 2. Create or Update Account
    // First check if account exists by username to avoid unique constraint errors if we try to create
    const existingAccount = await prisma.account.findUnique({
        where: { username: email },
    });

    if (existingAccount) {
        await prisma.account.update({
            where: { id: existingAccount.id },
            data: {
                password: hashedPassword,
                role: Role.ADMIN,
                isActive: true,
                employeeId: employee.id,
            },
        });
        console.log(`Updated Account for ${email}`);
    } else {
        await prisma.account.create({
            data: {
                username: email,
                password: hashedPassword,
                role: Role.ADMIN,
                isActive: true,
                employeeId: employee.id,
            },
        });
        console.log(`Created Account for ${email}`);
    }

    console.log('Seeding finished.');
    console.log('-----------------------------------');
    console.log(`Login Email: ${email}`);
    console.log(`Password:    ${password}`);
    console.log('-----------------------------------');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
