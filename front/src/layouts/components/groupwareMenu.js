import {
    LuBuilding2,
    LuCalendarClock,
    LuCircleGauge,
    LuClipboardCheck,
    LuFileText,
    LuMessageSquare,
    LuMessagesSquare,
    LuStore,
    LuUserCog,
} from 'react-icons/lu';

/**
 * HARUON 그룹웨어 사이드바 메뉴 (세로 메뉴)
 *
 * - 경로는 src/routes/groupware.jsx 와 1:1 대응한다.
 * - 도메인 구분은 rules/api-endpoint.md 를 따른다.
 */
export const groupwareMenuItems = [
  {
    key: 'gw-navigation',
    label: '그룹웨어',
    isTitle: true,
  },
  {
    key: 'gw-dashboard',
    label: '대시보드',
    icon: LuCircleGauge,
    url: '/groupware/dashboard',
  },
  {
    key: 'gw-employee',
    label: '사원 / 근태',
    icon: LuUserCog,
    children: [
      { key: 'gw-employees', label: '사원 정보', url: '/groupware/employees' },
      { key: 'gw-me', label: '내 정보', url: '/groupware/employees/me' },
      { key: 'gw-attendance', label: '내 근태', url: '/groupware/attendance' },
      { key: 'gw-attendance-dept', label: '부서 근태', url: '/groupware/attendance/dept' },
    ],
  },
  {
    key: 'gw-approval',
    label: '전자결재',
    icon: LuFileText,
    children: [
      { key: 'gw-drafts', label: '기안서 작성', url: '/groupware/drafts' },
      { key: 'gw-document-box', label: '문서함', url: '/groupware/document-box' },
      { key: 'gw-pending', label: '결재 대기', url: '/groupware/document-box/pending' },
    ],
  },
  {
    key: 'gw-schedule',
    label: '일정 / 회의',
    icon: LuCalendarClock,
    children: [
      { key: 'gw-schedule-cal', label: '일정', url: '/groupware/schedule' },
      { key: 'gw-meetings', label: '회의 예약', url: '/groupware/meetings' },
      { key: 'gw-meeting-rooms', label: '회의실', url: '/groupware/meeting-rooms' },
    ],
  },
  {
    key: 'gw-board',
    label: '게시판',
    icon: LuClipboardCheck,
    children: [
      { key: 'gw-boards', label: '게시글', url: '/groupware/boards' },
      { key: 'gw-categories', label: '카테고리 관리', url: '/groupware/boards/categories' },
    ],
  },
  {
    key: 'gw-message',
    label: '쪽지',
    icon: LuMessageSquare,
    url: '/groupware/messages',
  },
  {
    key: 'gw-chat',
    label: '채팅',
    icon: LuMessagesSquare,
    url: '/groupware/chat',
  },
  {
    key: 'gw-dept',
    label: '부서',
    icon: LuBuilding2,
    url: '/groupware/departments',
  },
  {
    key: 'gw-franchise-title',
    label: '가맹점',
    isTitle: true,
  },
  {
    key: 'gw-franchise',
    label: '가맹점 관리',
    icon: LuStore,
    children: [
      { key: 'gw-franchises', label: '가맹점 목록', url: '/groupware/franchises' },
      { key: 'gw-educations', label: '교육', url: '/groupware/franchise-educations' },
      { key: 'gw-inquiries', label: '문의', url: '/groupware/franchise-inquiries' },
    ],
  },
];
