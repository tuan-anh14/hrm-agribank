import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwtService: JwtService) {}

  // 🧱 Đăng ký tài khoản
  async register(data: any) {
    const { username, password, role, employeeId } = data;

    const existUser = await this.prisma.account.findUnique({
      where: { username },
    });
    if (existUser) {
      throw new UnauthorizedException('Tài khoản đã tồn tại');
    }

    const hashed = await bcrypt.hash(password, 10);

    const account = await this.prisma.account.create({
      data: {
        username,
        password: hashed,
        role,
        employeeId,
      },
    });

    return { message: 'Đăng ký thành công', account };
  }

  // 🔐 Đăng nhập
  async login(data: any) {
    const { username, password } = data;

    const user = await this.prisma.account.findUnique({
      where: { username },
      include: { employee: true },
    });

    if (!user) throw new UnauthorizedException('Sai tên đăng nhập');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedException('Sai mật khẩu');

    const payload = { sub: user.id, username: user.username, role: user.role };

    const token = this.jwtService.sign(payload);

    return {
      access_token: token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        employee: user.employee,
      },
    };
  }

  // 🧩 Validate user (dùng trong JwtStrategy)
  async validateUser(payload: any) {
    return this.prisma.account.findUnique({ where: { id: payload.sub } });
  }
}
