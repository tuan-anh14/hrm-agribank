import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// import './index.css'
import Layout from '@/layout'

import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import EmployeePage from '@/pages/client/employee';
import AboutPage from 'pages/client/about';
import LoginPage from 'pages/client/auth/login';
import CreateEmployeePage from 'pages/admin/create-employee';
import 'styles/global.scss';
import HomePage from 'pages/client/home';
import { App } from 'antd'
import { AppProvider } from 'components/context/app.context';
import ProtectedRoute from '@/components/guards/ProtectedRoute';

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout></Layout>,
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
        path: "/employee",
        element: (
          <ProtectedRoute>
            <EmployeePage></EmployeePage>
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
      {
        path: "/admin/create-employee",
        element: (
          <ProtectedRoute requiredRole={['ADMIN']}>
            <CreateEmployeePage></CreateEmployeePage>
          </ProtectedRoute>
        ),
      },
    ]
  },
      {
        path: "/login",
        element: <LoginPage></LoginPage>,
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