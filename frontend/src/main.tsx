import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { App } from 'antd';
import { AppProvider } from '@/components/context/app.context';
import { routes } from '@/config/routes';
import NotFound from '@/pages/errors/NotFound';
import 'styles/global.scss';

const router = createBrowserRouter([
  ...routes,
  {
    path: '*',
    element: <NotFound />,
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