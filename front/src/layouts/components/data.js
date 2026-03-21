import {TbLogout2, TbUserCircle} from 'react-icons/tb';
import {LuCircleGauge, LuFingerprint, LuFireExtinguisher} from 'react-icons/lu';

export const userDropdownItems = [{
  label: 'Welcome back!',
  isHeader: true
}, {
  label: 'Profile',
  icon: TbUserCircle,
  url: '/users/profile'
}, {
  label: 'Log Out',
  icon: TbLogout2,
  url: '#',
  class: 'text-danger fw-semibold'
}];

export const menuItems = [{
  key: 'navigation',
  label: 'Navigation',
}, {
  key: 'Login',
  label: '로그인',
  url: '/auth/sign-in',
  icon: LuFingerprint,
}, {
    key: 'Reactivate',
    label: '계정활성화',
    url: '/auth/delete-account',
    icon: LuFireExtinguisher,
}, {
  key: 'dashboards',
  label: 'Dashboards',
  icon: LuCircleGauge,
  url: '/dashboard'
}, {
    key: 'items',
    label: 'Menu Items',
    isTitle: true
}

];