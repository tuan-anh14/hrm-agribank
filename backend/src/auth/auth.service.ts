import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmployeeService } from '@/employee/employee.service';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from '@/auth/dto/login.dto';
import { RegisterDto } from '@/auth/dto/register.dto';

@Injectable()
export class AuthService {
    constructor(
        private employeeService: EmployeeService,
        private jwtService: JwtService,
        private configService: ConfigService,
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
        
        return {
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