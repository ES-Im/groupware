import { createBrowserRouter, Navigate } from 'react-router'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { HomePage } from '@/features/home/pages/HomePage'
import { RegisterPage } from '@/features/auth/pages/RegisterPage'
import { MyAttendancePage } from '@/features/attendance/pages/MyAttendancePage'
import { DeptAttendancePage } from '@/features/attendance/pages/DeptAttendancePage'
import { DocumentBoxHomePage } from '@/features/approval/pages/DocumentBoxHomePage'
import { CancellationDraftCreatePage } from '@/features/approval/pages/CancellationDraftCreatePage'
import { DraftCreatePreviewPage } from '@/features/approval/pages/DraftCreatePreviewPage'
import { DraftDetailPage } from '@/features/approval/pages/DraftDetailPage'
import { DraftPrintPreviewPage } from '@/features/approval/pages/DraftPrintPreviewPage'
import { GeneralDraftCreatePage } from '@/features/approval/pages/GeneralDraftCreatePage'
import { GeneralDraftEditPage } from '@/features/approval/pages/GeneralDraftEditPage'
import { BusinessTripDraftCreatePage } from '@/features/approval/pages/BusinessTripDraftCreatePage'
import { BusinessTripDraftEditPage } from '@/features/approval/pages/BusinessTripDraftEditPage'
import { MyBusinessTripHistoryPage } from '@/features/approval/pages/MyBusinessTripHistoryPage'
import { DeptBusinessTripHistoryPage } from '@/features/approval/pages/DeptBusinessTripHistoryPage'
import { LeaveDraftCreatePage } from '@/features/approval/pages/LeaveDraftCreatePage'
import { LeaveDraftEditPage } from '@/features/approval/pages/LeaveDraftEditPage'
import { SalesDraftCreatePage } from '@/features/approval/pages/SalesDraftCreatePage'
import { SalesDraftEditPage } from '@/features/approval/pages/SalesDraftEditPage'
import { MyLeavePage } from '@/features/leave/pages/MyLeavePage'
import { DeptLeavePage } from '@/features/leave/pages/DeptLeavePage'
import { AdminLeavePage } from '@/features/leave/pages/AdminLeavePage'
import { BoardCreatePage } from '@/features/board/pages/BoardCreatePage'
import { BoardDetailPage } from '@/features/board/pages/BoardDetailPage'
import { BoardDraftsPage } from '@/features/board/pages/BoardDraftsPage'
import { BoardEditPage } from '@/features/board/pages/BoardEditPage'
import { BoardListPage } from '@/features/board/pages/BoardListPage'
import { DepartmentDetailPage } from '@/features/department/pages/DepartmentDetailPage'
import { DepartmentExplorerEmptyState } from '@/features/department/pages/DepartmentExplorerEmptyState'
import { DepartmentMembersPage } from '@/features/department/pages/DepartmentMembersPage'
import { DepartmentsExplorerLayout } from '@/features/department/pages/DepartmentsExplorerLayout'
import { CompanyInfoPage } from '@/features/company/pages/CompanyInfoPage'
import { MessageBoxPage } from '@/features/message/pages/MessageBoxPage'
import { EmployeeDetailPage } from '@/features/employee/pages/EmployeeDetailPage'
import { EmpManagementListPage } from '@/features/employee/pages/EmpManagementListPage'
import { MyInfoPage } from '@/features/employee/pages/MyInfoPage'
import { NewEmployeeApprovalListPage } from '@/features/employee/registration/pages/NewEmployeeApprovalListPage'
import { MyMeetingCalendarPage } from '@/features/meeting/pages/MyMeetingCalendarPage'
import { MeetingReservationCreatePage } from '@/features/meeting/pages/MeetingReservationCreatePage'
import { MeetingReservationManagementPage } from '@/features/meeting/pages/MeetingReservationManagementPage'
import { MeetingRoomManagementPage } from '@/features/meeting/pages/MeetingRoomManagementPage'
import { MeetingRoomDetailPage } from '@/features/meeting/pages/MeetingRoomDetailPage'
import { MeetingRoomManagementDetailPage } from '@/features/meeting/pages/MeetingRoomManagementDetailPage'
import { FranchiseListPage } from '@/features/franchise/pages/FranchiseListPage'
import { FranchiseDetailPage } from '@/features/franchise/pages/FranchiseDetailPage'
import { FranchiseEducationCalendarPage } from '@/features/franchise/pages/FranchiseEducationCalendarPage'
import { FranchiseEducationDetailPage } from '@/features/franchise/pages/FranchiseEducationDetailPage'
import { FranchiseInquiryListPage } from '@/features/franchise/pages/FranchiseInquiryListPage'
import { FranchiseInquiryDetailPage } from '@/features/franchise/pages/FranchiseInquiryDetailPage'
import { ScheduleCalendarPage } from '@/features/schedule/pages/ScheduleCalendarPage'
import { ProtectedRoute } from '@/shared/components/ProtectedRoute'
import { LayoutShell } from '@/shared/components/LayoutShell'
import { RouteErrorBoundary } from '@/shared/components/errors/RouteErrorBoundary'
import { NotFoundPage } from '@/shared/components/errors/NotFoundPage'
import { MaintenancePage } from '@/shared/components/errors/MaintenancePage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <LayoutShell />
      </ProtectedRoute>
    ),
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'departments',
        element: <DepartmentsExplorerLayout />,
        children: [
          { index: true, element: <DepartmentExplorerEmptyState /> },
          { path: ':deptId', element: <DepartmentDetailPage /> },
        ],
      },
      {
        path: 'department-members',
        element: <DepartmentMembersPage />,
      },
      {
        path: 'boards',
        element: <BoardListPage />,
      },
      {
        path: 'boards/new',
        element: <BoardCreatePage />,
      },
      {
        path: 'boards/drafts',
        element: <BoardDraftsPage />,
      },
      {
        path: 'boards/:boardId',
        element: <BoardDetailPage />,
      },
      {
        path: 'boards/:boardId/edit',
        element: <BoardEditPage />,
      },
      {
        path: 'employees',
        element: <EmpManagementListPage />,
      },
      {
        path: 'employees/new',
        element: <NewEmployeeApprovalListPage />,
      },
      {
        path: 'employees/:empId',
        element: <EmployeeDetailPage />,
      },
      {
        path: 'me',
        element: <MyInfoPage />,
      },
      {
        path: 'attendance/me',
        element: <MyAttendancePage />,
      },
      {
        path: 'attendance/dept',
        element: <DeptAttendancePage />,
      },
      {
        path: 'approval/box',
        element: <Navigate to="/approval/box/pending" replace />,
      },
      {
        path: 'approval/box/:tab',
        element: <DocumentBoxHomePage />,
      },
      {
        path: 'approval/drafts/new',
        element: <GeneralDraftCreatePage />,
      },
      {
        path: 'approval/drafts/business-trips/new',
        element: <BusinessTripDraftCreatePage />,
      },
      {
        path: 'approval/drafts/leaves/new',
        element: <LeaveDraftCreatePage />,
      },
      {
        path: 'approval/drafts/sales/new',
        element: <SalesDraftCreatePage />,
      },
      {
        path: 'approval/drafts/:draftId',
        element: <DraftDetailPage />,
      },
      {
        path: 'approval/drafts/:draftId/edit',
        element: <GeneralDraftEditPage />,
      },
      {
        path: 'approval/drafts/:draftId/cancellation',
        element: <CancellationDraftCreatePage />,
      },
      {
        path: 'approval/drafts/business-trips/:draftId/edit',
        element: <BusinessTripDraftEditPage />,
      },
      {
        path: 'approval/drafts/leaves/:draftId/edit',
        element: <LeaveDraftEditPage />,
      },
      {
        path: 'approval/drafts/sales/:draftId/edit',
        element: <SalesDraftEditPage />,
      },
      {
        path: 'approval/business-trips/me/history',
        element: <MyBusinessTripHistoryPage />,
      },
      {
        path: 'approval/business-trips/dept/history',
        element: <DeptBusinessTripHistoryPage />,
      },
      {
        path: 'leaves/me',
        element: <MyLeavePage />,
      },
      {
        path: 'leaves/dept',
        element: <DeptLeavePage />,
      },
      {
        path: 'leaves/admin',
        element: <AdminLeavePage />,
      },
      {
        path: 'settings/company',
        element: <CompanyInfoPage />,
      },
      {
        path: 'meetings',
        element: <MyMeetingCalendarPage />,
      },
      {
        path: 'meetings/new',
        element: <MeetingReservationCreatePage />,
      },
      {
        path: 'meetings/management',
        element: <MeetingReservationManagementPage />,
      },
      {
        path: 'meeting-rooms/management',
        element: <MeetingRoomManagementPage />,
      },
      {
        path: 'meeting-rooms/:meetingRoomId',
        element: <MeetingRoomDetailPage />,
      },
      {
        path: 'meeting-rooms/management/:meetingRoomId',
        element: <MeetingRoomManagementDetailPage />,
      },
      {
        path: 'schedules',
        element: <ScheduleCalendarPage />,
      },
      {
        path: 'messages',
        element: <Navigate to="/messages/received" replace />,
      },
      {
        path: 'messages/:box',
        element: <MessageBoxPage />,
      },
      {
        path: 'franchises',
        element: <FranchiseListPage />,
      },
      {
        path: 'franchises/:franchiseId',
        element: <FranchiseDetailPage />,
      },
      {
        path: 'franchise-educations',
        element: <FranchiseEducationCalendarPage />,
      },
      {
        path: 'franchise-educations/:educationId',
        element: <FranchiseEducationDetailPage />,
      },
      {
        path: 'franchise-inquiries',
        element: <FranchiseInquiryListPage />,
      },
      {
        path: 'franchise-inquiries/:inquiryId',
        element: <FranchiseInquiryDetailPage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '/maintenance',
    element: <MaintenancePage />,
  },
  {
    path: '/approval/drafts/:draftId/print',
    element: (
      <ProtectedRoute>
        <DraftPrintPreviewPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/approval/drafts/preview',
    element: (
      <ProtectedRoute>
        <DraftCreatePreviewPage />
      </ProtectedRoute>
    ),
  },
])
