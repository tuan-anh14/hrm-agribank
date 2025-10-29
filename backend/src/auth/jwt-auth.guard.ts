import {
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorator/customize';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    constructor(private reflector: Reflector) {
        super();
    }

    canActivate(context: ExecutionContext) {
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) {
            return true;
        }
        return super.canActivate(context);
    }

    handleRequest(err, user, info) {
        // You can throw an exception based on either "info" or "err" arguments
        if (err || !user) {
            if (info?.name === 'TokenExpiredError') {
                throw new UnauthorizedException("Token đã hết hạn");
            } else if (info?.name === 'JsonWebTokenError') {
                throw new UnauthorizedException("Token không hợp lệ");
            } else if (info?.name === 'NotBeforeError') {
                throw new UnauthorizedException("Token chưa có hiệu lực");
            }
            throw err || new UnauthorizedException("Token không hợp lệ");
        }
        return user;
    }
}