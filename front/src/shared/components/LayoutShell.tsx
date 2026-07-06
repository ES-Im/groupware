import { useMutation } from '@tanstack/react-query'
import { Link, Outlet, useNavigate } from 'react-router'
import { logout } from '@/features/auth/api/logout'
import { useAuthStore } from '@/features/auth/store/authStore'
import { useMeQuery } from '@/features/employee/api/useMeQuery'
import { queryClient } from '@/shared/api/queryClient'
import { Button } from '@/shared/ui/button'

/**
 * 공통 레이아웃 셸(ROADMAP T0.7 / §B). Sidebar/Header/Footer 3영역, shadcn 기본 토큰만 사용한다
 * (커스텀 팔레트 없음, ROADMAP §Open Questions #3). 헤더의 로그인 사용자 표시·로그아웃은
 * M1(T1.6)에서 실데이터로 연결했다. 사이드바 3항목(홈/부서 멤버 목록/내 정보)은 T2.1-b에서
 * 실배선했다(PRD §B 메뉴 구조, 최소 요구 role은 전원 EMPLOYEE라 role별 노출 분기 없음).
 */
export function LayoutShell() {
  const navigate = useNavigate()
  const { data: me } = useMeQuery()
  const clearAuth = useAuthStore((state) => state.clear)
  const logoutMutation = useMutation({ mutationFn: logout })

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
    <div className="flex min-h-svh">
      <aside className="w-60 shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
        <nav className="flex flex-col gap-1 p-3 text-sm">
          <Link
            to="/"
            className="rounded-md px-3 py-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            홈
          </Link>
          <Link
            to="/department-members"
            className="rounded-md px-3 py-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            부서 멤버 목록
          </Link>
          <Link
            to="/me"
            className="rounded-md px-3 py-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            내 정보
          </Link>
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background px-4">
          <span className="font-semibold text-foreground">HARUON</span>
          <div className="flex items-center gap-3">
            {me && (
              // 내 정보 조회 페이지(ROADMAP T2.3)는 MyInfoPage로 연결됐다.
              // `/me`는 router.tsx에 실라우트로 배선되어 있어 이동 시 정상 렌더된다.
              <Link
                to="/me"
                className="text-sm text-foreground underline-offset-4 hover:underline"
              >
                {me.empBasicInfo.name}
              </Link>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
            >
              로그아웃
            </Button>
          </div>
        </header>
        <main className="flex-1">
          <Outlet />
        </main>
        <footer className="shrink-0 border-t border-border bg-background px-4 py-3 text-sm text-muted-foreground">
          {/* 회사명/카피라이트 placeholder(ROADMAP §Open Questions #3, 디자인 확정 전) */}
          © HARUON
        </footer>
      </div>
    </div>
  )
}
