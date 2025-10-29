import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { Public } from '../decorator/customize';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Đăng ký tài khoản mới' })
  @ApiResponse({ 
    status: 201, 
    description: 'Đăng ký thành công',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Đăng ký thành công' },
        employee: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'uuid-employee-id' },
            fullName: { type: 'string', example: 'Nguyễn Văn Admin' },
            email: { type: 'string', example: 'admin@agribank.com' },
            phone: { type: 'string', example: '0123456789' },
            address: { type: 'string', example: '123 Đường ABC, Quận 1, TP.HCM' },
            gender: { type: 'string', example: 'Nam' },
            dateOfBirth: { type: 'string', example: '1990-01-01T00:00:00.000Z' }
          }
        },
        account: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'uuid-account-id' },
            username: { type: 'string', example: 'admin@agribank.com' },
            role: { type: 'string', example: 'ADMIN' },
            isActive: { type: 'boolean', example: true }
          }
        }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Dữ liệu không hợp lệ',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'array', items: { type: 'string' }, example: ['Email không hợp lệ', 'Họ và tên không được để trống'] },
        error: { type: 'string', example: 'Bad Request' }
      }
    }
  })
  async register(@Body() data: RegisterDto) {
    return this.authService.register(data);
  }

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng nhập và nhận JWT token' })
  @ApiResponse({ 
    status: 200, 
    description: 'Đăng nhập thành công',
    schema: {
      type: 'object',
      properties: {
        access_token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
        token_type: { type: 'string', example: 'Bearer' },
        expires_in: { type: 'number', example: 3600 },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'uuid-user-id' },
            email: { type: 'string', example: 'admin@agribank.com' },
            fullName: { type: 'string', example: 'Nguyễn Văn Admin' },
            role: { type: 'string', example: 'ADMIN' }
          }
        }
      }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Thông tin đăng nhập không đúng',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Tên đăng nhập hoặc mật khẩu không đúng' },
        error: { type: 'string', example: 'Unauthorized' }
      }
    }
  })
  async login(@Body() data: LoginDto) {
    return this.authService.login(data);
  }
}
