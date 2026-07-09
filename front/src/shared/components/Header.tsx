import { Bell, ChevronDown, LogOut, MessageSquare, Moon, Sun, UserRound } from 'lucide-react'
import { Link } from 'react-router'
import { BlobAvatar } from '@/shared/components/BlobAvatar'
import { SidebarToggleButton } from '@/shared/components/SidebarToggleButton'
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
 * 배치 순서(ROADMAP T4.2 / PRD §B-1, 참고 스크린샷 반영): 사이드바 토글 → 로고 → 스페이서 →
 * 알림 → 채팅 → 다크모드 토글 → 프로필 드롭다운(아바타+사용자명+셰브런, 클릭 시 내 정보/로그아웃).
 * 기존 헤더 우측의 별도 "로그아웃" 버튼은 제거하고 프로필 드롭다운 안으로 이동했다.
 */
interface HeaderProps {
  collapsed: boolean
  onToggleSidebar: () => void
  /**
   * 모바일 뷰포트 여부(상위 useIsMobile 소유). onToggleSidebar가 무엇을 토글하는지(collapsed vs
   * 모바일 드로어)는 이미 상위(LayoutShell)에서 분기해 넘겨준다. 이 값 자체는 아직 시각적으로
   * 쓰지 않고 SidebarToggleButton까지 그대로 전달만 한다 — 다음 단계(ux-ui-stylist)에서 토글
   * 아이콘/aria 전환 등에 사용할 수 있다.
   */
  isMobile: boolean
  /** 모바일 드로어 열림 여부(상위 useMobileSidebarOpen 소유). 위 isMobile과 동일하게 전달만 한다. */
  mobileSidebarOpen: boolean
  /** 다크모드 활성 여부(상위 useDarkMode 소유). */
  isDark: boolean
  onToggleDarkMode: () => void
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
 */
const chromeIconButtonClass =
  'inline-flex size-8 items-center justify-center rounded-md text-primary-foreground/70 transition-colors hover:bg-primary-foreground/10 hover:text-primary-foreground focus-visible:ring-2 focus-visible:ring-primary-foreground/40 focus-visible:outline-none dark:text-card-foreground/70 dark:hover:bg-card-foreground/10 dark:hover:text-card-foreground dark:focus-visible:ring-card-foreground/40'

/**
 * 채팅 창 열기(ROADMAP(CHAT) T0.2 / PRD §🪟-1): `/chat`을 별도 팝업 창으로 띄운다. 창 이름을
 * `haruon-chat`으로 고정해 두면, 이미 열려 있는 채팅 창이 있을 때 브라우저가 새 창을 만들지 않고
 * 동일 이름의 기존 창을 재사용하므로 재클릭 시 다중 창 난립 없이 `focus()`만으로 기존 창을
 * 앞으로 가져온다. 순수 UI 내비게이션(백엔드 호출 없음)이라 상위(LayoutShell)에서 props로
 * 주입하지 않고 Header가 직접 소유한다.
 */
// todo: 팝업 차단으로 window.open이 null을 반환하는 경우의 폴백(새 탭 안내/토스트 등)과
// 새 창(popup) vs 새 탭 정책은 ROADMAP(CHAT) §🪟 //todo·Open Questions로 미확정 — 임의 확정 금지
function openChatWindow() {
  window.open('/chat', 'haruon-chat', 'popup,width=420,height=760')?.focus()
}

export function Header({
  collapsed,
  onToggleSidebar,
  isMobile,
  mobileSidebarOpen,
  isDark,
  onToggleDarkMode,
  me,
  profilePictureFileId,
  onLogout,
  logoutPending,
}: HeaderProps) {
  return (
    // 헤더는 라이트·다크 모두 어두운 크롬 스트립을 유지한다: 라이트=bg-primary, 다크=bg-card.
    // (다크에서 bg-primary는 near-white로 반전돼 과하게 밝으므로, 실존 다크 표면 토큰 card로 스왑)
    <header className="flex h-14 shrink-0 items-center gap-2 bg-primary px-4 text-primary-foreground dark:bg-card dark:text-card-foreground">
      {/* 사이드바 접힘/펼침(데스크톱) 또는 드로어 열림/닫힘(모바일) 토글(좌측 최전방). */}
      <SidebarToggleButton
        collapsed={collapsed}
        onToggle={onToggleSidebar}
        isMobile={isMobile}
        mobileSidebarOpen={mobileSidebarOpen}
      />
      {/*
        회사 로고(S1): 클릭 시 홈(`/`) 이동. 헤더는 이제 라이트·다크 모두 어두운 크롬 배경
        (라이트=bg-primary, 다크=bg-card)이므로 흰 글자 로고(haruon-logo.svg)를 양쪽에서 그대로
        쓴다 — 예전엔 다크에서 헤더가 near-white로 반전돼 검은 로고로 스왑했지만, 배경을 다크 톤으로
        고정하면서 그 스왑이 불필요해졌다. 사이드바 접힘 상태(데스크톱) 또는 모바일 뷰포트에서는
        아이콘 마크만 있는 sm 로고를 쓴다(모바일은 헤더 폭이 좁아 collapsed 값과 무관하게 항상
        축약형을 유지하는 것으로 결정됨, 배경과 무관하게 보이는 색상 조합이라 테마 분기 불필요).
      */}
      <Link to="/" className="flex shrink-0 items-center">
        {collapsed || isMobile ? (
          <img src="/haruon-logo-sm.svg" alt="HARUON" className="size-8" />
        ) : (
          <img src="/haruon-logo.svg" alt="HARUON" className="h-7 w-auto" />
        )}
      </Link>
      {/* 스페이서: 이후 요소를 우측으로 밀어낸다. */}
      <div className="flex flex-1 items-center justify-end gap-1.5 sm:gap-2">
        {/* 알림 벨(S3): 알림 기능ID가 api-endpoint.md에 아직 없어 무동작 슬롯만 배치한다. */}
        {/* todo: 알림 계약(기능ID) 확정 시 배지·드롭다운 연결 */}
        <button type="button" aria-label="알림" className={chromeIconButtonClass}>
          <Bell className="size-4" aria-hidden="true" />
        </button>
        {/* 채팅 버튼(S4, ROADMAP(CHAT) T0.2): haruon-chat 팝업 창으로 /chat을 연다. */}
        <button
          type="button"
          onClick={openChatWindow}
          aria-label="채팅"
          className={chromeIconButtonClass}
        >
          <MessageSquare className="size-4" aria-hidden="true" />
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
            <Sun className="size-4" aria-hidden="true" />
          ) : (
            <Moon className="size-4" aria-hidden="true" />
          )}
        </button>
        {me && (
          // 프로필 드롭다운(참고 스크린샷): 아바타+사용자명+셰브런 클릭 시 내 정보/로그아웃 메뉴 노출.
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
              {/* 내 정보 조회 페이지(ROADMAP T2.3)는 MyInfoPage로 연결됐다. */}
              <DropdownMenuItem asChild>
                <Link to="/me">
                  <UserRound aria-hidden="true" />
                  내 정보
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {/* 로그아웃(F012): 기존 헤더 단독 버튼에서 드롭다운 메뉴 항목으로 이전. */}
              <DropdownMenuItem
                variant="destructive"
                onSelect={onLogout}
                disabled={logoutPending}
              >
                <LogOut aria-hidden="true" />
                로그아웃
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  )
}
