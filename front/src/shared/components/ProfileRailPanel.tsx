import { LogOut, MessagesSquare } from 'lucide-react'
import { RailAttendanceTiles } from '@/features/attendance/components/RailAttendanceTiles'
import { useChatOverlayStore } from '@/features/chat/lib/chatOverlayStore'
import { useCompanyInfoQuery } from '@/features/company/api/useCompanyInfoQuery'
import type { CurrentDept } from '@/features/employee/model/me'
import { RailReminderPanel } from '@/features/message/components/RailReminderPanel'
import { RailMiniCalendar } from '@/features/schedule/components/RailMiniCalendar'
import { BlobAvatar } from '@/shared/components/BlobAvatar'

/** 회사 정보 미등록/로딩/조회 실패 시 조용히 폴백할 회사명(Footer.tsx 패턴 복제). */
const FALLBACK_COMPANY_NAME = '하루온 그룹(HARUON Group)'

interface ProfileRailPanelProps {
  me:
    | {
        empBasicInfo: { name: string; empNo: string }
        currentDepts: CurrentDept[]
      }
    | undefined
  profilePictureFileId?: number
  onLogout: () => void
  logoutPending: boolean
}

/**
 * 공통 셸 우측 프로필 패널(사용자 확정 2026-07-13: 화면 최우측에 개폐). 개편 전에는 좌측에서 상시
 * 고정 노출이었으나, 이제 헤더의 사원 이름 클릭으로 여닫는 토글 대상이 되었다(풀스크린 전용,
 * 요구사항3·4). 실제 열림/닫힘 상태와
 * 마운트 여부는 상위 LayoutShell(useProfileRailOpen)이 소유하며, 이 컴포넌트는 열렸을 때만 마운트되는
 * 프레젠테이셔널 뷰다 — 모바일/태블릿에서는 마운트되지 않고 헤더 사원 이름은 기존 드롭다운(내정보/
 * 로그아웃/출퇴근 퀵패널)으로 동작한다. 내부 `hidden … lg:flex`는 데스크톱-열림 상태에서 모바일 폭으로
 * 리사이즈되는 예외 상황의 안전장치로 유지한다(그 창에서는 숨겨지고, 헤더는 모바일 분기로 전환된다).
 *
 * 색감은 헤더와 동일한 어두운 크롬 톤을 유지한다(요청: "헤더와 같은 색"): 라이트=bg-primary,
 * 다크=bg-card. 그 위 자식 요소의 텍스트/보더/배경은 Header.chromeIconButtonClass 패턴을 따라
 * primary-foreground(라이트)·card-foreground(다크) 계열로 스왑해 어느 테마에서도 대비를 확보한다.
 * 섹션 간에는 낮은 대비 크롬 보더(Sidebar 접힘 상태와 동일 톤)로 구분선을 둔다.
 *
 * 여러 도메인 정보를 한 화면에 모으는 조합 컴포넌트라 도메인 훅 호출은 하위 컴포넌트
 * (RailAttendanceTiles/RailMiniCalendar/RailReminderPanel)에 위임하고, 이 컴포넌트는
 * LayoutShell이 이미 조회한 me/profilePictureFileId만 props로 받아 조합한다(Header와 동일 패턴).
 * 예외로 하단 회사정보/저작권은 옛 Footer.tsx가 보여주던 전체 상세(대표/위치/연락처/홈페이지/
 * 저작권)를 그대로 옮겨온다(2026-07-13 사용자 결정 — Footer.tsx는 회사명+저작권만 남기고 상세는
 * 이 패널이 전담). 로딩/미등록/실패 시 정적 회사명으로 조용히 폴백한다(장식적 요소, 에러 토스트 없음).
 */
export function ProfileRailPanel({ me, profilePictureFileId, onLogout, logoutPending }: ProfileRailPanelProps) {
  const toggleChatOverlay = useChatOverlayStore((state) => state.toggle)
  const { data: companyInfo } = useCompanyInfoQuery()

  if (!me) {
    return (
      <aside className="hidden w-72 shrink-0 border-l border-primary-foreground/10 bg-primary lg:block dark:border-card-foreground/10 dark:bg-card" />
    )
  }

  const primaryDept = me.currentDepts.find((dept) => dept.isPrimary) ?? me.currentDepts[0]

  return (
    // 헤더와 동일한 어두운 크롬 배경(라이트=bg-primary, 다크=bg-card)에 밝은 전경색을 얹는다.
    // divide-y로 각 섹션 사이에 낮은 대비 크롬 구분선을 넣는다(요청: 기능별 seperate).
    // 사용자 확정(2026-07-13): 패널이 화면 최우측(본문 오른쪽)에 부착되므로, 본문과의 경계선은
    // 오른쪽(border-r)이 아니라 왼쪽(border-l)에 둔다.
    <aside className="hidden w-72 shrink-0 flex-col divide-y divide-primary-foreground/10 overflow-y-auto border-l border-primary-foreground/10 bg-primary text-primary-foreground lg:flex dark:divide-card-foreground/10 dark:border-card-foreground/10 dark:bg-card dark:text-card-foreground">
      {/* 개인 프로필 공간(요청: "출퇴근 버튼 위치까지" 확장) — 웰컴인사와 출퇴근 타일을 구분선 없는
          하나의 섹션으로 묶는다. divide-y는 이 바깥 래퍼 하나만 세므로 두 블록 사이엔 경계선이 생기지
          않는다(2026-07-13 사용자 결정). */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex flex-col items-center gap-2 pb-4 text-center">
          <BlobAvatar
            empId={undefined}
            fileId={profilePictureFileId}
            fallbackText={me.empBasicInfo.name}
            className="size-14 bg-primary-foreground/15 text-base text-primary-foreground dark:bg-card-foreground/15 dark:text-card-foreground"
          />
          <div className="space-y-0.5">
            <p className="text-[11px] font-semibold tracking-wide text-primary-foreground/60 uppercase dark:text-card-foreground/60">
              Welcome Back
            </p>
            <p className="text-sm font-semibold">{me.empBasicInfo.name}님, 좋은 하루입니다.</p>
          </div>
          {primaryDept && (
            <p className="text-xs text-primary-foreground/70 dark:text-card-foreground/70">
              {primaryDept.deptName} · {primaryDept.positionName} · {me.empBasicInfo.empNo}
            </p>
          )}
        </div>
        {/* 출 퇴근 버튼 */}
        <RailAttendanceTiles />
      </div>

      {/* 채팅에 들어갈 수 있는 버튼 */}
      <div className="px-4 py-4">
        <button
          type="button"
          onClick={toggleChatOverlay}
          className="flex w-full items-center justify-center gap-2 rounded-md border border-primary-foreground/20 bg-primary-foreground/10 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-foreground/20 dark:border-card-foreground/20 dark:bg-card-foreground/10 dark:text-card-foreground dark:hover:bg-card-foreground/20"
        >
          <MessagesSquare className="size-4" aria-hidden="true" />
          채팅 바로가기
        </button>
      </div>

      {/* 작은 캘린더 */}
      <div className="px-4 py-4">
        <RailMiniCalendar />
      </div>

      {/* reminder(안읽은 쪽지) */}
      <RailReminderPanel />

      {/* 로그아웃 버튼(참고 스크린샷 반영, 2026-07-13 사용자 결정) + 회사정보/저작권 푸터 */}
      <div className="mt-auto px-4 py-4">
        <button
          type="button"
          onClick={onLogout}
          disabled={logoutPending}
          className="flex w-full items-center justify-center gap-2 rounded-md border border-primary-foreground/20 py-2 text-sm font-medium text-primary-foreground/70 transition-colors hover:bg-primary-foreground/10 hover:text-destructive disabled:pointer-events-none disabled:opacity-50 dark:border-card-foreground/20 dark:text-card-foreground/70 dark:hover:bg-card-foreground/10"
        >
          <LogOut className="size-4" aria-hidden="true" />
          로그아웃
        </button>
        {/* 회사정보/저작권(요청: 로그아웃 아래에 옛 Footer.tsx 내용 전체 배치, 상단 구분선).
            패널 폭(w-72)이 좁아 한 줄 대신 필드별로 줄바꿈한다(정보량은 옛 Footer.tsx와 동일). */}
        <div className="mt-4 border-t border-primary-foreground/10 pt-4 text-center dark:border-card-foreground/10">
          {companyInfo ? (
            <>
              <p className="text-xs font-medium text-primary-foreground/70 dark:text-card-foreground/70">
                {companyInfo.companyName} · 대표 {companyInfo.ownerName}
              </p>
              <p className="mt-1 text-[10px] leading-relaxed text-primary-foreground/50 dark:text-card-foreground/50">
                {companyInfo.location}
              </p>
              <p className="mt-1 text-[10px] leading-relaxed text-primary-foreground/50 dark:text-card-foreground/50">
                대표전화 {companyInfo.presentedExternalNo}
              </p>
              <p className="mt-1 text-[10px] leading-relaxed text-primary-foreground/50 dark:text-card-foreground/50">
                이메일 {companyInfo.presentedEmail}
              </p>
              <a
                href={companyInfo.homePageURL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 block truncate text-[10px] text-primary-foreground/50 underline underline-offset-2 hover:text-primary-foreground dark:text-card-foreground/50 dark:hover:text-card-foreground"
              >
                {companyInfo.homePageURL}
              </a>
              <p className="mt-2 text-[10px] leading-relaxed text-primary-foreground/50 dark:text-card-foreground/50">
                &copy; {new Date().getFullYear()} {companyInfo.companyName}. All rights reserved.
              </p>
            </>
          ) : (
            <p className="text-[10px] leading-relaxed text-primary-foreground/50 dark:text-card-foreground/50">
              &copy; {new Date().getFullYear()} {FALLBACK_COMPANY_NAME}. All rights reserved.
            </p>
          )}
        </div>
      </div>
    </aside>
  )
}
