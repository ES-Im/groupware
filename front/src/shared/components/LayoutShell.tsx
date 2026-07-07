import { useMutation } from '@tanstack/react-query'
import { useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router'
import { logout } from '@/features/auth/api/logout'
import { useAuthStore } from '@/features/auth/store/authStore'
import { useFilesInfosQuery } from '@/features/employee/api/useFilesInfosQuery'
import { useMeQuery } from '@/features/employee/api/useMeQuery'
import { queryClient } from '@/shared/api/queryClient'
import { Footer } from '@/shared/components/Footer'
import { Header } from '@/shared/components/Header'
import { Sidebar } from '@/shared/components/Sidebar'
import { getActiveProfilePicture } from '@/shared/lib/activeFiles'
import { useDarkMode } from '@/shared/lib/useDarkMode'
import { useIsMobile } from '@/shared/lib/useIsMobile'
import { useMobileSidebarOpen } from '@/shared/lib/useMobileSidebarOpen'
import { useSidebarCollapsed } from '@/shared/lib/useSidebarCollapsed'

/**
 * 공통 레이아웃 셸(ROADMAP T0.7 / §B). shadcn 기본 토큰만 사용한다(커스텀 팔레트 없음,
 * ROADMAP §Open Questions #3). 최상위를 flex-col로 구성해 헤더(Header)를 사이드바 포함 페이지
 * 전체 폭 최상단에 배치하고, 그 아래 flex-row로 사이드바(Sidebar)와 본문 컬럼을 좌우로 배치한다.
 * 본문 컬럼 안에만 main(Outlet)과 푸터(Footer)를 두어 푸터가 사이드바 영역을 침범하지 않게 한다.
 *
 * 사이드바 접힘/펼침 상태는 useSidebarCollapsed(localStorage 영속)가, 다크모드 여부는
 * useDarkMode(localStorage 영속, `<html>`에 `.dark` 클래스 토글)가 각각 소유한다. 데이터 계층
 * (로그인 사용자·프로필사진·로그아웃)은 이 컨테이너가 훅으로 조회해 Header에 props로 주입한다.
 * 사이드바 메뉴는 선언적 트리(sidebarMenuItems, ROADMAP T4.1)를 Sidebar 내부에서 hasRequiredRole로
 * 게이팅해 렌더링한다(신규 메뉴는 트리 추가만으로 자동 노출 제어).
 *
 * 모바일(뷰포트 < lg=1024px, useIsMobile)에서는 사이드바를 인라인이 아닌 오버레이 드로어로 여닫는다
 * (열림 상태는 useMobileSidebarOpen, 비영속). 헤더의 토글 버튼 하나가 뷰포트에 따라 서로 다른 상태를
 * 토글하도록 이 컨테이너에서 분기하고, 라우트 이동 시에는 드로어를 자동으로 닫는다(아래 useEffect).
 * 실제 Sheet 오버레이 마크업(shadcn Sheet 설치·시각 조립)은 다음 단계(ux-ui-stylist)의 몫이며,
 * 여기서는 상태·배선만 소유한다.
 */
export function LayoutShell() {
  const navigate = useNavigate()
  const location = useLocation()
  const { data: me } = useMeQuery()
  const clearAuth = useAuthStore((state) => state.clear)
  const roles = useAuthStore((state) => state.roles)
  const logoutMutation = useMutation({ mutationFn: logout })
  const { collapsed, toggle, expand } = useSidebarCollapsed()
  const { isDark, toggle: toggleDarkMode } = useDarkMode()
  const isMobile = useIsMobile()
  const {
    open: mobileSidebarOpen,
    toggle: toggleMobileSidebar,
    close: closeMobileSidebar,
  } = useMobileSidebarOpen()

  /**
   * 라우트 이동 시 모바일 드로어 자동 닫힘: 메뉴 클릭으로 페이지가 바뀐 뒤에도 오버레이가 계속
   * 떠 있으면 안 되는 모바일 UX 관례를 따른다. location.pathname 변화에만 반응하도록 의도적으로
   * closeMobileSidebar는 의존성 배열에서 제외한다(매 렌더 새로 생성되는 함수라 포함하면 드로어를
   * 연 직후의 재렌더에서 곧바로 다시 닫혀버리는 버그가 생긴다). 이미 닫힌 상태에서 호출돼도
   * setOpen(false)는 no-op이라 안전하다.
   */
  useEffect(() => {
    closeMobileSidebar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  /**
   * 사이드바 토글 버튼(SidebarToggleButton) 하나가 뷰포트에 따라 다른 상태를 토글한다:
   * 데스크톱은 접힘/펼침(collapsed), 모바일은 오버레이 드로어 열림(mobileSidebarOpen).
   */
  const handleToggleSidebar = isMobile ? toggleMobileSidebar : toggle

  /**
   * 헤더 프로필 아바타(F101, ROADMAP T5.3): useMeQuery()가 이미 보유한 RETRIEVE_ME_INFO의
   * activeFiles를 우선 재사용해 추가 API 호출 없이 활성 PROFILE_PICTURE fileId를 식별한다
   * (T5.1 getActiveProfilePicture 재사용). me.activeFiles가 비어있거나 미보유인 예외 상황에서만
   * RETRIEVE_FILES_INFOS로 대체 조회한다(useFilesInfosQuery, isActive===true 필터는
   * getActiveProfilePicture가 동일하게 적용).
   */
  const meActiveFiles = me?.activeFiles
  const needsFilesInfosFallback = !!me && (meActiveFiles == null || meActiveFiles.length === 0)
  const { data: filesInfos } = useFilesInfosQuery(needsFilesInfosFallback)
  const profilePictureFileId =
    getActiveProfilePicture(meActiveFiles ?? []) ?? getActiveProfilePicture(filesInfos ?? [])

  /**
   * 로그아웃(F012): LOGOUT 호출로 서버가 refreshToken 쿠키를 만료시키면, 성공 여부와 무관하게
   * 인메모리 상태(clear)·쿼리 캐시(queryClient.clear, 다음 로그인 사용자에게 이전 사용자의 me
   * 캐시가 노출되지 않도록)를 정리하고 로그인 페이지로 보낸다. 네트워크 실패로 서버 쪽 쿠키
   * 만료가 안 됐더라도 클라이언트를 미인증 상태로 되돌리는 것이 그룹웨어 UX상 안전하다.
   */
  async function handleLogout() {
    try {
      await logoutMutation.mutateAsync()
    } catch {
      // 로그아웃은 실패해도 클라이언트 상태를 강제 정리하므로 에러를 노출하지 않는다.
    } finally {
      clearAuth()
      queryClient.clear()
      navigate('/login', { replace: true })
    }
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      {/* 헤더: 사이드바 포함 페이지 전체 폭, 최상단. */}
      <Header
        collapsed={collapsed}
        onToggleSidebar={handleToggleSidebar}
        isMobile={isMobile}
        mobileSidebarOpen={mobileSidebarOpen}
        isDark={isDark}
        onToggleDarkMode={toggleDarkMode}
        me={me}
        profilePictureFileId={profilePictureFileId}
        onLogout={handleLogout}
        logoutPending={logoutMutation.isPending}
      />
      {/* 헤더 아래: 사이드바 + 본문 컬럼(좌우 배치). min-h-0으로 flex 기본 min-height:auto 오버플로 함정 회피. */}
      <div className="flex min-h-0 flex-1">
        <Sidebar
          collapsed={collapsed}
          roles={roles}
          onExpandSidebar={expand}
          isMobile={isMobile}
          mobileOpen={mobileSidebarOpen}
          onCloseMobileSidebar={closeMobileSidebar}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <main className="flex-1 overflow-y-auto bg-muted/30">
            <Outlet />
          </main>
          <Footer />
        </div>
      </div>
    </div>
  )
}
