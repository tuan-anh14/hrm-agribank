import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmployeeService } from '@/employee/employee.service';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from '@/auth/dto/login.dto';
import { RegisterDto } from '@/auth/dto/register.dto';
import { ActivateAccountDto } from '@/auth/dto/activate-account.dto';
import { AuditLogService } from '@/audit-log/audit-log.service';
import { AuditAction, AuditModule, AuditStatus } from '@prisma/client';
import { NotificationService } from '@/notification/notification.service';
import { notifyPasswordReset } from '@/notification/notification-templates.helper';

@Injectable()
export class AuthService {
    constructor(
        private employeeService: EmployeeService,
        private jwtService: JwtService,
        private configService: ConfigService,
        private readonly auditLogService: AuditLogService,
        private readonly notificationService: NotificationService,
    ) { }

    //username/ pass là 2 tham số thư viện passport nó ném về
    async validateUser(username: string, pass: string): Promise<any> {
        const user = await this.employeeService.findOneByUsername(username);
        if (user && user.account) {
            const isValid = await this.employeeService.isValidPassword(pass, user.account.password);
            if (isValid) {
                return user;
            }
        }

        return null;
    }

    async register(data: RegisterDto) {
        // Check if email already exists
        const existingEmployee = await this.employeeService.findOneByUsername(data.email);
        if (existingEmployee) {
            throw new BadRequestException('Email đã được sử dụng');
        }

        try {
            // Create employee first
            const employee = await this.employeeService.create({
                fullName: data.fullName,
                email: data.email,
                phone: data.phone,
                address: data.address,
                gender: data.gender,
                dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
                positionId: data.positionId,
                departmentId: data.departmentId
            });

            // Create account linked to employee
            const account = await this.employeeService.createAccount({
                username: data.email,
                password: data.password,
                role: data.role || 'EMPLOYEE',
                employeeId: employee.id
            });

            return {
                message: 'Đăng ký thành công',
                employee: {
                    id: employee.id,
                    fullName: employee.fullName,
                    email: employee.email,
                    phone: employee.phone,
                    address: employee.address,
                    gender: employee.gender,
                    dateOfBirth: employee.dateOfBirth,
                },
                account: {
                    id: account.id,
                    username: account.username,
                    role: account.role,
                    isActive: account.isActive
                }
            };
        } catch (error) {
            throw new BadRequestException('Có lỗi xảy ra khi đăng ký tài khoản');
        }
    }

    async login(data: LoginDto) {
    const user = await this.validateUser(data.username, data.password);
    if (!user) {
        // Ghi audit cho login thất bại (không lộ mật khẩu/chi tiết nhạy cảm)
        await this.auditLogService.createLog({
            module: AuditModule.AUTH,
            action: AuditAction.LOGIN,
            status: AuditStatus.FAILED,
            description: `Đăng nhập thất bại cho username=${data.username}`,
        });

        throw new UnauthorizedException('Tên đăng nhập hoặc mật khẩu không đúng');
    }

        const payload = {
            username: user.email,
            sub: user.id,
            role: user.account?.role || 'EMPLOYEE',
            iat: Math.floor(Date.now() / 1000),
        };
        
        const accessToken = this.jwtService.sign(payload);
        
        // Calculate expires_in in seconds based on JWT_ACCESS_EXPIRE
        const expiresIn = this.getExpiresInSeconds();
        
    const result = {
        access_token: accessToken,
        token_type: 'Bearer',
        expires_in: expiresIn,
        user: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            role: user.account?.role || 'EMPLOYEE'
        }
    };

    // Ghi audit cho login thành công (chưa có context request nên mới log mức tối thiểu)
    await this.auditLogService.createLog({
        module: AuditModule.AUTH,
        action: AuditAction.LOGIN,
        status: AuditStatus.SUCCESS,
        actorAccountId: user.account?.id ?? null,
        actorEmployeeId: user.id,
        actorUsername: user.account?.username ?? user.email ?? null,
        actorRole: user.account?.role ?? null,
        description: `Đăng nhập thành công cho tài khoản ${user.account?.username ?? user.email}`,
    });

    return result;
    }

    async activate(data: ActivateAccountDto) {
        // Hiện chưa có employeeCode/dob trong schema; kích hoạt dựa trên email cơ quan
        const employee = await this.employeeService.findOneByUsername(data.workEmail);
        if (!employee) {
            throw new NotFoundException('Không tìm thấy nhân sự với email này');
        }

        const account = await this.employeeService.upsertAccountForEmployee(
            employee.id,
            employee.email as string,
            data.newPassword,
            employee.account?.role || 'EMPLOYEE'
        );

        // Ghi audit cho kích hoạt tài khoản
        await this.auditLogService.createLog({
            module: AuditModule.AUTH,
            action: AuditAction.ACTIVATE_ACCOUNT,
            status: AuditStatus.SUCCESS,
            actorAccountId: account.id,
            actorEmployeeId: employee.id,
            actorUsername: account.username,
            actorRole: account.role,
            entityName: 'Account',
            entityId: account.id,
            description: `Kích hoạt tài khoản cho nhân sự ${employee.fullName} (${employee.email})`,
        });

        // Gửi notification cho employee khi reset password
        try {
            await notifyPasswordReset(
                this.notificationService,
                employee.id,
                new Date(),
            );
        } catch (error) {
            console.error(`Error sending notification for password reset ${employee.id}:`, error);
        }

        return {
            user: {
                id: employee.id,
                email: employee.email,
                fullName: employee.fullName,
                role: employee.account?.role || 'EMPLOYEE'
            }
        };
    }

    async getAccountInfo(userId: string) {
        const employee = await this.employeeService.getEmployeeWithAccountByUserId(userId);
        if (!employee) {
            throw new NotFoundException('Không tìm thấy thông tin người dùng');
        }

        return {
            id: employee.id,
            email: employee.email,
            phone: employee.phone,
            fullName: employee.fullName,
            role: employee.account?.role || 'EMPLOYEE',
            avatar: null, // Will be added when avatar is implemented
            department: employee.department ? {
                id: employee.department.id,
                name: employee.department.name,
            } : null,
            position: employee.position ? {
                id: employee.position.id,
                title: employee.position.title,
            } : null,
        };
    }

    private getExpiresInSeconds(): number {
        const expiresIn = this.configService.get<string>('JWT_ACCESS_EXPIRE') || '1h';
        
        // Convert time string to seconds
        const timeValue = parseInt(expiresIn);
        const timeUnit = expiresIn.replace(timeValue.toString(), '');
        
        switch (timeUnit) {
            case 's':
            case 'sec':
            case 'second':
            case 'seconds':
                return timeValue;
            case 'm':
            case 'min':
            case 'minute':
            case 'minutes':
                return timeValue * 60;
            case 'h':
            case 'hr':
            case 'hour':
            case 'hours':
                return timeValue * 3600;
            case 'd':
            case 'day':
            case 'days':
                return timeValue * 86400;
            default:
                // Default to 1 hour if format is not recognized
                return 3600;
        }
    }

}