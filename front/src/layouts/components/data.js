import {TbBellRinging, TbLock, TbLogout2, TbSettings2, TbUserCircle} from 'react-icons/tb';
import {groupwareMenuItems} from '@/layouts/components/groupwareMenu';

export const userDropdownItems = [{
  label: 'Welcome back!',
  isHeader: true
}, {
  label: '내 정보',
  icon: TbUserCircle,
  url: '/groupware/employees/me'
}, {
  label: '알림',
  icon: TbBellRinging,
  url: '#'
}, {
  label: '환경설정',
  icon: TbSettings2,
  url: '#'
}, {
  isDivider: true
}, {
  label: '화면 잠금',
  icon: TbLock,
  url: '/auth-1/lock-screen'
}, {
  label: '로그아웃',
  icon: TbLogout2,
  url: '#',
  class: 'text-danger fw-semibold'
}];

// 가로 메뉴는 세로 메뉴(groupwareMenuItems)와 동일한 구성을 공유한다.
// 가로 메뉴 렌더러는 isTitle 항목을 처리하지 않으므로 제외한다.
export const horizontalMenuItems = groupwareMenuItems.filter(item => !item.isTitle);
