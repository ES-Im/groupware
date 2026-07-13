import { useState } from 'react'
import type { FormEvent } from 'react'
import { Bell, ChevronDown, LogOut, MessagesSquare, Moon, Search, Sun, UserRound } from 'lucide-react'
import { Link } from 'react-router'
import { HeaderAttendanceQuickPanel } from '@/features/attendance/components/HeaderAttendanceQuickPanel'
import { useChatOverlayStore } from '@/features/chat/lib/chatOverlayStore'
import { useEmployeeSearchOverlayStore } from '@/features/employee/lib/employeeSearchOverlayStore'
import { HeaderUnreadMessagesPanel } from '@/features/message/components/HeaderUnreadMessagesPanel'
import { useMailboxCountsQuery } from '@/features/message/api/useMailboxCountsQuery'
import { BlobAvatar } from '@/shared/components/BlobAvatar'
import { SidebarToggleButton } from '@/shared/components/SidebarToggleButton'
import { cn } from '@/shared/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'

/**
 * 공통 셸 헤더(topbar, 순수 시각 요소). 사이드바를 포함한 페이지 전체 폭에 걸쳐 최상단에 위치한다.
 * 데이터 훅을 직접 소유하지 않고, 표시에 필요한 값은 전부 props로 주입받는다(로직 없음).
 *
 * 배치는 뷰포트에 따라 분기한다(2026-07-13 개편):
 * - 데스크톱(풀스크린, !isMobile): [햄버거] → (간격) → [로고] → [스페이서(우측 클러스터)]. 햄버거를
 *   헤더 최좌측에 두어 최좌측 고정 열이 된 Sidebar와 같은 가로 위치에 정렬하고(요구사항1), 로고는
 *   그 우측으로 일정 간격(gap-4)을 두고 배치한다(요구사항2). 헤더 높이는 h-14의 약 1.3배(h-18=72px)로
 *   키우고 로고·햄버거·우측 아이콘을 비례해 확대해 가시성을 높인다.
 * - 모바일(isMobile): 기존 그대로 [햄버거] → [축약 로고] → [스페이서]. 드로어 토글 관례상 햄버거가
 *   맨 앞이며, 높이·크기는 기존(h-14)을 유지한다.
 *
 * 우측 클러스터(rightCluster)는 두 분기가 공유하며, 확대는 lg: 반응형 유틸리티로만 적용해 모바일
 * (뷰포트 < lg) 크기는 그대로 유지한다. 순서: 알림 → 채팅 → 다크모드 토글 → 프로필 트리거.
 * 프로필 트리거는 뷰포트에 따라 동작이 갈린다(요구사항3·4): 데스크톱은 좌측 프로필 패널
 * (ProfileRailPanel)을 여닫는 토글 버튼, 모바일은 기존 드롭다운(내정보/로그아웃/출퇴근 퀵패널)이다.
 * 데스크톱에서 드롭다운을 없애도 내정보(/me)는 사이드바 메뉴 '내 정보', 로그아웃은 패널 내부 버튼이
 * 커버하므로 기능 손실은 없다. 기존 헤더 우측의 별도 "로그아웃" 버튼은 제거된 상태 그대로다.
 */
interface HeaderProps {
  collapsed: boolean
  onToggleSidebar: () => void
  /**
   * 모바일 뷰포트 여부(상위 useIsMobile 소유). onToggleSidebar가 무엇을 토글하는지(collapsed vs
   * 모바일 드로어)는 이미 상위(LayoutShell)에서 분기해 넘겨준다. 헤더는 이 값으로 배치(로고열/햄버거
   * 순서)와 로고 종류(풀 vs 축약)를 분기한다.
   */
  isMobile: boolean
  /** 모바일 드로어 열림 여부(상위 useMobileSidebarOpen 소유). SidebarToggleButton까지 전달만 한다. */
  mobileSidebarOpen: boolean
  /** 다크모드 활성 여부(상위 useDarkMode 소유). */
  isDark: boolean
  onToggleDarkMode: () => void
  /**
   * 좌측 프로필 패널(ProfileRailPanel) 열림 여부(상위 useProfileRailOpen 소유). 데스크톱 전용 토글로,
   * 프로필 트리거 버튼의 active 표시(배경·셰브런 회전)·aria-pressed에 쓴다.
   */
  profileRailOpen: boolean
  /** 데스크톱에서 사원 이름 클릭 시 좌측 프로필 패널을 여닫는 토글 핸들러(상위 소유). */
  onToggleProfileRail: () => void
  /** 로그인 사용자(RETRIEVE_ME_INFO 응답). 미로딩 시 사용자 클러스터를 렌더하지 않는다. */
  me: { empBasicInfo: { name: string } } | undefined
  /** 활성 PROFILE_PICTURE fileId(상위에서 도출). */
  profilePictureFileId?: number
  onLogout: () => void
  logoutPending: boolean
}

/**
 * 헤더 우측 아이콘 버튼(알림·채팅·다크모드) 공통 클래스. 헤더 배경은 라이트=bg-primary,
 * 다크=bg-card(둘 다 어두운 크롬 톤)이므로, 전경색은 라이트에서 primary-foreground,
 * 다크에서 card-foreground(둘 다 밝은색)로 스왑해 어느 테마에서도 대비를 확보한다.
 * 데스크톱(lg 이상)에서는 커진 헤더에 맞춰 버튼을 size-8→size-10으로 비례 확대한다(모바일 유지).
 */
const chromeIconButtonClass =
  'inline-flex size-8 items-center justify-center rounded-md text-primary-foreground/70 transition-colors hover:bg-primary-foreground/10 hover:text-primary-foreground focus-visible:ring-2 focus-visible:ring-primary-foreground/40 focus-visible:outline-none lg:size-10 dark:text-card-foreground/70 dark:hover:bg-card-foreground/10 dark:hover:text-card-foreground dark:focus-visible:ring-card-foreground/40'

export function Header({
  collapsed,
  onToggleSidebar,
  isMobile,
  mobileSidebarOpen,
  isDark,
  onToggleDarkMode,
  profileRailOpen,
  onToggleProfileRail,
  me,
  profilePictureFileId,
  onLogout,
  logoutPending,
}: HeaderProps) {
  const toggleChatOverlay = useChatOverlayStore((state) => state.toggle)
  const openEmployeeSearch = useEmployeeSearchOverlayStore((state) => state.open)
  const [employeeSearchInput, setEmployeeSearchInput] = useState('')
  const mailboxCountsQuery = useMailboxCountsQuery()
  const unreadCount = mailboxCountsQuery.data?.unreadReceivedCount ?? 0

  /** 사원 찾기(F1xx): Enter 제출 또는 검색 아이콘 클릭 시 오버레이를 연다(빈 검색어는 무시). */
  function handleSubmitEmployeeSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = employeeSearchInput.trim()
    if (!trimmed) {
      return
    }
    openEmployeeSearch(trimmed)
  }

  // 스페이서 겸 우측 클러스터: 이후 요소를 우측으로 밀어낸다. 데스크톱/모바일 분기가 공유하며,
  // 확대는 lg: 유틸리티로만 적용해 모바일 크기는 기존 그대로 유지한다.
  const rightCluster = (
    <div className="flex flex-1 items-center justify-end gap-1.5 sm:gap-2">
      {/* 검색: 부서·사원을 한 입력창에서 함께 찾는다. Enter(또는 아이콘 클릭) 제출 시 검색어로
          EmployeeSearchOverlay를 열어 부서/사원 결과를 함께 보여준다. 좁은 화면(sm 미만)에서는
          헤더 폭 확보를 위해 숨긴다. 데스크톱에서는 커진 헤더에 맞춰 인풋 높이를 h-9→h-10으로 키운다. */}
      <form onSubmit={handleSubmitEmployeeSearch} className="hidden sm:block">
        <label htmlFor="header-employee-search" className="sr-only">
          부서·사원 검색
        </label>
        <div className="relative">
          <button
            type="submit"
            aria-label="부서·사원 검색"
            className="absolute top-1/2 left-2.5 -translate-y-1/2 text-primary-foreground/60 transition-colors hover:text-primary-foreground dark:text-card-foreground/60 dark:hover:text-card-foreground"
          >
            <Search className="size-4" aria-hidden="true" />
          </button>
          <input
            id="header-employee-search"
            type="search"
            value={employeeSearchInput}
            onChange={(event) => setEmployeeSearchInput(event.target.value)}
            placeholder="부서·사원 검색"
            className="h-9 w-44 rounded-md border border-primary-foreground/20 bg-primary-foreground/10 pr-3 pl-8 text-sm text-primary-foreground transition-[width,background-color] placeholder:text-primary-foreground/50 outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground/40 md:w-56 lg:h-10 lg:w-72 dark:border-card-foreground/20 dark:bg-card-foreground/10 dark:text-card-foreground dark:placeholder:text-card-foreground/50 dark:focus-visible:ring-card-foreground/40"
          />
        </div>
      </form>
      {/* 알림 벨(S3): 클릭 시 안읽은 쪽지 목록(HeaderUnreadMessagesPanel)을 드롭다운으로 노출.
          배지는 mailboxCounts.unreadReceivedCount(사이드바 배지와 동일 소스, useMailboxCountsQuery
          캐시 공유)를 아이콘 우상단에 겹쳐 표시한다. */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" aria-label="알림" className={cn(chromeIconButtonClass, 'relative')}>
            <Bell className="size-4 lg:size-5" aria-hidden="true" />
            {unreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] leading-none font-medium text-destructive-foreground">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-auto p-1.5">
          <HeaderUnreadMessagesPanel />
        </DropdownMenuContent>
      </DropdownMenu>
      {/* 채팅 버튼(S4): 클릭 시 채팅 오버레이 패널을 토글한다(재클릭하면 닫힘). 순수 UI
          내비게이션 상태(chatOverlayStore)라 상위(LayoutShell)에서 props로 주입하지 않고
          Header가 훅으로 직접 구독한다. */}
      <button
        type="button"
        onClick={toggleChatOverlay}
        aria-label="채팅"
        className={chromeIconButtonClass}
      >
        <MessagesSquare className="size-4 lg:size-5" aria-hidden="true" />
      </button>
      {/* 다크모드 on/off 토글: 참고 스크린샷의 태양 아이콘 위치(알림/채팅 옆) 재현. */}
      <button
        type="button"
        onClick={onToggleDarkMode}
        aria-label="다크모드 전환"
        aria-pressed={isDark}
        className={chromeIconButtonClass}
      >
        {isDark ? (
          <Sun className="size-4 lg:size-5" aria-hidden="true" />
        ) : (
          <Moon className="size-4 lg:size-5" aria-hidden="true" />
        )}
      </button>
      {me &&
        (isMobile ? (
          // 모바일: 기존 프로필 드롭다운을 그대로 유지한다(요구사항4) — 아바타+사용자명 클릭 시
          // 출퇴근 퀵패널/내 정보/로그아웃 메뉴 노출. 좌측 프로필 패널(ProfileRailPanel)은 모바일에서
          // 마운트되지 않으므로, 이 드롭다운이 데스크톱 패널의 역할을 대신한다.
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="ml-1 flex items-center gap-2 rounded-full py-1 pr-2 pl-1 transition-colors hover:bg-primary-foreground/10 focus-visible:ring-2 focus-visible:ring-primary-foreground/40 focus-visible:outline-none dark:hover:bg-card-foreground/10 dark:focus-visible:ring-card-foreground/40"
              >
                {/*
                  프로필 아바타(F101, ROADMAP T5.3): T5.1의 BlobAvatar 공유 프리미티브를 연결한다.
                  본인 case는 RETRIEVE_ME_INFO/RETRIEVE_FILES_INFOS 응답 어디에도 numeric empId가
                  없다(empBasicInfo.empNo는 문자열, §리스크7 실측 확정). EMP_FILE_PREVIEW는 경로에
                  numeric {empId}를 요구하므로 현재는 이미지 로딩이 불가능해 이니셜 폴백에 머문다.
                */}
                {/* todo: 본인 preview용 numeric empId 소스 확정(서버가 me 전용 preview 기능 제공 or me 응답에 empId 추가) 필요 */}
                <BlobAvatar
                  empId={undefined}
                  fileId={profilePictureFileId}
                  fallbackText={me.empBasicInfo.name}
                  className="bg-primary-foreground/15 text-primary-foreground dark:bg-card-foreground/15 dark:text-card-foreground"
                />
                <span className="hidden text-sm font-medium text-primary-foreground sm:inline dark:text-card-foreground">
                  {me.empBasicInfo.name}
                </span>
                <ChevronDown
                  className="hidden size-3.5 text-primary-foreground/70 sm:inline dark:text-card-foreground/70"
                  aria-hidden="true"
                />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal text-muted-foreground">
                {me.empBasicInfo.name}님, 환영합니다
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {/* 출퇴근 퀵패널(요청: 우측 사원이름 클릭시 table view 요소 추가). */}
              <HeaderAttendanceQuickPanel />
              <DropdownMenuSeparator />
              {/* 내 정보 조회 페이지(ROADMAP T2.3)는 MyInfoPage로 연결됐다. */}
              <DropdownMenuItem asChild>
                <Link to="/me">
                  <UserRound aria-hidden="true" />
                  내 정보
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {/* 로그아웃(F012): 기존 헤더 단독 버튼에서 드롭다운 메뉴 항목으로 이전. */}
              <DropdownMenuItem variant="destructive" onSelect={onLogout} disabled={logoutPending}>
                <LogOut aria-hidden="true" />
                로그아웃
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          // 데스크톱(풀스크린): 사원 이름/아바타 클릭 = 좌측 프로필 패널(ProfileRailPanel) 토글
          // (요구사항3·4). 드롭다운이 아니라 순수 토글 버튼이며, 열림 상태는 배경 하이라이트 +
          // 셰브런 180° 회전 + aria-pressed로 표시한다. 내정보/로그아웃 진입은 사이드바 메뉴 '내 정보'와
          // 패널 내부 로그아웃 버튼이 커버하므로 드롭다운 제거로 인한 기능 손실은 없다.
          <button
            type="button"
            onClick={onToggleProfileRail}
            aria-pressed={profileRailOpen}
            aria-label={profileRailOpen ? '내 프로필 패널 닫기' : '내 프로필 패널 열기'}
            className={cn(
              'ml-1 flex items-center gap-2 rounded-full py-1 pr-2 pl-1 transition-colors hover:bg-primary-foreground/10 focus-visible:ring-2 focus-visible:ring-primary-foreground/40 focus-visible:outline-none dark:hover:bg-card-foreground/10 dark:focus-visible:ring-card-foreground/40',
              profileRailOpen && 'bg-primary-foreground/10 dark:bg-card-foreground/10',
            )}
          >
            {/* todo: 본인 preview용 numeric empId 소스 확정(서버가 me 전용 preview 기능 제공 or me 응답에 empId 추가) 필요 */}
            <BlobAvatar
              empId={undefined}
              fileId={profilePictureFileId}
              fallbackText={me.empBasicInfo.name}
              className="bg-primary-foreground/15 text-primary-foreground lg:size-9 lg:text-sm dark:bg-card-foreground/15 dark:text-card-foreground"
            />
            <span className="text-sm font-medium text-primary-foreground lg:text-base dark:text-card-foreground">
              {me.empBasicInfo.name}
            </span>
            <ChevronDown
              className={cn(
                'size-3.5 text-primary-foreground/70 transition-transform lg:size-4 dark:text-card-foreground/70',
                profileRailOpen && 'rotate-180',
              )}
              aria-hidden="true"
            />
          </button>
        ))}
    </div>
  )

  return (
    // 헤더는 라이트·다크 모두 어두운 크롬 스트립을 유지한다: 라이트=bg-primary, 다크=bg-card.
    // (다크에서 bg-primary는 near-white로 반전돼 과하게 밝으므로, 실존 다크 표면 토큰 card로 스왑)
    // 모바일: 기존 그대로(좌우 px-4, gap-2, h-14). 데스크톱(풀스크린): 높이를 약 1.3배(h-18=72px)로
    // 키운다. 좌측 여백은 [햄버거+로고] 그룹이 pl-4로 자체 처리하므로 헤더 자체에는 우측 여백(pr-4)만
    // 둔다(햄버거가 최좌측 고정 열 Sidebar와 같은 가로 위치에 오도록).
    <header
      className={cn(
        'flex h-14 shrink-0 items-center bg-primary text-primary-foreground dark:bg-card dark:text-card-foreground',
        isMobile ? 'gap-2 px-4' : 'pr-4 lg:h-18',
      )}
    >
      {isMobile ? (
        <>
          {/* 로고+햄버거 그룹(모바일: 좌측 최전방, 드로어 토글 관례). items-center로 세로 중앙 정렬을
              그룹 자체에도 명시한다. */}
          <div className="flex items-center">
            <SidebarToggleButton
              collapsed={collapsed}
              onToggle={onToggleSidebar}
              isMobile={isMobile}
              mobileSidebarOpen={mobileSidebarOpen}
            />
            {/* 회사 로고(S1): 모바일은 헤더 폭이 좁아 아이콘 마크만 있는 축약 로고(haruon-logo-sm.svg)를
                항상 유지한다(collapsed 값과 무관, 배경과 무관하게 보이는 색상 조합이라 테마 분기 불필요). */}
            <Link to="/" className="ml-1.5 flex shrink-0 items-center sm:ml-2.5">
              <img src="/haruon-logo-sm.svg" alt="HARUON" className="size-8" />
            </Link>
          </div>
          {rightCluster}
        </>
      ) : (
        <>
          {/* 햄버거+로고 그룹(데스크톱, 2026-07-13 개편): 요구사항1·2에 따라 사이드바 토글(햄버거)을
              헤더 최좌측에 두어 최좌측 고정 열이 된 Sidebar와 같은 가로 위치에 정렬하고, 로고는 그
              우측으로 일정 간격(gap-4)을 두고 배치한다. pl-4로 좌측 여백을 주어 햄버거가 뷰포트
              가장자리에 붙지 않게 한다(모바일 px-4 좌측 여백과 동일 리듬). 로고 클릭 시 홈(`/`) 이동.
              사이드바 접힘(collapsed) 여부와 무관하게 항상 풀 로고(haruon-logo.svg)를 유지한다
              (요청: 풀스크린에서 햄버거를 눌러 사이드바가 접혀도 로고는 간소화되지 않게 함).
              헤더 배경이 라이트=bg-primary/다크=bg-card로 어둡게 고정돼 흰 글자 로고를 양쪽에서 쓴다. */}
          <div className="flex items-center gap-4 pl-4">
            <SidebarToggleButton
              collapsed={collapsed}
              onToggle={onToggleSidebar}
              isMobile={isMobile}
              mobileSidebarOpen={mobileSidebarOpen}
            />
            <Link to="/" className="flex shrink-0 items-center">
              <img src="/haruon-logo.svg" alt="HARUON" className="h-7 w-auto lg:h-9" />
            </Link>
          </div>
          {rightCluster}
        </>
      )}
    </header>
  )
}
