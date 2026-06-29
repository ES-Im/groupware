import {lazy} from 'react';

/**
 * HARUON 그룹웨어 도메인 라우트
 *
 * 화면은 더미 데이터로 구성되어 있으며, 실제 API 호출은 아직 연결하지 않았다.
 * (services/* 의 메서드를 보고 각 화면에서 연동 예정)
 * 경로 체계는 rules/api-endpoint.md 의 도메인 구분을 따른다.
 */
// 대시보드
const Dashboard = lazy(() => import('@/views/groupware/dashboard'));

// 사원 / 근태
const EmployeeList = lazy(() => import('@/views/groupware/employee/EmployeeList'));
const MyInfo = lazy(() => import('@/views/groupware/employee/MyInfo'));
const AttendanceList = lazy(() => import('@/views/groupware/employee/AttendanceList'));

// 전자결재
const DraftCreate = lazy(() => import('@/views/groupware/draft/DraftCreate'));
const DocumentBox = lazy(() => import('@/views/groupware/draft/DocumentBox'));
const PendingApproval = lazy(() => import('@/views/groupware/draft/PendingApproval'));

// 일정 / 회의
const ScheduleCalendar = lazy(() => import('@/views/groupware/schedule/ScheduleCalendar'));
const MeetingList = lazy(() => import('@/views/groupware/schedule/MeetingList'));
const MeetingRoomList = lazy(() => import('@/views/groupware/schedule/MeetingRoomList'));

// 게시판 / 쪽지 / 채팅
const BoardList = lazy(() => import('@/views/groupware/communication/BoardList'));
const CategoryManagement = lazy(() => import('@/views/groupware/communication/CategoryManagement'));
const MessageBox = lazy(() => import('@/views/groupware/communication/MessageBox'));
const Chat = lazy(() => import('@/views/groupware/communication/Chat'));

// 부서 / 가맹점
const DepartmentList = lazy(() => import('@/views/groupware/organization/DepartmentList'));
const FranchiseList = lazy(() => import('@/views/groupware/organization/FranchiseList'));
const EducationList = lazy(() => import('@/views/groupware/organization/EducationList'));
const InquiryList = lazy(() => import('@/views/groupware/organization/InquiryList'));

export const groupwareRoutes = [
  // 대시보드
  { path: '/groupware/dashboard', element: <Dashboard /> },

  // 사원 / 근태
  { path: '/groupware/employees', element: <EmployeeList /> },
  { path: '/groupware/employees/me', element: <MyInfo /> },
  { path: '/groupware/attendance', element: <AttendanceList /> },
  { path: '/groupware/attendance/dept', element: <AttendanceList /> },

  // 전자결재
  { path: '/groupware/drafts', element: <DraftCreate /> },
  { path: '/groupware/document-box', element: <DocumentBox /> },
  { path: '/groupware/document-box/pending', element: <PendingApproval /> },

  // 일정 / 회의
  { path: '/groupware/schedule', element: <ScheduleCalendar /> },
  { path: '/groupware/meetings', element: <MeetingList /> },
  { path: '/groupware/meeting-rooms', element: <MeetingRoomList /> },

  // 게시판
  { path: '/groupware/boards', element: <BoardList /> },
  { path: '/groupware/boards/categories', element: <CategoryManagement /> },

  // 쪽지 / 채팅
  { path: '/groupware/messages', element: <MessageBox /> },
  { path: '/groupware/chat', element: <Chat /> },

  // 부서
  { path: '/groupware/departments', element: <DepartmentList /> },

  // 가맹점
  { path: '/groupware/franchises', element: <FranchiseList /> },
  { path: '/groupware/franchise-educations', element: <EducationList /> },
  { path: '/groupware/franchise-inquiries', element: <InquiryList /> },
];
