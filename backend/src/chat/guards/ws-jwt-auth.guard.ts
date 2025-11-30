import { CanActivate, ExecutionContext, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Socket } from 'socket.io';

/**
 * WebSocket JWT Authentication Guard
 * 
 * Guard này xác thực JWT token cho WebSocket connections
 * 
 * Cách hoạt động:
 * 1. Extract JWT token từ socket handshake headers (Authorization: Bearer <token>)
 * 2. Verify token với JwtService
 * 3. Attach user payload vào client.data.user
 * 4. Disconnect client nếu không có token hoặc token invalid
 */
@Injectable()
export class WsJwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(WsJwtAuthGuard.name);

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient();
    const token = this.extractTokenFromHeader(client);

    if (!token) {
      this.logger.warn(`WebSocket connection rejected: No token provided (socket: ${client.id})`);
      client.disconnect();
      return false;
    }

    try {
      const secret = this.configService.get<string>('JWT_ACCESS_TOKEN');
      if (!secret) {
        this.logger.error('JWT_ACCESS_TOKEN is not configured');
        client.disconnect();
        return false;
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret,
        algorithms: ['HS256'],
      });

      // Validate payload structure (giống JwtStrategy)
      if (!payload.sub || !payload.username) {
        this.logger.warn(`Invalid token payload (socket: ${client.id})`);
        client.disconnect();
        return false;
      }

      // Attach user to socket (giống JwtStrategy.validate)
      client.data.user = {
        id: payload.sub,
        username: payload.username,
        role: payload.role,
      };

      this.logger.debug(`WebSocket authenticated: ${payload.username} (socket: ${client.id})`);
      return true;
    } catch (error) {
      // Handle different JWT errors
      if (error.name === 'TokenExpiredError') {
        this.logger.warn(`Token expired (socket: ${client.id})`);
      } else if (error.name === 'JsonWebTokenError') {
        this.logger.warn(`Invalid token (socket: ${client.id})`);
      } else if (error.name === 'NotBeforeError') {
        this.logger.warn(`Token not active yet (socket: ${client.id})`);
      } else {
        this.logger.error(`JWT verification error: ${error.message} (socket: ${client.id})`);
      }

      client.disconnect();
      return false;
    }
  }

  /**
   * Extract JWT token từ socket handshake headers
   * Hỗ trợ cả Authorization header và auth object trong handshake
   */
  private extractTokenFromHeader(client: Socket): string | undefined {
    // Thử lấy từ Authorization header
    const authHeader = client.handshake.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.split(' ')[1];
    }

    // Thử lấy từ auth object (socket.io client có thể gửi token trong auth)
    const authToken = client.handshake.auth?.token;
    if (authToken) {
      // Nếu token có prefix "Bearer ", remove nó
      if (authToken.startsWith('Bearer ')) {
        return authToken.split(' ')[1];
      }
      return authToken;
    }

    return undefined;
  }
}

