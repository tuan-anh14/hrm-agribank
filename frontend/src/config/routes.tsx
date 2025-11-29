import type { RouteObject } from 'react-router-dom';
import ProtectedRoute from '@/components/guards/ProtectedRoute';
import PublicRoute from '@/components/guards/PublicRoute';

// Pages
import HomePage from '@/pages/dashboard/home';
import AboutPage from '@/pages/about/about';
import LoginPage from '@/pages/auth/login';
// Admin Pages
import ListEmployeePage from '@/pages/employee';
import CreateEmployeePage from '@/pages/employee/create-employee';
import UpdateEmployeePage from '@/pages/employee/update-employee';
import ViewEmployeePage from '@/pages/employee/view-employee';
import NotAuthorized from '@/pages/errors/NotAuthorized';
import ListDepartmentPage from '@/pages/department';
import CreateDepartmentPage from '@/pages/department/create-department';
import UpdateDepartmentPage from '@/pages/department/update-department';
import ViewDepartmentPage from '@/pages/department/view-department';
import ListPositionPage from '@/pages/position';
import CreatePositionPage from '@/pages/position/create-position';
import UpdatePositionPage from '@/pages/position/update-position';
import ViewPositionPage from '@/pages/position/view-position';
import ListShiftPage from '@/pages/shift';
import CreateShiftPage from '@/pages/shift/create-shift';
import UpdateShiftPage from '@/pages/shift/update-shift';
import ViewShiftPage from '@/pages/shift/view-shift';
import ListWorkSchedulePage from '@/pages/work-schedule';
import CreateWorkSchedulePage from '@/pages/work-schedule/create-workschedule';
import UpdateWorkSchedulePage from '@/pages/work-schedule/update-workschedule';
import ViewWorkSchedulePage from '@/pages/work-schedule/view-workschedule';
import ListAttendancePage from '@/pages/attendance';
import CreateAttendancePage from '@/pages/attendance/create-attendance';
import UpdateAttendancePage from '@/pages/attendance/update-attendance';
import ViewAttendancePage from '@/pages/attendance/view-attendance';
import PayrollList from '@/pages/payroll/PayrollList';
import PayrollDetail from '@/pages/payroll/PayrollDetail';
// import MyPayroll from '@/pages/payroll/MyPayroll'; // Merged into PayrollList
import RewardPenaltyManager from '@/pages/reward-penalty/RewardPenaltyManager';
import AuditLogPage from '@/pages/audit-log';
import AuditLogDetailPage from '@/pages/audit-log/detail';

// Layout
import AppLayout from '@/layout';

/**
 * Application routes configuration
 * Organized by feature and access level
 */
export const routes: RouteObject[] = [
  {
    path: '/',
    element: <AppLayout />,
    children: [
      // Public routes (require authentication)
      {
        index: true,
        element: (
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/about',
        element: (
          <ProtectedRoute>
            <AboutPage />
          </ProtectedRoute>
        ),
      },
      // Employee routes
      {
        path: '/employee',
        element: (
          <ProtectedRoute requiredRole={['ADMIN', 'HR']}>
            <ListEmployeePage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/employee/create',
        element: (
          <ProtectedRoute requiredRole={['ADMIN']}>
            <CreateEmployeePage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/employee/:id',
        element: (
          <ProtectedRoute requiredRole={['ADMIN', 'HR']}>
            <ViewEmployeePage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/employee/edit/:id',
        element: (
          <ProtectedRoute requiredRole={['ADMIN', 'HR']}>
            <UpdateEmployeePage />
          </ProtectedRoute>
        ),
      },
      // Department routes
      {
        path: '/department',
        element: (
          <ProtectedRoute requiredRole={['ADMIN', 'HR']}>
            <ListDepartmentPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/department/create',
        element: (
          <ProtectedRoute requiredRole={['ADMIN', 'HR']}>
            <CreateDepartmentPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/department/:id',
        element: (
          <ProtectedRoute requiredRole={['ADMIN', 'HR']}>
            <ViewDepartmentPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/department/:id/edit',
        element: (
          <ProtectedRoute requiredRole={['ADMIN', 'HR']}>
            <UpdateDepartmentPage />
          </ProtectedRoute>
        ),
      },
      // Position routes
      {
        path: '/position',
        element: (
          <ProtectedRoute requiredRole={['ADMIN', 'HR']}>
            <ListPositionPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/position/create',
        element: (
          <ProtectedRoute requiredRole={['ADMIN', 'HR']}>
            <CreatePositionPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/position/:id',
        element: (
          <ProtectedRoute requiredRole={['ADMIN', 'HR']}>
            <ViewPositionPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/position/:id/edit',
        element: (
          <ProtectedRoute requiredRole={['ADMIN', 'HR']}>
            <UpdatePositionPage />
          </ProtectedRoute>
        ),
      },
      // Shift routes
      {
        path: '/shift',
        element: (
          <ProtectedRoute requiredRole={['ADMIN', 'HR']}>
            <ListShiftPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/shift/create',
        element: (
          <ProtectedRoute requiredRole={['ADMIN', 'HR']}>
            <CreateShiftPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/shift/:id',
        element: (
          <ProtectedRoute requiredRole={['ADMIN', 'HR']}>
            <ViewShiftPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/shift/:id/edit',
        element: (
          <ProtectedRoute requiredRole={['ADMIN', 'HR']}>
            <UpdateShiftPage />
          </ProtectedRoute>
        ),
      },
      // WorkSchedule routes (Unified)
      {
        path: '/workschedule',
        element: (
          <ProtectedRoute>
            <ListWorkSchedulePage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/workschedule/create',
        element: (
          <ProtectedRoute>
            <CreateWorkSchedulePage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/workschedule/:id',
        element: (
          <ProtectedRoute>
            <ViewWorkSchedulePage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/workschedule/:id/edit',
        element: (
          <ProtectedRoute>
            <UpdateWorkSchedulePage />
          </ProtectedRoute>
        ),
      },
      // Attendance routes (Unified)
      {
        path: '/attendance',
        element: (
          <ProtectedRoute>
            {/* Temporary: still using client page for basic user, admin page for admin until fully merged */}
            {/* Actually, plan says to unify. For now, let's point to ListAttendancePage and we will refactor it to handle both */}
            <ListAttendancePage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/attendance/create',
        element: (
          <ProtectedRoute requiredRole={['ADMIN', 'HR']}>
            <CreateAttendancePage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/attendance/:id',
        element: (
          <ProtectedRoute>
            <ViewAttendancePage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/attendance/:id/edit',
        element: (
          <ProtectedRoute requiredRole={['ADMIN', 'HR']}>
            <UpdateAttendancePage />
          </ProtectedRoute>
        ),
      },
      // Payroll routes (Unified)
      {
        path: '/payroll',
        element: (
          <ProtectedRoute>
            <PayrollList />
          </ProtectedRoute>
        ),
      },
      {
        path: '/payroll/:id',
        element: (
          <ProtectedRoute>
            <PayrollDetail />
          </ProtectedRoute>
        ),
      },
      {
        path: '/reward-penalty',
        element: (
          <ProtectedRoute requiredRole={['ADMIN', 'HR']}>
            <RewardPenaltyManager />
          </ProtectedRoute>
        ),
      },
      // Audit Log routes (Admin/HR only)
      {
        path: '/audit-log',
        element: (
          <ProtectedRoute requiredRole={['ADMIN', 'HR']}>
            <AuditLogPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/audit-log/:id',
        element: (
          <ProtectedRoute requiredRole={['ADMIN', 'HR']}>
            <AuditLogDetailPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
  // Auth routes (public, no authentication required)
  {
    path: '/login',
    element: (
      <PublicRoute>
        <LoginPage />
      </PublicRoute>
    ),
  },
  {
    path: '/403',
    element: <NotAuthorized />,
  },
];

