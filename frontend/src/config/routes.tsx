import type { RouteObject } from 'react-router-dom';
import ProtectedRoute from '@/components/guards/ProtectedRoute';
import PublicRoute from '@/components/guards/PublicRoute';

// Pages
import HomePage from '@/pages/client/home';
import AboutPage from '@/pages/client/about';
import LoginPage from '@/pages/auth/login';
import PayrollPage from '@/pages/client/payroll';
import AttendancePage from '@/pages/client/attendance';

// Admin Pages
import ListEmployeePage from '@/pages/admin/employees';
import CreateEmployeePage from '@/pages/admin/employees/create-employee';
import UpdateEmployeePage from '@/pages/admin/employees/update-employee';
import ViewEmployeePage from '@/pages/admin/employees/view-employee';
import ListDepartmentPage from '@/pages/admin/departments';
import CreateDepartmentPage from '@/pages/admin/departments/create-department';
import UpdateDepartmentPage from '@/pages/admin/departments/update-department';
import ViewDepartmentPage from '@/pages/admin/departments/view-department';
import ListPositionPage from '@/pages/admin/positions';
import CreatePositionPage from '@/pages/admin/positions/create-position';
import UpdatePositionPage from '@/pages/admin/positions/update-position';
import ViewPositionPage from '@/pages/admin/positions/view-position';
import ListShiftPage from '@/pages/admin/shifts';
import CreateShiftPage from '@/pages/admin/shifts/create-shift';
import UpdateShiftPage from '@/pages/admin/shifts/update-shift';
import ViewShiftPage from '@/pages/admin/shifts/view-shift';
import ListWorkSchedulePage from '@/pages/admin/workschedules';
import CreateWorkSchedulePage from '@/pages/admin/workschedules/create-workschedule';
import UpdateWorkSchedulePage from '@/pages/admin/workschedules/update-workschedule';
import ViewWorkSchedulePage from '@/pages/admin/workschedules/view-workschedule';
import MyWorkSchedulePage from '@/pages/client/my-workschedule';
import CreateMyWorkSchedulePage from '@/pages/client/create-my-workschedule';
import ListAttendancePage from '@/pages/admin/attendances';
import CreateAttendancePage from '@/pages/admin/attendances/create-attendance';
import UpdateAttendancePage from '@/pages/admin/attendances/update-attendance';
import ViewAttendancePage from '@/pages/admin/attendances/view-attendance';
import ListPayrollPage from '@/pages/admin/payroll';
import GeneratePayrollPage from '@/pages/admin/payroll/generate';
import PayrollDetailPage from '@/pages/admin/payroll/detail';

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
        path: '/admin/employees',
        element: (
          <ProtectedRoute requiredRole={['ADMIN', 'HR']}>
            <ListEmployeePage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/admin/create-employee',
        element: (
          <ProtectedRoute requiredRole={['ADMIN']}>
            <CreateEmployeePage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/admin/employees/create',
        element: (
          <ProtectedRoute requiredRole={['ADMIN']}>
            <CreateEmployeePage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/admin/employees/:id',
        element: (
          <ProtectedRoute requiredRole={['ADMIN', 'HR']}>
            <ViewEmployeePage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/admin/employees/:id/edit',
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
      // WorkSchedule routes
      {
        path: '/workschedule',
        element: (
          <ProtectedRoute requiredRole={['ADMIN', 'HR']}>
            <ListWorkSchedulePage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/workschedule/create',
        element: (
          <ProtectedRoute requiredRole={['ADMIN', 'HR']}>
            <CreateWorkSchedulePage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/workschedule/:id',
        element: (
          <ProtectedRoute requiredRole={['ADMIN', 'HR']}>
            <ViewWorkSchedulePage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/workschedule/:id/edit',
        element: (
          <ProtectedRoute requiredRole={['ADMIN', 'HR']}>
            <UpdateWorkSchedulePage />
          </ProtectedRoute>
        ),
      },
      // Employee Work Schedule routes
      {
        path: '/my-workschedule',
        element: (
          <ProtectedRoute>
            <MyWorkSchedulePage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/my-workschedule/create',
        element: (
          <ProtectedRoute>
            <CreateMyWorkSchedulePage />
          </ProtectedRoute>
        ),
      },
      // Attendance routes
      {
        path: '/attendance',
        element: (
          <ProtectedRoute>
            <AttendancePage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/attendance/manage',
        element: (
          <ProtectedRoute requiredRole={['ADMIN', 'HR']}>
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
      // Payroll routes
      {
        path: '/payroll',
        element: (
          <ProtectedRoute>
            <PayrollPage />
          </ProtectedRoute>
        ),
      },
      // Admin Payroll routes
      {
        path: '/admin/payroll',
        element: (
          <ProtectedRoute requiredRole={['ADMIN', 'HR']}>
            <ListPayrollPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/admin/payroll/generate',
        element: (
          <ProtectedRoute requiredRole={['ADMIN', 'HR']}>
            <GeneratePayrollPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/admin/payroll/:id',
        element: (
          <ProtectedRoute requiredRole={['ADMIN', 'HR', 'EMPLOYEE']}>
            <PayrollDetailPage />
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
];

