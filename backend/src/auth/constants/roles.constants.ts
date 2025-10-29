/**
 * Các role trong hệ thống HRM
 * Tương ứng với enum Role trong Prisma schema
 */
export enum UserRole {
  ADMIN = 'ADMIN',
  HR = 'HR', 
  EMPLOYEE = 'EMPLOYEE'
}

/**
 * Các quyền (permissions) trong hệ thống HRM
 * Được sử dụng để kiểm tra quyền chi tiết
 */
export enum Permission {
  // Employee Management
  EMPLOYEE_READ = 'EMPLOYEE_READ',
  EMPLOYEE_CREATE = 'EMPLOYEE_CREATE',
  EMPLOYEE_UPDATE = 'EMPLOYEE_UPDATE',
  EMPLOYEE_DELETE = 'EMPLOYEE_DELETE',
  
  // Payroll Management
  PAYROLL_READ = 'PAYROLL_READ',
  PAYROLL_CREATE = 'PAYROLL_CREATE',
  PAYROLL_UPDATE = 'PAYROLL_UPDATE',
  PAYROLL_DELETE = 'PAYROLL_DELETE',
  
  // Attendance Management
  ATTENDANCE_READ = 'ATTENDANCE_READ',
  ATTENDANCE_CREATE = 'ATTENDANCE_CREATE',
  ATTENDANCE_UPDATE = 'ATTENDANCE_UPDATE',
  
  // Department & Position Management
  DEPARTMENT_READ = 'DEPARTMENT_READ',
  DEPARTMENT_CREATE = 'DEPARTMENT_CREATE',
  DEPARTMENT_UPDATE = 'DEPARTMENT_UPDATE',
  DEPARTMENT_DELETE = 'DEPARTMENT_DELETE',
  
  POSITION_READ = 'POSITION_READ',
  POSITION_CREATE = 'POSITION_CREATE',
  POSITION_UPDATE = 'POSITION_UPDATE',
  POSITION_DELETE = 'POSITION_DELETE',
  
  // Reports & Analytics
  REPORTS_READ = 'REPORTS_READ',
  ANALYTICS_READ = 'ANALYTICS_READ',
  
  // System Administration
  SYSTEM_ADMIN = 'SYSTEM_ADMIN',
  USER_MANAGEMENT = 'USER_MANAGEMENT'
}

/**
 * Mapping role với các permissions tương ứng
 * Định nghĩa quyền hạn của từng role trong hệ thống
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: [
    // Admin có tất cả quyền
    ...Object.values(Permission)
  ],
  
  [UserRole.HR]: [
    // HR có quyền quản lý nhân sự và báo cáo
    Permission.EMPLOYEE_READ,
    Permission.EMPLOYEE_CREATE,
    Permission.EMPLOYEE_UPDATE,
    Permission.EMPLOYEE_DELETE,
    
    Permission.PAYROLL_READ,
    Permission.PAYROLL_CREATE,
    Permission.PAYROLL_UPDATE,
    Permission.PAYROLL_DELETE,
    
    Permission.ATTENDANCE_READ,
    Permission.ATTENDANCE_CREATE,
    Permission.ATTENDANCE_UPDATE,
    
    Permission.DEPARTMENT_READ,
    Permission.DEPARTMENT_CREATE,
    Permission.DEPARTMENT_UPDATE,
    Permission.DEPARTMENT_DELETE,
    
    Permission.POSITION_READ,
    Permission.POSITION_CREATE,
    Permission.POSITION_UPDATE,
    Permission.POSITION_DELETE,
    
    Permission.REPORTS_READ,
    Permission.ANALYTICS_READ,
  ],
  
  [UserRole.EMPLOYEE]: [
    // Employee chỉ có quyền xem thông tin cá nhân và điểm danh
    Permission.EMPLOYEE_READ, // Chỉ xem thông tin của chính mình
    Permission.ATTENDANCE_READ,
    Permission.ATTENDANCE_CREATE, // Điểm danh cho chính mình
  ]
};

/**
 * Kiểm tra xem role có permission cụ thể không
 * @param role - Role của user
 * @param permission - Permission cần kiểm tra
 * @returns true nếu có quyền, false nếu không
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}

/**
 * Kiểm tra xem role có bất kỳ permission nào trong danh sách không
 * @param role - Role của user
 * @param permissions - Danh sách permissions cần kiểm tra
 * @returns true nếu có ít nhất 1 quyền, false nếu không có quyền nào
 */
export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(role, permission));
}
