import {lazy} from 'react';
import {Navigate} from 'react-router';
import MainLayout from '@/layouts/MainLayout';
import {groupwareRoutes} from '@/routes/groupware';

// Dashboards
const Dashboard = lazy(() => import('@/views/dashboards/dashboard'));

// Apps (그룹웨어 화면 구현 시 재활용 예정)
const Chat = lazy(() => import('@/views/apps/chat'));
const Calendar = lazy(() => import('@/views/apps/calendar'));

// Auth
const Auth1SignIn = lazy(() => import('@/views/auth/auth-1/sign-in'));
const Auth1SignUp = lazy(() => import('@/views/auth/auth-1/sign-up'));
const Auth1ResetPassword = lazy(() => import('@/views/auth/auth-1/reset-password'));
const Auth1NewPassword = lazy(() => import('@/views/auth/auth-1/new-password'));
const Auth1TwoFactor = lazy(() => import('@/views/auth/auth-1/two-factor'));
const Auth1LockScreen = lazy(() => import('@/views/auth/auth-1/lock-screen'));
const Auth1SuccessMail = lazy(() => import('@/views/auth/auth-1/success-mail'));
const Auth1LoginPin = lazy(() => import('@/views/auth/auth-1/login-pin'));
const Auth1DeleteAccount = lazy(() => import('@/views/auth/auth-1/delete-account'));
const Auth2SignIn = lazy(() => import('@/views/auth/auth-2/sign-in'));
const Auth2SignUp = lazy(() => import('@/views/auth/auth-2/sign-up'));
const Auth2ResetPassword = lazy(() => import('@/views/auth/auth-2/reset-password'));
const Auth2NewPassword = lazy(() => import('@/views/auth/auth-2/new-password'));
const Auth2TwoFactor = lazy(() => import('@/views/auth/auth-2/two-factor'));
const Auth2LockScreen = lazy(() => import('@/views/auth/auth-2/lock-screen'));
const Auth2SuccessMail = lazy(() => import('@/views/auth/auth-2/success-mail'));
const Auth2LoginPin = lazy(() => import('@/views/auth/auth-2/login-pin'));
const Auth2DeleteAccount = lazy(() => import('@/views/auth/auth-2/delete-account'));

// Error
const Error400 = lazy(() => import('@/views/error/400'));
const Error401 = lazy(() => import('@/views/error/401'));
const Error403 = lazy(() => import('@/views/error/403'));
const Error404 = lazy(() => import('@/views/error/404'));
const Error408 = lazy(() => import('@/views/error/408'));
const Error500 = lazy(() => import('@/views/error/500'));

const authRoutes = [{
  path: '/auth-1/sign-in',
  element: <Auth1SignIn />
}, {
  path: '/auth-1/sign-up',
  element: <Auth1SignUp />
}, {
  path: '/auth-1/reset-password',
  element: <Auth1ResetPassword />
}, {
  path: '/auth-1/new-password',
  element: <Auth1NewPassword />
}, {
  path: '/auth-1/two-factor',
  element: <Auth1TwoFactor />
}, {
  path: '/auth-1/lock-screen',
  element: <Auth1LockScreen />
}, {
  path: '/auth-1/success-mail',
  element: <Auth1SuccessMail />
}, {
  path: '/auth-1/login-pin',
  element: <Auth1LoginPin />
}, {
  path: '/auth-1/delete-account',
  element: <Auth1DeleteAccount />
}, {
  path: '/auth-2/sign-in',
  element: <Auth2SignIn />
}, {
  path: '/auth-2/sign-up',
  element: <Auth2SignUp />
}, {
  path: '/auth-2/reset-password',
  element: <Auth2ResetPassword />
}, {
  path: '/auth-2/new-password',
  element: <Auth2NewPassword />
}, {
  path: '/auth-2/two-factor',
  element: <Auth2TwoFactor />
}, {
  path: '/auth-2/lock-screen',
  element: <Auth2LockScreen />
}, {
  path: '/auth-2/success-mail',
  element: <Auth2SuccessMail />
}, {
  path: '/auth-2/login-pin',
  element: <Auth2LoginPin />
}, {
  path: '/auth-2/delete-account',
  element: <Auth2DeleteAccount />
}];
const errorRoutes = [{
  path: '/error/400',
  element: <Error400 />
}, {
  path: '/error/401',
  element: <Error401 />
}, {
  path: '/error/403',
  element: <Error403 />
}, {
  path: '/error/404',
  element: <Error404 />
}, {
  path: '/error/408',
  element: <Error408 />
}, {
  path: '/error/500',
  element: <Error500 />
}];
const dashboardRoutes = [{
  path: '/dashboard',
  element: <Dashboard />
}];
const appsRoutes = [{
  path: '/chat',
  element: <Chat />
}, {
  path: '/calendar',
  element: <Calendar />
}];
const allRoutes = [{
  element: <MainLayout />,
  children: [{
    path: '/',
    element: <Navigate to="/groupware/dashboard" replace />
  }, ...groupwareRoutes, ...dashboardRoutes, ...appsRoutes]
}];
const otherRoutes = [...authRoutes, ...errorRoutes];
export const routes = [...allRoutes, ...otherRoutes];
