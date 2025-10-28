import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Đăng ký tài khoản mới' })
  async register(@Body() data: any) {
    return this.authService.register(data);
  }

  @Post('login')
  @ApiOperation({ summary: 'Đăng nhập và nhận JWT token' })
  async login(@Body() data: any) {
    return this.authService.login(data);
  }
}
