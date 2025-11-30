import axios from 'services/axios.customize';
import type { Employee, CreateEmployeePayload, UpdateEmployeePayload, CreateEmployeeWithAccountPayload } from '@/types/employee';
import type { Department, CreateDepartmentPayload, UpdateDepartmentPayload } from '@/types/department';
import type { Position, CreatePositionPayload, UpdatePositionPayload } from '@/types/position';
import type { Attendance, CreateAttendancePayload, UpdateAttendancePayload, QueryAttendanceParams, AttendanceListResponse, CheckInPayload, CheckOutPayload } from '@/types/attendance';
import type { Shift, ShiftListResponse, QueryShiftParams, CreateShiftPayload, UpdateShiftPayload } from '@/types/shift';
import type { WorkSchedule, WorkScheduleListResponse, QueryWorkScheduleParams, CreateWorkSchedulePayload, UpdateWorkSchedulePayload, ApproveWorkSchedulePayload } from '@/types/workschedule';
import type { Payroll, GeneratePayrollPayload, QueryPayrollParams, PayrollListResponse } from '@/types/payroll';
import type { RewardPenalty, CreateRewardPenaltyDto } from '@/types/reward-penalty';
import type { AuditLog, AuditLogDetail, QueryAuditLogParams, AuditLogListResponse, AuditLogDetailResponse } from '@/types/audit-log';
import type { Notification, NotificationListResponse, NotificationDetailResponse, UnreadCountResponse, QueryNotificationParams, CreateNotificationPayload, UpdateNotificationPayload } from '@/types/notification';
import type { Request, RequestListResponse, QueryRequestParams, CreateRequestPayload, UpdateRequestPayload, ApproveRequestPayload, RequestType, CreateRequestTypePayload, UpdateRequestTypePayload } from '@/types/request';
import type { ChatRoomsResponse, ChatMessageListResponse, CreateMessagePayload, CreateDirectMessageRoomPayload, QueryMessageParams, MarkRoomAsReadResponse, ChatMessage, ChatRoom } from '@/types/chat';

export const loginAPI = (username: string, password: string) => {
    const urlBackend = "/api/v1/auth/login"
    return axios.post<IBackendRes<ILoginHRM>>(urlBackend, { username, password })
}

export const activateAccountAPI = (payload: IActivateAccountReq) => {
    const urlBackend = "/api/v1/auth/activate";
    return axios.post<IBackendRes<IActivateAccountRes>>(urlBackend, payload, {
        headers: {
            delay: 2000
        }
    });
}

export const fetchAccountAPI = () => {
    const urlBackend = "/api/v1/auth/account";
    return axios.get<IBackendRes<IFetchAccount>>(urlBackend);
}

export const refreshTokenAPI = () => {
    const urlBackend = "/api/v1/auth/refresh";
    return axios.post<IBackendRes<IAuthTokens>>(urlBackend, {});
}

export const logoutAPI = () => {
    const urlBackend = "/api/v1/auth/logout";
    return axios.post<IBackendRes<{ success: boolean }>>(urlBackend, {});
}

// Employee APIs
export const createEmployeeWithAccountAPI = (payload: CreateEmployeeWithAccountPayload) => {
    const urlBackend = "/api/v1/employee/with-account";
    return axios.post<IBackendRes<{ message: string; employee: Employee; account: any }>>(urlBackend, payload);
}

// Departments - CRUD Operations
export const getAllDepartmentsAPI = () => {
    const urlBackend = "/api/v1/department";
    // Backend returns a plain array (not wrapped in IBackendRes)
    return axios.get<Department[]>(urlBackend);
}

export const getDepartmentByIdAPI = (id: string) => {
    const urlBackend = `/api/v1/department/${id}`;
    return axios.get<IBackendRes<Department>>(urlBackend);
}

export const createDepartmentAPI = (payload: CreateDepartmentPayload) => {
    const urlBackend = "/api/v1/department";
    return axios.post<IBackendRes<Department>>(urlBackend, payload);
}

export const updateDepartmentAPI = (id: string, payload: UpdateDepartmentPayload) => {
    const urlBackend = `/api/v1/department/${id}`;
    return axios.put<IBackendRes<Department>>(urlBackend, payload);
}

export const deleteDepartmentAPI = (id: string) => {
    const urlBackend = `/api/v1/department/${id}`;
    return axios.delete<IBackendRes<Department>>(urlBackend);
}

// Positions - CRUD Operations
export const getAllPositionsAPI = () => {
    const urlBackend = "/api/v1/position";
    // Backend returns a plain array (not wrapped in IBackendRes)
    return axios.get<Position[]>(urlBackend);
}

export const getPositionByIdAPI = (id: string) => {
    const urlBackend = `/api/v1/position/${id}`;
    return axios.get<IBackendRes<Position>>(urlBackend);
}

export const createPositionAPI = (payload: CreatePositionPayload) => {
    const urlBackend = "/api/v1/position";
    return axios.post<IBackendRes<Position>>(urlBackend, payload);
}

export const updatePositionAPI = (id: string, payload: UpdatePositionPayload) => {
    const urlBackend = `/api/v1/position/${id}`;
    return axios.put<IBackendRes<Position>>(urlBackend, payload);
}

export const deletePositionAPI = (id: string) => {
    const urlBackend = `/api/v1/position/${id}`;
    return axios.delete<IBackendRes<Position>>(urlBackend);
}

// Employees - CRUD Operations
export const getAllEmployeesAPI = () => {
    const urlBackend = "/api/v1/employee";
    // Backend returns a plain array (not wrapped in IBackendRes)
    return axios.get<Employee[]>(urlBackend);
}

export const getEmployeeByIdAPI = (id: string) => {
    const urlBackend = `/api/v1/employee/${id}`;
    return axios.get<IBackendRes<Employee>>(urlBackend);
}

export const createEmployeeAPI = (payload: CreateEmployeePayload) => {
    const urlBackend = "/api/v1/employee";
    return axios.post<IBackendRes<Employee>>(urlBackend, payload);
}

export const updateEmployeeAPI = (id: string, payload: UpdateEmployeePayload) => {
    const urlBackend = `/api/v1/employee/${id}`;
    return axios.put<IBackendRes<Employee>>(urlBackend, payload);
}

export const deleteEmployeeAPI = (id: string) => {
    const urlBackend = `/api/v1/employee/${id}`;
    return axios.delete<IBackendRes<Employee>>(urlBackend);
}

// Attendance - CRUD Operations
export const getAllAttendancesAPI = (params?: QueryAttendanceParams) => {
    const urlBackend = "/api/v1/attendance";
    return axios.get<AttendanceListResponse>(urlBackend, { params });
}

export const getAttendanceByIdAPI = (id: string) => {
    const urlBackend = `/api/v1/attendance/${id}`;
    return axios.get<IBackendRes<Attendance>>(urlBackend);
}

export const getAttendancesByEmployeeIdAPI = (employeeId: string, params?: QueryAttendanceParams) => {
    const urlBackend = `/api/v1/attendance/employee/${employeeId}`;
    return axios.get<AttendanceListResponse>(urlBackend, { params });
}

export const getMyAttendancesAPI = (params?: QueryAttendanceParams) => {
    const urlBackend = "/api/v1/attendance/me";
    return axios.get<AttendanceListResponse>(urlBackend, { params });
}

export const createAttendanceAPI = (payload: CreateAttendancePayload) => {
    const urlBackend = "/api/v1/attendance";
    return axios.post<IBackendRes<Attendance>>(urlBackend, payload);
}

export const updateAttendanceAPI = (id: string, payload: UpdateAttendancePayload) => {
    const urlBackend = `/api/v1/attendance/${id}`;
    return axios.put<IBackendRes<Attendance>>(urlBackend, payload);
}

export const deleteAttendanceAPI = (id: string) => {
    const urlBackend = `/api/v1/attendance/${id}`;
    return axios.delete<IBackendRes<Attendance>>(urlBackend);
}

export const checkInAPI = (payload: CheckInPayload = {}) => {
    const urlBackend = "/api/v1/attendance/check-in";
    return axios.post<IBackendRes<Attendance>>(urlBackend, payload);
}

export const checkOutAPI = (payload: CheckOutPayload = {}) => {
    const urlBackend = "/api/v1/attendance/check-out";
    return axios.post<IBackendRes<Attendance>>(urlBackend, payload);
}

// Shifts - CRUD Operations
export const getAllShiftsAPI = (params?: QueryShiftParams) => {
    const urlBackend = "/api/v1/shift";
    return axios.get<ShiftListResponse>(urlBackend, { params });
}

export const getShiftByIdAPI = (id: string) => {
    const urlBackend = `/api/v1/shift/${id}`;
    return axios.get<IBackendRes<Shift>>(urlBackend);
}

export const createShiftAPI = (payload: CreateShiftPayload) => {
    const urlBackend = "/api/v1/shift";
    return axios.post<IBackendRes<Shift>>(urlBackend, payload);
}

export const updateShiftAPI = (id: string, payload: UpdateShiftPayload) => {
    const urlBackend = `/api/v1/shift/${id}`;
    return axios.put<IBackendRes<Shift>>(urlBackend, payload);
}

export const deleteShiftAPI = (id: string) => {
    const urlBackend = `/api/v1/shift/${id}`;
    return axios.delete<IBackendRes<Shift>>(urlBackend);
}

// Work Schedule APIs
export const getAllWorkSchedulesAPI = (params?: QueryWorkScheduleParams) => {
    const urlBackend = "/api/v1/workschedule";
    return axios.get<WorkScheduleListResponse>(urlBackend, { params });
}

export const getWorkScheduleByIdAPI = (id: string) => {
    const urlBackend = `/api/v1/workschedule/${id}`;
    return axios.get<IBackendRes<WorkSchedule>>(urlBackend);
}

export const createWorkScheduleAPI = (payload: CreateWorkSchedulePayload) => {
    const urlBackend = "/api/v1/workschedule";
    return axios.post<IBackendRes<WorkSchedule>>(urlBackend, payload);
}

export const updateWorkScheduleAPI = (id: string, payload: UpdateWorkSchedulePayload) => {
    const urlBackend = `/api/v1/workschedule/${id}`;
    return axios.put<IBackendRes<WorkSchedule>>(urlBackend, payload);
}

export const approveWorkScheduleAPI = (id: string, payload: ApproveWorkSchedulePayload) => {
    const urlBackend = `/api/v1/workschedule/${id}/approve`;
    return axios.patch<IBackendRes<WorkSchedule>>(urlBackend, payload);
}

export const deleteWorkScheduleAPI = (id: string) => {
    const urlBackend = `/api/v1/workschedule/${id}`;
    return axios.delete<IBackendRes<WorkSchedule>>(urlBackend);
}

export const getMyWorkSchedulesAPI = (params?: QueryWorkScheduleParams) => {
    const urlBackend = "/api/v1/workschedule/me";
    return axios.get<WorkScheduleListResponse>(urlBackend, { params });
}

export const createMyWorkScheduleAPI = (payload: Omit<CreateWorkSchedulePayload, 'employeeId'>) => {
    const urlBackend = "/api/v1/workschedule/me";
    return axios.post<IBackendRes<WorkSchedule>>(urlBackend, payload);
}

// Payroll APIs
export const generatePayrollAPI = (payload: GeneratePayrollPayload) => {
    const urlBackend = "/api/v1/payroll/generate";
    return axios.post<IBackendRes<Payroll[]>>(urlBackend, payload);
}

export const getAllPayrollsAPI = (params?: QueryPayrollParams) => {
    const urlBackend = "/api/v1/payroll";
    return axios.get<Payroll[]>(urlBackend, { params });
}

export const getPayrollByIdAPI = (id: string) => {
    const urlBackend = `/api/v1/payroll/${id}`;
    return axios.get<IBackendRes<Payroll>>(urlBackend);
}

export const updatePayrollStatusAPI = (id: string, status: string) => {
    const urlBackend = `/api/v1/payroll/${id}/status`;
    return axios.patch<IBackendRes<Payroll>>(urlBackend, { status });
}

export const payPayrollAPI = (id: string) => {
    const urlBackend = `/api/v1/payroll/${id}/pay`;
    return axios.post<IBackendRes<Payroll>>(urlBackend, {});
}

// RewardPenalty APIs
export const createRewardPenaltyAPI = (payload: CreateRewardPenaltyDto) => {
    const urlBackend = "/api/v1/reward-penalty";
    return axios.post<IBackendRes<RewardPenalty>>(urlBackend, payload);
}

export const getAllRewardPenaltiesAPI = () => {
    const urlBackend = "/api/v1/reward-penalty";
    return axios.get<RewardPenalty[]>(urlBackend);
}

export const deleteRewardPenaltyAPI = (id: string) => {
    const urlBackend = `/api/v1/reward-penalty/${id}`;
    return axios.delete<IBackendRes<RewardPenalty>>(urlBackend);
}

// Audit Log APIs
export const getAuditLogsAPI = (params?: QueryAuditLogParams) => {
    const urlBackend = "/api/v1/audit-log";
    return axios.get<AuditLogListResponse>(urlBackend, { params });
}

export const getAuditLogDetailAPI = (id: string) => {
    const urlBackend = `/api/v1/audit-log/${id}`;
    return axios.get<AuditLogDetailResponse>(urlBackend);
}

// Notification APIs
export const getAllNotificationsAPI = (params?: QueryNotificationParams) => {
    const urlBackend = "/api/v1/notifications";
    return axios.get<NotificationListResponse>(urlBackend, { params });
}

export const getUnreadNotificationsAPI = (params?: QueryNotificationParams) => {
    const urlBackend = "/api/v1/notifications/unread";
    return axios.get<NotificationListResponse>(urlBackend, { params });
}

export const getUnreadCountAPI = () => {
    const urlBackend = "/api/v1/notifications/unread-count";
    return axios.get<UnreadCountResponse>(urlBackend);
}

export const getNotificationByIdAPI = (id: string) => {
    const urlBackend = `/api/v1/notifications/${id}`;
    return axios.get<NotificationDetailResponse>(urlBackend);
}

export const markNotificationAsReadAPI = (id: string) => {
    const urlBackend = `/api/v1/notifications/${id}/read`;
    return axios.patch<NotificationDetailResponse>(urlBackend, {});
}

export const markAllNotificationsAsReadAPI = () => {
    const urlBackend = "/api/v1/notifications/read-all";
    return axios.patch<{ count: number }>(urlBackend, {});
}

export const createNotificationAPI = (payload: CreateNotificationPayload) => {
    const urlBackend = "/api/v1/notifications";
    return axios.post<IBackendRes<Notification>>(urlBackend, payload);
}

export const updateNotificationAPI = (id: string, payload: UpdateNotificationPayload) => {
    const urlBackend = `/api/v1/notifications/${id}`;
    return axios.patch<NotificationDetailResponse>(urlBackend, payload);
}

export const deleteNotificationAPI = (id: string) => {
    const urlBackend = `/api/v1/notifications/${id}`;
    return axios.delete<IBackendRes<{ message: string }>>(urlBackend);
}

// RequestType APIs - CRUD Operations
export const getAllRequestTypesAPI = () => {
    const urlBackend = "/api/v1/request-type";
    // Backend returns a plain array (not wrapped in IBackendRes)
    return axios.get<RequestType[]>(urlBackend);
}

export const getRequestTypeByIdAPI = (id: string) => {
    const urlBackend = `/api/v1/request-type/${id}`;
    return axios.get<IBackendRes<RequestType>>(urlBackend);
}

export const createRequestTypeAPI = (payload: CreateRequestTypePayload) => {
    const urlBackend = "/api/v1/request-type";
    return axios.post<IBackendRes<RequestType>>(urlBackend, payload);
}

export const updateRequestTypeAPI = (id: string, payload: UpdateRequestTypePayload) => {
    const urlBackend = `/api/v1/request-type/${id}`;
    return axios.put<IBackendRes<RequestType>>(urlBackend, payload);
}

export const deleteRequestTypeAPI = (id: string) => {
    const urlBackend = `/api/v1/request-type/${id}`;
    return axios.delete<IBackendRes<RequestType>>(urlBackend);
}

// Request APIs - CRUD Operations
export const getAllRequestsAPI = (params?: QueryRequestParams) => {
    const urlBackend = "/api/v1/request";
    return axios.get<RequestListResponse>(urlBackend, { params });
}

export const getRequestByIdAPI = (id: string) => {
    const urlBackend = `/api/v1/request/${id}`;
    return axios.get<IBackendRes<Request>>(urlBackend);
}

export const getRequestsByEmployeeIdAPI = (employeeId: string, params?: QueryRequestParams) => {
    const urlBackend = `/api/v1/request/employee/${employeeId}`;
    return axios.get<RequestListResponse>(urlBackend, { params });
}

export const getMyRequestsAPI = (params?: QueryRequestParams) => {
    const urlBackend = "/api/v1/request/me";
    return axios.get<RequestListResponse>(urlBackend, { params });
}

export const createRequestAPI = (payload: CreateRequestPayload) => {
    const urlBackend = "/api/v1/request";
    return axios.post<IBackendRes<Request>>(urlBackend, payload);
}

export const createMyRequestAPI = (payload: Omit<CreateRequestPayload, 'employeeId'>) => {
    const urlBackend = "/api/v1/request/me";
    return axios.post<IBackendRes<Request>>(urlBackend, payload);
}

export const updateRequestAPI = (id: string, payload: UpdateRequestPayload) => {
    const urlBackend = `/api/v1/request/${id}`;
    return axios.put<IBackendRes<Request>>(urlBackend, payload);
}

export const approveRequestAPI = (id: string, payload: ApproveRequestPayload) => {
    const urlBackend = `/api/v1/request/${id}/approve`;
    return axios.patch<IBackendRes<Request>>(urlBackend, payload);
}

export const deleteRequestAPI = (id: string) => {
    const urlBackend = `/api/v1/request/${id}`;
    return axios.delete<IBackendRes<Request>>(urlBackend);
}

// ==================== CHAT APIs ====================

/**
 * Lấy danh sách tất cả rooms mà user có quyền truy cập
 */
export const getChatRoomsAPI = () => {
    const urlBackend = '/api/v1/chat/rooms';
    return axios.get<IBackendRes<ChatRoomsResponse>>(urlBackend);
}

/**
 * Lấy lịch sử tin nhắn trong room với pagination
 * @param roomId - ID của room
 * @param params - Query parameters (page, limit)
 */
export const getChatMessagesAPI = (roomId: string, params?: QueryMessageParams) => {
    const urlBackend = `/api/v1/chat/rooms/${roomId}/messages`;
    return axios.get<IBackendRes<ChatMessageListResponse>>(urlBackend, { params });
}

/**
 * Gửi tin nhắn vào room (REST fallback - thường dùng WebSocket)
 * @param roomId - ID của room
 * @param payload - Nội dung tin nhắn
 */
export const createChatMessageAPI = (roomId: string, payload: CreateMessagePayload) => {
    const urlBackend = `/api/v1/chat/rooms/${roomId}/messages`;
    return axios.post<IBackendRes<ChatMessage>>(urlBackend, payload);
}

/**
 * Tạo hoặc lấy room chat 1-1 với nhân viên khác
 * @param payload - otherUserId (Account ID hoặc Employee ID)
 */
export const createDirectMessageRoomAPI = (payload: CreateDirectMessageRoomPayload) => {
    const urlBackend = '/api/v1/chat/rooms/direct-message';
    return axios.post<IBackendRes<ChatRoom>>(urlBackend, payload);
}

/**
 * Đánh dấu một tin nhắn đã đọc
 * @param messageId - ID của tin nhắn
 */
export const markMessageAsReadAPI = (messageId: string) => {
    const urlBackend = `/api/v1/chat/messages/${messageId}/read`;
    return axios.patch<IBackendRes<ChatMessage>>(urlBackend);
}

/**
 * Đánh dấu tất cả tin nhắn trong room đã đọc
 * @param roomId - ID của room
 */
export const markRoomAsReadAPI = (roomId: string) => {
    const urlBackend = `/api/v1/chat/rooms/${roomId}/read`;
    return axios.patch<IBackendRes<MarkRoomAsReadResponse>>(urlBackend);
}