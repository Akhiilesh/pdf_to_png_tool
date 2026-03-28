import { Navigate, RouteObject } from 'react-router-dom';
import { lazy } from 'react';

const Home = lazy(() => import('../pages/home'));
const ToolsByCategory = lazy(() => import('../pages/tools-by-category'));

const routes: RouteObject[] = [
  {
    path: '/',
    element: <Navigate to="/pdf/pdf-to-png" />
  },
  {
    path: '*',
    element: <Navigate to="/pdf/pdf-to-png" />
  }
];

export default routes;
