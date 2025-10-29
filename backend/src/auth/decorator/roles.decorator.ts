import { SetMetadata } from '@nestjs/common';

/**
 * Key để lưu metadata về roles trong reflector
 */
export const ROLES_KEY = 'roles';

/**
 * Decorator để đánh dấu quyền truy cập cho controller hoặc method
 * 
 * @param roles - Danh sách các role được phép truy cập
 * 
 * @example
 * @Roles('ADMIN') // Chỉ ADMIN mới được truy cập
 * @Roles('ADMIN', 'HR') // ADMIN hoặc HR được truy cập
 * @Roles('ADMIN', 'HR', 'EMPLOYEE') // Tất cả role đều được truy cập
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
