import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorator/roles.decorator';
import { UserRole } from '../constants/roles.constants';

/**
 * RolesGuard - Guard để kiểm tra quyền truy cập dựa trên role của user
 * 
 * Cách hoạt động:
 * 1. Lấy danh sách roles được phép từ decorator @Roles()
 * 2. Lấy role của user từ JWT token (đã được JwtStrategy validate)
 * 3. Kiểm tra xem role của user có trong danh sách được phép không
 * 4. Nếu có -> cho phép truy cập, nếu không -> từ chối với ForbiddenException
 */
@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Lấy danh sách roles được phép từ decorator @Roles()
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(), // Lấy từ method level trước
      context.getClass(),    // Nếu không có thì lấy từ class level
    ]);

    // Nếu không có @Roles() decorator -> cho phép truy cập (không cần kiểm tra role)
    if (!requiredRoles || requiredRoles.length === 0) {
      this.logger.debug('No roles required, allowing access');
      return true;
    }

    // Lấy thông tin user từ request (đã được JwtStrategy attach)
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Kiểm tra xem user có tồn tại không
    if (!user) {
      this.logger.warn('No user found in request');
      throw new ForbiddenException('Không tìm thấy thông tin người dùng');
    }

    // Lấy role của user
    const userRole = user.role as UserRole;

    // Kiểm tra xem role của user có trong danh sách được phép không
    const hasRole = requiredRoles.includes(userRole);

    if (!hasRole) {
      this.logger.warn(
        `User ${user.username} with role ${userRole} denied access. Required roles: ${requiredRoles.join(', ')}`
      );
      throw new ForbiddenException(
        `Bạn không có quyền truy cập tài nguyên này. Yêu cầu role: ${requiredRoles.join(', ')}`
      );
    }

    this.logger.debug(
      `User ${user.username} with role ${userRole} granted access`
    );
    return true;
  }
}
