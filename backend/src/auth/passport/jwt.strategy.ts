import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private authService: AuthService
  ) {
    const secret = configService.get<string>('JWT_ACCESS_TOKEN');
    if (!secret) {
      throw new Error('JWT_ACCESS_TOKEN is not configured in environment variables');
    }
    
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
      algorithms: ['HS256'],
    });
  }

  async validate(payload: any) {
    // Validate that the payload contains required fields
    if (!payload.sub || !payload.username) {
      throw new UnauthorizedException('Invalid token payload');
    }

    // For JWT validation, we just return the payload as the user
    // The user was already validated during login
    return {
      id: payload.sub,
      username: payload.username,
      role: payload.role,
    };
  }
}
