import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Layout from '@/layout'

import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import EmployeePage from '@/pages/client/employee';
import AboutPage from 'pages/client/about';
import LoginPage from 'pages/client/auth/login';
import RegisterPage from 'pages/client/auth/register';
import 'styles/global.scss'

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout></Layout>,
    children: [
      {
        path: "/employee",
        element: <EmployeePage></EmployeePage>,
      },
      {
        path: "/about",
        element: <AboutPage></AboutPage>,
      },
    ]
  },
  {
    path: "/login",
    element: <LoginPage></LoginPage>,
  },
  {
    path: "/register",
    element: <RegisterPage></RegisterPage>,
  },

]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* <Layout /> */}
    <RouterProvider router={router} />
  </StrictMode>,
)