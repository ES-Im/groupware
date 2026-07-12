import { MyScheduleWidget } from '../components/MyScheduleWidget'
import { PendingApprovalWidget } from '../components/PendingApprovalWidget'
import { UnreadMessagesWidget } from '../components/UnreadMessagesWidget'
import { WelcomeAttendanceCard } from '../components/WelcomeAttendanceCard'

/**
 * 홈 대시보드(사이드바 "홈" 항목, minRole EMPLOYEE의 실제 진입점).
 *
 * localhost:5174/apps/groupware/dashboard(Ubold 레퍼런스)를 이식했다. 레퍼런스 소스
 * (dashboard/index.tsx·data.ts)를 실측한 결과 역할 분기 로직이 전혀 없는 단일 정적 목업이었다.
 * 최초 이식 시 전 직원 공통 위젯(환영+출퇴근·내 일정·결재 대기함)과 FRANCHISE 역할 전용 위젯
 * (담당 가맹점 문의·다가오는 가맹점 교육)으로 분리했으나, "최근 7일 인기 게시글"과 함께 FRANCHISE
 * 전용 2개 위젯도 사용자 지시로 제거했다(2026-07-12) — 그 자리는 전 직원 공통인 안읽은 쪽지함
 * 위젯(UnreadMessagesWidget)으로 대체했다. 이제 이 페이지의 4개 위젯은 전부 role 게이팅 없이
 * EMPLOYEE 공통으로 노출된다.
 */
export function HomePage() {
  return (
    <div className="w-full space-y-4 p-4 sm:p-6 lg:p-8">
      <WelcomeAttendanceCard />

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <MyScheduleWidget />
        </div>
        <div className="flex flex-col gap-4">
          <PendingApprovalWidget />
          <UnreadMessagesWidget />
        </div>
      </div>
    </div>
  )
}
