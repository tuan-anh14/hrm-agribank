import { NotificationService } from './notification.service';
import { PrismaService } from '@/prisma/prisma.service';
import { NotificationType, Role } from '@prisma/client';

/**
 * Format thời gian theo chuẩn Việt Nam: HH:mm:ss - dd/MM/yyyy
 * @param date - Date object hoặc string
 * @returns Formatted string: "08:12:22 - 05/04/2024"
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) {
    throw new Error('Invalid date');
  }

  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  return `${hours}:${minutes}:${seconds} - ${day}/${month}/${year}`;
}

/**
 * Format thời gian chỉ ngày: dd/MM/yyyy
 * @param date - Date object hoặc string
 * @returns Formatted string: "05/04/2024"
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) {
    throw new Error('Invalid date');
  }

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  return `${day}/${month}/${year}`;
}

/**
 * Format thời gian chỉ giờ: HH:mm:ss
 * @param date - Date object hoặc string
 * @returns Formatted string: "08:12:22"
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) {
    throw new Error('Invalid date');
  }

  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  return `${hours}:${minutes}:${seconds}`;
}

/**
 * Lấy danh sách employee IDs có role ADMIN hoặc HR
 */
export async function getAdminAndHREmployeeIds(
  prisma: PrismaService,
): Promise<string[]> {
  const accounts = await prisma.account.findMany({
    where: {
      role: {
        in: [Role.ADMIN, Role.HR],
      },
      isActive: true,
      employeeId: {
        not: null,
      },
    },
    select: {
      employeeId: true,
    },
  });

  return accounts
    .map((acc) => acc.employeeId)
    .filter((id): id is string => id !== null);
}

/**
 * Tạo notification đơn giản cho một employee
 */
export async function createNotification(
  notificationService: NotificationService,
  employeeId: string,
  type: NotificationType,
  title: string,
  content: string,
): Promise<void> {
  await notificationService.create({
    employeeId,
    type,
    title,
    content,
  });
}

/**
 * Tạo notification cho một employee với format chuẩn
 */
export async function createNotificationForEmployee(
  notificationService: NotificationService,
  employeeId: string,
  type: NotificationType,
  title: string,
  content: string,
  dateTime?: Date | string,
): Promise<void> {
  let formattedContent = content;

  // Nếu có dateTime, format và thêm vào content
  if (dateTime) {
    const formattedDateTime = formatDateTime(dateTime);
    formattedContent = `${content} lúc ${formattedDateTime}`;
  }

  await notificationService.create({
    employeeId,
    type,
    title,
    content: formattedContent,
  });
}

/**
 * Tạo notification cho tất cả ADMIN và HR
 */
export async function createNotificationForAdmins(
  notificationService: NotificationService,
  prisma: PrismaService,
  type: NotificationType,
  title: string,
  content: string,
): Promise<{ count: number }> {
  const adminAndHREmployeeIds = await getAdminAndHREmployeeIds(prisma);

  if (adminAndHREmployeeIds.length === 0) {
    return { count: 0 };
  }

  return await notificationService.createForManyEmployees(
    adminAndHREmployeeIds,
    type,
    title,
    content,
  );
}

/**
 * Tạo notification cho nhiều employees
 */
export async function createNotificationForManyEmployees(
  notificationService: NotificationService,
  employeeIds: string[],
  type: NotificationType,
  title: string,
  content: string,
): Promise<{ count: number }> {
  return await notificationService.createForManyEmployees(
    employeeIds,
    type,
    title,
    content,
  );
}

/**
 * Interface cho notification options
 */
export interface CreateNotificationOptions {
  employeeId?: string;
  employeeIds?: string[];
  type: NotificationType;
  title: string;
  content: string;
  dateTime?: Date | string;
  sendToAdmins?: boolean;
}

/**
 * Tạo notification linh hoạt - có thể gửi cho 1 employee, nhiều employees, hoặc admins
 */
export async function createNotificationFlexible(
  notificationService: NotificationService,
  prisma: PrismaService,
  options: CreateNotificationOptions,
): Promise<{ count: number }> {
  const { employeeId, employeeIds, type, title, content, dateTime, sendToAdmins } = options;

  let formattedContent = content;
  if (dateTime) {
    const formattedDateTime = formatDateTime(dateTime);
    formattedContent = `${content} lúc ${formattedDateTime}`;
  }

  // Gửi cho admins
  if (sendToAdmins) {
    await createNotificationForAdmins(
      notificationService,
      prisma,
      type,
      title,
      formattedContent,
    );
  }

  // Gửi cho 1 employee
  if (employeeId) {
    await createNotification(
      notificationService,
      employeeId,
      type,
      title,
      formattedContent,
    );
  }

  // Gửi cho nhiều employees
  if (employeeIds && employeeIds.length > 0) {
    await createNotificationForManyEmployees(
      notificationService,
      employeeIds,
      type,
      title,
      formattedContent,
    );
  }

  return { count: 1 };
}

