import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// import './index.css'
import AppLayout from '@/layout'

import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import ListEmployeePage from '@/pages/admin/employees';
import CreateEmployeePage from '@/pages/admin/employees/create-employee';
import UpdateEmployeePage from '@/pages/admin/employees/update-employee';
import ViewEmployeePage from '@/pages/admin/employees/view-employee';
import AboutPage from 'pages/client/about';
import LoginPage from '@/pages/auth/login';
import 'styles/global.scss';
import HomePage from 'pages/client/home';
import { App } from 'antd'
import { AppProvider } from 'components/context/app.context';
import ProtectedRoute from '@/components/guards/ProtectedRoute';
import PublicRoute from '@/components/guards/PublicRoute';

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout></AppLayout>,
    children: [
      { 
        index: true, 
        element: (
          <ProtectedRoute>
            <HomePage></HomePage>
          </ProtectedRoute>
        )
      },
      {
        path: "/admin/employees",
        element: (
          <ProtectedRoute requiredRole={['ADMIN', 'HR']}>
            <ListEmployeePage></ListEmployeePage>
          </ProtectedRoute>
        ),
      },
      {
        path: "/admin/employees/create",
        element: (
          <ProtectedRoute requiredRole={['ADMIN']}>
            <CreateEmployeePage></CreateEmployeePage>
          </ProtectedRoute>
        ),
      },
      {
        path: "/admin/employees/:id",
        element: (
          <ProtectedRoute requiredRole={['ADMIN', 'HR']}>
            <ViewEmployeePage></ViewEmployeePage>
          </ProtectedRoute>
        ),
      },
      {
        path: "/admin/employees/:id/edit",
        element: (
          <ProtectedRoute requiredRole={['ADMIN', 'HR']}>
            <UpdateEmployeePage></UpdateEmployeePage>
          </ProtectedRoute>
        ),
      },
      {
        path: "/about",
        element: (
          <ProtectedRoute>
            <AboutPage></AboutPage>
          </ProtectedRoute>
        ),
      },
    ]
  },
      {
        path: "/login",
        element: (
          <PublicRoute>
            <LoginPage></LoginPage>
          </PublicRoute>
        ),
      },

]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* <Layout /> */}
    {/* <RouterProvider router={router} /> */}
    <App>
      <AppProvider>
        <RouterProvider router={router} />
      </AppProvider>
    </App>
  </StrictMode>,
)