import type { RouteObject } from 'react-router-dom';
import ProtectedRoute from '@/components/guards/ProtectedRoute';
import PublicRoute from '@/components/guards/PublicRoute';

// Pages
import HomePage from '@/pages/client/home';
import AboutPage from '@/pages/client/about';
import LoginPage from '@/pages/auth/login';
import AttendancePage from '@/pages/client/attendance';
import PayrollPage from '@/pages/client/payroll';

// Admin Pages
import ListEmployeePage from '@/pages/admin/employees';
import CreateEmployeePage from '@/pages/admin/employees/create-employee';
import UpdateEmployeePage from '@/pages/admin/employees/update-employee';
import ViewEmployeePage from '@/pages/admin/employees/view-employee';
import DepartmentPage from '@/pages/admin/departments';
import PositionPage from '@/pages/admin/positions';

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
            <DepartmentPage />
          </ProtectedRoute>
        ),
      },
      // Position routes
      {
        path: '/position',
        element: (
          <ProtectedRoute requiredRole={['ADMIN', 'HR']}>
            <PositionPage />
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
      // Payroll routes
      {
        path: '/payroll',
        element: (
          <ProtectedRoute>
            <PayrollPage />
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

