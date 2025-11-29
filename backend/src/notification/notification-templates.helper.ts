import { NotificationService } from './notification.service';
import { PrismaService } from '@/prisma/prisma.service';
import { NotificationType } from '@prisma/client';
import {
  createNotificationForEmployee,
  createNotificationForAdmins,
  formatDateTime,
  formatDate,
} from './notification.helper';

/**
 * ==================== ATTENDANCE NOTIFICATIONS ====================
 */

/**
 * Tạo notification khi check-in sớm
 */
export async function notifyCheckInEarly(
  notificationService: NotificationService,
  employeeId: string,
  checkInTime: Date | string,
): Promise<void> {
  await createNotificationForEmployee(
    notificationService,
    employeeId,
    NotificationType.ATTENDANCE,
    'Bạn đã vào ca sớm',
    'Bạn đã vào ca sớm',
    checkInTime,
  );
}

/**
 * Tạo notification khi check-in muộn
 */
export async function notifyCheckInLate(
  notificationService: NotificationService,
  employeeId: string,
  checkInTime: Date | string,
  lateMinutes: number,
): Promise<void> {
  const formattedDateTime = formatDateTime(checkInTime);
  await createNotificationForEmployee(
    notificationService,
    employeeId,
    NotificationType.ATTENDANCE,
    'Bạn đã vào ca muộn',
    `Bạn đã vào ca muộn lúc ${formattedDateTime}. Muộn ${lateMinutes} phút`,
    checkInTime,
  );
}

/**
 * Tạo notification khi check-out muộn
 */
export async function notifyCheckOutLate(
  notificationService: NotificationService,
  employeeId: string,
  checkOutTime: Date | string,
): Promise<void> {
  await createNotificationForEmployee(
    notificationService,
    employeeId,
    NotificationType.ATTENDANCE,
    'Bạn đã kết ca muộn',
    'Bạn đã kết ca muộn',
    checkOutTime,
  );
}

/**
 * Tạo notification khi quên checkout
 */
export async function notifyForgotCheckOut(
  notificationService: NotificationService,
  employeeId: string,
  date: Date | string,
): Promise<void> {
  const formattedDate = formatDate(date);
  await createNotificationForEmployee(
    notificationService,
    employeeId,
    NotificationType.ATTENDANCE,
    'Bạn quên checkout',
    `Bạn quên checkout ngày ${formattedDate}`,
  );
}

/**
 * ==================== WORK SCHEDULE NOTIFICATIONS ====================
 */

/**
 * Tạo notification khi employee tạo lịch làm việc → gửi cho ADMIN/HR
 */
export async function notifyWorkScheduleCreated(
  notificationService: NotificationService,
  prisma: PrismaService,
  employeeFullName: string,
  scheduleDate: Date | string,
  shiftName?: string,
): Promise<void> {
  const formattedDate = formatDate(scheduleDate);
  const shiftInfo = shiftName ? ` - ${shiftName}` : '';
  const content = `Nhân viên ${employeeFullName} đã đăng ký lịch làm việc ngày ${formattedDate}${shiftInfo}`;

  await createNotificationForAdmins(
    notificationService,
    prisma,
    NotificationType.SHIFT,
    'Có lịch làm việc cần duyệt',
    content,
  );
}

/**
 * Tạo notification khi duyệt lịch làm việc → gửi cho employee
 */
export async function notifyWorkScheduleApproved(
  notificationService: NotificationService,
  employeeId: string,
  scheduleDate: Date | string,
  shiftName?: string,
): Promise<void> {
  const formattedDate = formatDate(scheduleDate);
  const shiftInfo = shiftName ? ` - ${shiftName}` : '';
  const content = `Lịch làm việc ngày ${formattedDate}${shiftInfo} của bạn đã được duyệt`;

  await createNotificationForEmployee(
    notificationService,
    employeeId,
    NotificationType.SHIFT,
    'Lịch làm việc đã được duyệt',
    content,
  );
}

/**
 * Tạo notification khi từ chối lịch làm việc → gửi cho employee
 */
export async function notifyWorkScheduleRejected(
  notificationService: NotificationService,
  employeeId: string,
  scheduleDate: Date | string,
  shiftName?: string,
  reason?: string,
): Promise<void> {
  const formattedDate = formatDate(scheduleDate);
  const shiftInfo = shiftName ? ` - ${shiftName}` : '';
  const reasonText = reason ? `. Lý do: ${reason}` : '';
  const content = `Lịch làm việc ngày ${formattedDate}${shiftInfo} của bạn đã bị từ chối${reasonText}`;

  await createNotificationForEmployee(
    notificationService,
    employeeId,
    NotificationType.SHIFT,
    'Lịch làm việc bị từ chối',
    content,
  );
}

/**
 * ==================== REQUEST NOTIFICATIONS ====================
 */

/**
 * Tạo notification khi employee tạo đơn → gửi cho ADMIN/HR
 */
export async function notifyRequestCreated(
  notificationService: NotificationService,
  prisma: PrismaService,
  employeeFullName: string,
  requestType: string,
  requestCode: string,
  createdAt: Date | string,
): Promise<void> {
  const formattedDateTime = formatDateTime(createdAt);
  const content = `Nhân viên ${employeeFullName} đã tạo đơn ${requestType} ${requestCode} lúc ${formattedDateTime}`;

  await createNotificationForAdmins(
    notificationService,
    prisma,
    NotificationType.REQUEST,
    `Có đơn ${requestType} cần duyệt`,
    content,
  );
}

/**
 * Tạo notification khi duyệt đơn → gửi cho employee
 */
export async function notifyRequestApproved(
  notificationService: NotificationService,
  employeeId: string,
  requestType: string,
  requestCode: string,
  approvedAt: Date | string,
): Promise<void> {
  const formattedDateTime = formatDateTime(approvedAt);
  const content = `Bạn vừa được chấp nhận Đơn ${requestType} ${requestCode} lúc ${formattedDateTime}`;

  await createNotificationForEmployee(
    notificationService,
    employeeId,
    NotificationType.REQUEST,
    `Đơn ${requestType} đã được chấp nhận`,
    content,
  );
}

/**
 * Tạo notification khi từ chối đơn → gửi cho employee
 */
export async function notifyRequestRejected(
  notificationService: NotificationService,
  employeeId: string,
  requestType: string,
  requestCode: string,
  rejectedAt: Date | string,
  reason?: string,
): Promise<void> {
  const formattedDateTime = formatDateTime(rejectedAt);
  const reasonText = reason ? `. Lý do: ${reason}` : '';
  const content = `Đơn ${requestType} ${requestCode} của bạn đã bị từ chối lúc ${formattedDateTime}${reasonText}`;

  await createNotificationForEmployee(
    notificationService,
    employeeId,
    NotificationType.REQUEST,
    `Đơn ${requestType} bị từ chối`,
    content,
  );
}

/**
 * Tạo notification có đơn cần duyệt → gửi cho ADMIN/HR
 */
export async function notifyPendingRequests(
  notificationService: NotificationService,
  prisma: PrismaService,
  count: number,
  requestType?: string,
): Promise<void> {
  const requestTypeText = requestType ? ` ${requestType}` : '';
  const content = `Bạn có ${count} đơn${requestTypeText} cần duyệt`;

  await createNotificationForAdmins(
    notificationService,
    prisma,
    NotificationType.REQUEST,
    `Bạn có ${count} đơn cần duyệt`,
    content,
  );
}

/**
 * ==================== PAYROLL NOTIFICATIONS ====================
 */

/**
 * Tạo notification khi tạo payroll → gửi cho employee
 */
export async function notifyPayrollCreated(
  notificationService: NotificationService,
  employeeId: string,
  month: number,
  year: number,
  totalSalary: number,
): Promise<void> {
  const content = `Bảng lương tháng ${month}/${year} của bạn đã được tạo. Tổng lương: ${totalSalary.toLocaleString('vi-VN')} VNĐ`;

  await createNotificationForEmployee(
    notificationService,
    employeeId,
    NotificationType.PAYROLL,
    `Bảng lương tháng ${month}/${year}`,
    content,
  );
}

/**
 * Tạo notification khi thanh toán payroll → gửi cho employee
 */
export async function notifyPayrollPaid(
  notificationService: NotificationService,
  employeeId: string,
  month: number,
  year: number,
  amount: number,
  paidDate: Date | string,
): Promise<void> {
  const formattedDateTime = formatDateTime(paidDate);
  const content = `Bảng lương tháng ${month}/${year} của bạn đã được thanh toán. Số tiền: ${amount.toLocaleString('vi-VN')} VNĐ lúc ${formattedDateTime}`;

  await createNotificationForEmployee(
    notificationService,
    employeeId,
    NotificationType.PAYROLL,
    'Đã thanh toán lương',
    content,
  );
}

/**
 * ==================== EMPLOYEE NOTIFICATIONS ====================
 */

/**
 * Tạo notification khi tạo nhân viên → gửi cho nhân viên đó
 */
export async function notifyEmployeeCreated(
  notificationService: NotificationService,
  employeeId: string,
): Promise<void> {
  await createNotificationForEmployee(
    notificationService,
    employeeId,
    NotificationType.SYSTEM,
    'Tài khoản của bạn đã được tạo',
    'Tài khoản của bạn đã được tạo. Vui lòng kích hoạt tài khoản để sử dụng.',
  );
}

/**
 * Tạo notification khi cập nhật thông tin nhân viên → gửi cho nhân viên đó
 */
export async function notifyEmployeeUpdated(
  notificationService: NotificationService,
  employeeId: string,
): Promise<void> {
  await createNotificationForEmployee(
    notificationService,
    employeeId,
    NotificationType.SYSTEM,
    'Thông tin của bạn đã được cập nhật',
    'Thông tin cá nhân của bạn đã được cập nhật bởi quản trị viên.',
  );
}

/**
 * ==================== AUTH NOTIFICATIONS ====================
 */

/**
 * Tạo notification khi reset password / activate account → gửi cho employee
 */
export async function notifyPasswordReset(
  notificationService: NotificationService,
  employeeId: string,
  resetAt: Date | string,
): Promise<void> {
  await createNotificationForEmployee(
    notificationService,
    employeeId,
    NotificationType.SYSTEM,
    'Mật khẩu đã được cấp lại',
    'Bạn vừa được cấp lại mật khẩu',
    resetAt,
  );
}

/**
 * ==================== REWARD/PENALTY NOTIFICATIONS ====================
 */

/**
 * Tạo notification khi tạo thưởng → gửi cho employee
 */
export async function notifyRewardCreated(
  notificationService: NotificationService,
  employeeId: string,
  amount: number,
  reason?: string,
): Promise<void> {
  const reasonText = reason ? `. Lý do: ${reason}` : '';
  const content = `Bạn đã nhận được thưởng ${amount.toLocaleString('vi-VN')} VNĐ${reasonText}`;

  await createNotificationForEmployee(
    notificationService,
    employeeId,
    NotificationType.SYSTEM,
    'Bạn đã nhận được thưởng',
    content,
  );
}

/**
 * Tạo notification khi tạo phạt → gửi cho employee
 */
export async function notifyPenaltyCreated(
  notificationService: NotificationService,
  employeeId: string,
  amount: number,
  reason?: string,
): Promise<void> {
  const reasonText = reason ? `. Lý do: ${reason}` : '';
  const content = `Bạn đã bị phạt ${amount.toLocaleString('vi-VN')} VNĐ${reasonText}`;

  await createNotificationForEmployee(
    notificationService,
    employeeId,
    NotificationType.SYSTEM,
    'Bạn đã bị phạt',
    content,
  );
}

/**
 * ==================== SYSTEM NOTIFICATIONS ====================
 */

/**
 * Tạo notification lịch làm việc tháng mới → gửi cho tất cả employees
 */
export async function notifyWorkScheduleMonthAvailable(
  notificationService: NotificationService,
  prisma: PrismaService,
  month: number,
  year: number,
): Promise<{ count: number }> {
  // Lấy tất cả employees đang làm việc
  const employees = await prisma.employee.findMany({
    where: {
      status: 'working',
    },
    select: {
      id: true,
    },
  });

  if (employees.length === 0) {
    return { count: 0 };
  }

  const employeeIds = employees.map((emp) => emp.id);
  const content = `Lịch làm việc tháng ${month}/${year} đã được tạo. Vui lòng kiểm tra và đăng ký ca làm việc.`;

  return await notificationService.createForManyEmployees(
    employeeIds,
    NotificationType.SYSTEM,
    `Đã có lịch làm tháng ${month}/${year}`,
    content,
  );
}

