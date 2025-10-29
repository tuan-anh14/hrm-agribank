import { Module } from '@nestjs/common';
import { AuthService } from '@/auth/auth.service';
import { AuthController } from '@/auth/auth.controller';
import { EmployeeModule } from '@/employee/employee.module';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from '@/auth/passport/local.strategy';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from '@/auth/passport/jwt.strategy';
import { RolesGuard } from '@/auth/guards/roles.guard';

@Module({
  imports: [
    EmployeeModule, 
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService): JwtModuleOptions => {
        const secret = configService.get<string>('JWT_ACCESS_TOKEN');
        const expiresIn = configService.get<string>('JWT_ACCESS_EXPIRE');
        
        if (!secret) {
          throw new Error('JWT_ACCESS_TOKEN is not configured in environment variables');
        }
        
        return {
          secret,
          signOptions: {
            expiresIn: expiresIn || '1h',
            algorithm: 'HS256',
          },
        } as JwtModuleOptions;
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, JwtStrategy, RolesGuard],
  exports: [AuthService, RolesGuard]
})
export class AuthModule { }